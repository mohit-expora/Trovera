import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Cacheable, CacheEvict } from '../common/decorators/cacheable.decorator';
import { AdminUser } from '../common/decorators/admin-user.decorator';
import { TTL } from '../cache/cache.service';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto, CreateCategoryDto } from './dto/book.dto';
import { PaginationDto, paginatedResponse } from '../common/dto/pagination.dto';
import { SessionUser } from '../types/session';

// Guard order matters: AdminAuthGuard populates req.user first, then PermissionsGuard reads it
@ApiTags('books')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  // Cache key includes the full URL so different filter combinations cache independently
  @Get()
  @RequirePermissions('books:read')
  @Cacheable((req) => `books:list:${req.url}`, TTL.BOOKS_LIST)
  async listBooks(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
    @Query('category_id') categoryId?: string,
    @Query('language') language?: string,
    @Query('author') author?: string,
    @Query('available_only') availableOnly?: string,
    @Query('sort_by') sortBy?: string,
    @Query('sort_order') sortOrder?: 'asc' | 'desc',
  ) {
    const { books, total } = await this.booksService.listBooks({
      page: pagination.page || 1,
      pageSize: pagination.page_size || 20,
      search,
      categoryId,
      language,
      author,
      availableOnly: availableOnly === 'true',
      sortBy,
      sortOrder,
    });
    return paginatedResponse(books, total, pagination.page || 1, pagination.page_size || 20);
  }

  @Get('categories')
  @RequirePermissions('categories:read')
  @Cacheable(() => 'categories:all', TTL.CATEGORIES)
  async listCategories() {
    const cats = await this.booksService.listCategories();
    return { success: true, data: cats };
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('categories:create')
  @CacheEvict('categories:all')
  async createCategory(@Body() dto: CreateCategoryDto) {
    const cat = await this.booksService.createCategory(dto);
    return { success: true, data: cat };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('books:create')
  @CacheEvict('books:list:*')
  async createBook(@Body() dto: CreateBookDto, @AdminUser() user: SessionUser) {
    const book = await this.booksService.createBook(dto, user.id);
    return { success: true, data: book };
  }

  @Get(':id')
  @RequirePermissions('books:read')
  @Cacheable((req) => `book:${req.params.id}`, TTL.BOOK_DETAIL)
  async getBook(@Param('id', ParseIntPipe) id: number) {
    const book = await this.booksService.getBook(id);
    return { success: true, data: book };
  }

  @Patch(':id')
  @RequirePermissions('books:update')
  @CacheEvict((req) => `book:${req.params.id}`, 'books:list:*')
  async updateBook(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto) {
    const book = await this.booksService.updateBook(id, dto);
    return { success: true, data: book };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('books:delete')
  @CacheEvict((req) => `book:${req.params.id}`, 'books:list:*')
  async deleteBook(@Param('id', ParseIntPipe) id: number) {
    await this.booksService.deleteBook(id);
  }

  // memoryStorage keeps the upload in RAM so sharp can process it without a temp file
  @Post(':id/image')
  @RequirePermissions('books:image:upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadBookImage(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    const imageUrl = await this.booksService.saveBookImage(file, id);
    const book = await this.booksService.updateBookImage(id, imageUrl);
    return { success: true, data: book };
  }
}
