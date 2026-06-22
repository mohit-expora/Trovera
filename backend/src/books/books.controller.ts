import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto, CreateCategoryDto } from './dto/book.dto';
import { PaginationDto, paginatedResponse } from '../common/dto/pagination.dto';

@ApiTags('books')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('books')
export class BooksController {
  constructor(private booksService: BooksService) {}

  @Get()
  @RequirePermissions('books:read')
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
  async listCategories() {
    const cats = await this.booksService.listCategories();
    return { success: true, data: cats };
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('categories:create')
  async createCategory(@Body() dto: CreateCategoryDto) {
    const cat = await this.booksService.createCategory(dto);
    return { success: true, data: cat };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('books:create')
  async createBook(@Body() dto: CreateBookDto, @CurrentUser() user: any) {
    const book = await this.booksService.createBook(dto, user.sub);
    return { success: true, data: book };
  }

  @Get(':id')
  @RequirePermissions('books:read')
  async getBook(@Param('id') id: string) {
    const book = await this.booksService.getBook(id);
    return { success: true, data: book };
  }

  @Patch(':id')
  @RequirePermissions('books:update')
  async updateBook(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    const book = await this.booksService.updateBook(id, dto);
    return { success: true, data: book };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('books:delete')
  async deleteBook(@Param('id') id: string) {
    await this.booksService.deleteBook(id);
  }

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
  async uploadBookImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const imageUrl = await this.booksService.saveBookImage(file, id);
    const book = await this.booksService.updateBookImage(id, imageUrl);
    return { success: true, data: book };
  }
}
