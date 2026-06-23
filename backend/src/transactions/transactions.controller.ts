import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
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
    @AdminUser() currentUser: any,
    @Query('member_id') memberId?: string,
    @Query('book_id') bookId?: string,
    @Query('status') status?: TransactionStatus,
  ) {
    const effectiveMemberId = currentUser.role === UserRole.member ? currentUser.sub : memberId;
    const { transactions, total } = await this.txService.listTransactions({
      page: pagination.page || 1, pageSize: pagination.page_size || 20,
      memberId: effectiveMemberId, bookId, status,
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
  async issueBook(@Body() dto: IssueBookDto, @AdminUser() currentUser: any) {
    return { success: true, data: await this.txService.issueBook(dto, currentUser.sub) };
  }

  @Get(':id')
  @RequirePermissions('transactions:read')
  async getTransaction(@Param('id') id: string, @AdminUser() currentUser: any) {
    const tx = await this.txService.getTransaction(id);
    if (currentUser.role === UserRole.member && tx.member_id !== currentUser.sub) {
      throw new AuthorizationError('You can only view your own transactions');
    }
    return { success: true, data: tx };
  }

  @Patch(':id/return')
  @RequirePermissions('transactions:return')
  async returnBook(@Param('id') id: string, @Body() dto: ReturnBookDto, @AdminUser() currentUser: any) {
    return { success: true, data: await this.txService.returnBook(id, currentUser.sub, dto) };
  }

  @Patch(':id/lost')
  @RequirePermissions('transactions:lost')
  async markLost(@Param('id') id: string, @AdminUser() currentUser: any) {
    return { success: true, data: await this.txService.markLost(id, currentUser.sub) };
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
      page: pagination.page || 1, pageSize: pagination.page_size || 20, memberId, status,
    });
    return paginatedResponse(fines, total, pagination.page || 1, pagination.page_size || 20);
  }

  @Get(':id')
  @RequirePermissions('fines:read')
  async getFine(@Param('id') id: string) {
    return { success: true, data: await this.txService.getFine(id) };
  }

  @Post(':id/pay')
  @RequirePermissions('fines:pay')
  async payFine(@Param('id') id: string) {
    return { success: true, data: await this.txService.payFine(id) };
  }

  @Patch(':id/waive')
  @RequirePermissions('fines:waive')
  async waiveFine(@Param('id') id: string, @Body() dto: WaiveFineDto, @AdminUser() currentUser: any) {
    return { success: true, data: await this.txService.waiveFine(id, currentUser.sub, dto) };
  }
}
