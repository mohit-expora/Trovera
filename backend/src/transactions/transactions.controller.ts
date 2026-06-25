import {
  Controller, Get, Post, Patch, Param, ParseIntPipe, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionStatus, FineStatus, UserRole } from '@prisma/client';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { AdminUser } from '../common/decorators/admin-user.decorator';
import { TransactionsService } from './transactions.service';
import { IssueBookDto, ReturnBookDto, WaiveFineDto } from './dto/transaction.dto';
import { PaginationDto, paginatedResponse } from '../common/dto/pagination.dto';
import { AuthorizationError } from '../common/exceptions/app.exception';
import { SessionUser } from '../types/session';

// FinesController lives in this file because it shares TransactionsService and the
// two domains are tightly coupled (a fine is always created through a transaction event)
@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private txService: TransactionsService) {}

  @Get()
  @RequirePermissions('transactions:list')
  async listTransactions(
    @Query() pagination: PaginationDto,
    @AdminUser() currentUser: SessionUser,
    @Query('member_id') memberId?: string,
    @Query('book_id') bookId?: string,
    @Query('status') status?: TransactionStatus,
  ) {
    // Members can only see their own transactions regardless of query params
    const effectiveMemberId = currentUser.role === UserRole.member
      ? currentUser.id
      : memberId ? parseInt(memberId, 10) : undefined;
    const { transactions, total } = await this.txService.listTransactions({
      page: pagination.page || 1, pageSize: pagination.page_size || 20,
      memberId: effectiveMemberId,
      bookId: bookId ? parseInt(bookId, 10) : undefined,
      status,
    });
    return paginatedResponse(transactions, total, pagination.page || 1, pagination.page_size || 20);
  }

  @Get('overdue')
  @RequirePermissions('transactions:list')
  async getOverdue() {
    return { success: true, data: await this.txService.getOverdueTransactions() };
  }

  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('transactions:issue')
  async issueBook(@Body() dto: IssueBookDto, @AdminUser() currentUser: SessionUser) {
    return { success: true, data: await this.txService.issueBook(dto, currentUser.id) };
  }

  @Get(':id')
  @RequirePermissions('transactions:read')
  async getTransaction(@Param('id', ParseIntPipe) id: number, @AdminUser() currentUser: SessionUser) {
    const tx = await this.txService.getTransaction(id);
    if (currentUser.role === UserRole.member && tx.member_id !== currentUser.id) {
      throw new AuthorizationError('You can only view your own transactions');
    }
    return { success: true, data: tx };
  }

  @Patch(':id/return')
  @RequirePermissions('transactions:return')
  async returnBook(@Param('id', ParseIntPipe) id: number, @Body() dto: ReturnBookDto, @AdminUser() currentUser: SessionUser) {
    return { success: true, data: await this.txService.returnBook(id, currentUser.id, dto) };
  }

  @Patch(':id/lost')
  @RequirePermissions('transactions:lost')
  async markLost(@Param('id', ParseIntPipe) id: number, @AdminUser() currentUser: SessionUser) {
    return { success: true, data: await this.txService.markLost(id, currentUser.id) };
  }
}

@ApiTags('fines')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, PermissionsGuard)
@Controller('fines')
export class FinesController {
  constructor(private txService: TransactionsService) {}

  @Get()
  @RequirePermissions('fines:list')
  async listFines(
    @Query() pagination: PaginationDto,
    @Query('member_id') memberId?: string,
    @Query('status') status?: FineStatus,
  ) {
    const { fines, total } = await this.txService.listFines({
      page: pagination.page || 1, pageSize: pagination.page_size || 20,
      memberId: memberId ? parseInt(memberId, 10) : undefined,
      status,
    });
    return paginatedResponse(fines, total, pagination.page || 1, pagination.page_size || 20);
  }

  @Get(':id')
  @RequirePermissions('fines:read')
  async getFine(@Param('id', ParseIntPipe) id: number) {
    return { success: true, data: await this.txService.getFine(id) };
  }

  @Post(':id/pay')
  @RequirePermissions('fines:pay')
  async payFine(@Param('id', ParseIntPipe) id: number) {
    return { success: true, data: await this.txService.payFine(id) };
  }

  @Patch(':id/waive')
  @RequirePermissions('fines:waive')
  async waiveFine(@Param('id', ParseIntPipe) id: number, @Body() dto: WaiveFineDto, @AdminUser() currentUser: SessionUser) {
    return { success: true, data: await this.txService.waiveFine(id, currentUser.id, dto) };
  }
}
