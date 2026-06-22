import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService, TTL } from '../cache/cache.service';
import { NotFoundError, ConflictError } from '../common/exceptions/app.exception';
import { CreateBookDto, UpdateBookDto, CreateCategoryDto } from './dto/book.dto';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

@Injectable()
export class BooksService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
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

    const validSortFields = ['created_at', 'title', 'author', 'available_quantity'];
    const sortField = validSortFields.includes(params.sortBy) ? params.sortBy : 'created_at';
    const sortDir = params.sortOrder === 'asc' ? 'asc' : 'desc';

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

  async getBook(id: string) {
    const cached = await this.cache.get(`book:${id}`);
    if (cached) return cached;

    const book = await this.prisma.book.findFirst({
      where: { id, is_active: true, deleted_at: null },
      include: { category: true },
    });
    if (!book) throw new NotFoundError('Book not found');

    await this.cache.set(`book:${id}`, book, TTL.BOOK_DETAIL);
    return book;
  }

  async createBook(dto: CreateBookDto, createdBy: string) {
    if (dto.isbn) {
      const existing = await this.prisma.book.findUnique({ where: { isbn: dto.isbn } });
      if (existing) throw new ConflictError('A book with this ISBN already exists');
    }

    const book = await this.prisma.book.create({
      data: { ...dto, available_quantity: dto.total_quantity || 1, created_by: createdBy },
      include: { category: true },
    });
    await this.cache.deletePattern('books:*');
    return book;
  }

  async updateBook(id: string, dto: UpdateBookDto) {
    const book = await this.prisma.book.findFirst({ where: { id, deleted_at: null } });
    if (!book) throw new NotFoundError('Book not found');

    const data: any = { ...dto };
    if (dto.total_quantity !== undefined) {
      data.available_quantity = Math.max(0, book.available_quantity + (dto.total_quantity - book.total_quantity));
    }

    const updated = await this.prisma.book.update({ where: { id }, data, include: { category: true } });
    await this.cache.delete(`book:${id}`);
    await this.cache.deletePattern('books:*');
    return updated;
  }

  async deleteBook(id: string): Promise<void> {
    const book = await this.prisma.book.findFirst({ where: { id, deleted_at: null } });
    if (!book) throw new NotFoundError('Book not found');
    await this.prisma.book.update({ where: { id }, data: { deleted_at: new Date() } });
    await this.cache.delete(`book:${id}`);
    await this.cache.deletePattern('books:*');
  }

  async updateBookImage(id: string, imageUrl: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundError('Book not found');
    const updated = await this.prisma.book.update({ where: { id }, data: { cover_image_url: imageUrl }, include: { category: true } });
    await this.cache.delete(`book:${id}`);
    return updated;
  }

  async saveBookImage(file: Express.Multer.File, bookId: string): Promise<string> {
    const uploadDir = path.resolve(this.config.get<string>('uploadDir', './uploads'), 'books');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `${bookId}-${Date.now()}.webp`;
    await (sharp as any)(file.buffer).resize(400, 600, { fit: 'cover' }).webp({ quality: 85 }).toFile(path.join(uploadDir, filename));
    return `/uploads/books/${filename}`;
  }

  async listCategories() {
    const cached = await this.cache.get('categories:all');
    if (cached) return cached;
    const cats = await this.prisma.bookCategory.findMany({ orderBy: { name: 'asc' } });
    await this.cache.set('categories:all', cats, TTL.CATEGORIES);
    return cats;
  }

  async createCategory(dto: CreateCategoryDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.bookCategory.findUnique({ where: { slug } });
    if (existing) throw new ConflictError('A category with this name already exists');
    const cat = await this.prisma.bookCategory.create({ data: { name: dto.name, slug, description: dto.description } });
    await this.cache.delete('categories:all');
    return cat;
  }
}
