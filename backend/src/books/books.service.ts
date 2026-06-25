import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundError, ConflictError } from '../common/exceptions/app.exception';
import { CreateBookDto, UpdateBookDto, CreateCategoryDto } from './dto/book.dto';

// Converts a category name to a URL-safe slug used as a unique identifier
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

@Injectable()
export class BooksService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async listBooks(params: {
    page: number; pageSize: number; search?: string; categoryId?: string;
    language?: string; author?: string; availableOnly?: boolean;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
  }) {
    const where: any = { deleted_at: null, is_active: true };
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { author: { contains: params.search, mode: 'insensitive' } },
        { isbn: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.categoryId) where.category_id = params.categoryId;
    if (params.language) where.language = params.language;
    if (params.author) where.author = { contains: params.author, mode: 'insensitive' };
    if (params.availableOnly) where.available_quantity = { gt: 0 };

    // Whitelist sortBy to prevent arbitrary field injection
    const validSortFields = ['created_at', 'title', 'author', 'available_quantity'];
    const sortField = validSortFields.includes(params.sortBy) ? params.sortBy : 'created_at';
    const sortDir = params.sortOrder === 'asc' ? 'asc' : 'desc';

    // $transaction([findMany, count]) fetches both in a single round-trip
    const [books, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        where,
        include: { category: true },
        orderBy: { [sortField]: sortDir },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.book.count({ where }),
    ]);

    return { books, total };
  }

  async getBook(id: number) {
    const book = await this.prisma.book.findFirst({
      where: { id, is_active: true, deleted_at: null },
      include: { category: true },
    });
    if (!book) throw new NotFoundError('Book not found');
    return book;
  }

  async createBook(dto: CreateBookDto, createdBy: number) {
    if (dto.isbn) {
      const existing = await this.prisma.book.findUnique({ where: { isbn: dto.isbn } });
      if (existing) throw new ConflictError('A book with this ISBN already exists');
    }
    return this.prisma.book.create({
      data: { ...dto, available_quantity: dto.total_quantity || 1, created_by: createdBy },
      include: { category: true },
    });
  }

  async updateBook(id: number, dto: UpdateBookDto) {
    const book = await this.prisma.book.findFirst({ where: { id, deleted_at: null } });
    if (!book) throw new NotFoundError('Book not found');

    const data: any = { ...dto };
    if (dto.total_quantity !== undefined) {
      // Adjust available_quantity by the delta so copies on loan are not lost from the count
      data.available_quantity = Math.max(0, book.available_quantity + (dto.total_quantity - book.total_quantity));
    }

    return this.prisma.book.update({ where: { id }, data, include: { category: true } });
  }

  // Soft delete — keeps the book record for historical transaction references
  async deleteBook(id: number): Promise<void> {
    const book = await this.prisma.book.findFirst({ where: { id, deleted_at: null } });
    if (!book) throw new NotFoundError('Book not found');
    await this.prisma.book.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  async updateBookImage(id: number, imageUrl: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundError('Book not found');
    return this.prisma.book.update({ where: { id }, data: { cover_image_url: imageUrl }, include: { category: true } });
  }

  async saveBookImage(file: Express.Multer.File, bookId: number): Promise<string> {
    const uploadDir = path.resolve(this.config.get<string>('uploadDir', './uploads'), 'books');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `${bookId}-${Date.now()}.webp`;
    // Normalise to 400×600 cover aspect ratio and compress to WebP for consistent sizes
    await (sharp as any)(file.buffer).resize(400, 600, { fit: 'cover' }).webp({ quality: 85 }).toFile(path.join(uploadDir, filename));
    return `/uploads/books/${filename}`;
  }

  async listCategories() {
    return this.prisma.bookCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.bookCategory.findUnique({ where: { slug } });
    if (existing) throw new ConflictError('A category with this name already exists');
    return this.prisma.bookCategory.create({ data: { name: dto.name, slug, description: dto.description } });
  }
}
