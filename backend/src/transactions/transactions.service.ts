import { Injectable } from '@nestjs/common';
import { TransactionStatus, FineStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { NotFoundError, ConflictError, BookUnavailableError } from '../common/exceptions/app.exception';
import { IssueBookDto, ReturnBookDto, WaiveFineDto } from './dto/transaction.dto';

// ₹1.00 per day — change this constant to update the fine rate globally
const PER_DAY_FINE_RATE = 1.0;

const TX_INCLUDE = { book: true, member: true, fines: true };
const FINE_INCLUDE = { member: true, transaction: { include: { book: true } } };

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async listTransactions(params: {
    page: number; pageSize: number;
    memberId?: number; bookId?: number; status?: TransactionStatus;
  }) {
    const where: any = {};
    if (params.memberId) where.member_id = params.memberId;
    if (params.bookId) where.book_id = params.bookId;
    if (params.status) where.status = params.status;

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where, include: TX_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async getTransaction(id: number) {
    const tx = await this.prisma.transaction.findUnique({ where: { id }, include: TX_INCLUDE });
    if (!tx) throw new NotFoundError('Transaction not found');
    return tx;
  }

  async getOverdueTransactions() {
    return this.prisma.transaction.findMany({
      where: { status: TransactionStatus.issued, due_date: { lt: new Date() } },
      include: { book: true, member: true },
      orderBy: { due_date: 'asc' },
    });
  }

  async issueBook(dto: IssueBookDto, issuedBy: number) {
    const member = await this.prisma.user.findFirst({ where: { id: dto.member_id, is_active: true, deleted_at: null } });
    if (!member) throw new NotFoundError('Member not found or inactive');

    const book = await this.prisma.book.findFirst({ where: { id: dto.book_id, is_active: true, deleted_at: null } });
    if (!book) throw new NotFoundError('Book not found');
    if (book.available_quantity <= 0) throw new BookUnavailableError();

    // $transaction ensures the quantity decrement and transaction record are atomic —
    // prevents over-issuing if two librarians issue the last copy simultaneously
    const [tx] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          book_id: dto.book_id,
          member_id: dto.member_id,
          issued_by: issuedBy,
          status: TransactionStatus.issued,
          issued_at: new Date(),
          due_date: new Date(dto.due_date),
          notes: dto.notes,
        },
        include: TX_INCLUDE,
      }),
      this.prisma.book.update({ where: { id: dto.book_id }, data: { available_quantity: { decrement: 1 } } }),
    ]);

    await this.invalidateCache();
    return tx;
  }

  async returnBook(txId: number, returnedBy: number, dto: ReturnBookDto) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: txId } });
    if (!tx) throw new NotFoundError('Transaction not found');
    if (tx.status !== TransactionStatus.issued) throw new ConflictError("This transaction is not in 'issued' state");

    const now = new Date();
    const updatedTx = await this.prisma.transaction.update({
      where: { id: txId },
      data: { status: TransactionStatus.returned, returned_at: now, returned_to: returnedBy, notes: dto.notes ?? tx.notes },
      include: TX_INCLUDE,
    });

    await this.prisma.book.update({ where: { id: tx.book_id }, data: { available_quantity: { increment: 1 } } });

    let fine = null;
    if (now > tx.due_date) {
      // Minimum 1 day fine even if returned a few hours late on the same overdue day
      const daysOverdue = Math.max(1, Math.floor((now.getTime() - tx.due_date.getTime()) / 86400000));
      fine = await this.prisma.fine.create({
        data: {
          transaction_id: tx.id,
          member_id: tx.member_id,
          amount: Math.round(daysOverdue * PER_DAY_FINE_RATE * 100) / 100,
          per_day_rate: PER_DAY_FINE_RATE,
          days_overdue: daysOverdue,
          status: FineStatus.pending,
        },
        include: FINE_INCLUDE,
      });
    }

    await this.invalidateCache();
    return { transaction: updatedTx, fine };
  }

  async markLost(txId: number, librarianId: number) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: txId } });
    if (!tx) throw new NotFoundError('Transaction not found');
    if (tx.status !== TransactionStatus.issued) throw new ConflictError("Transaction is not in 'issued' state");

    // Flat fine of 30 days for a lost book — book quantity is NOT incremented since it's gone
    const [updatedTx] = await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: txId },
        data: { status: TransactionStatus.lost, returned_to: librarianId },
        include: TX_INCLUDE,
      }),
      this.prisma.fine.create({
        data: {
          transaction_id: tx.id,
          member_id: tx.member_id,
          amount: 30 * PER_DAY_FINE_RATE,
          per_day_rate: PER_DAY_FINE_RATE,
          days_overdue: 30,
          status: FineStatus.pending,
        },
      }),
    ]);

    await this.invalidateCache();
    return updatedTx;
  }

  // ── Fines ────────────────────────────────────────────────────────────────

  async listFines(params: { page: number; pageSize: number; memberId?: number; status?: FineStatus }) {
    const where: any = {};
    if (params.memberId) where.member_id = params.memberId;
    if (params.status) where.status = params.status;

    const [fines, total] = await this.prisma.$transaction([
      this.prisma.fine.findMany({
        where, include: FINE_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.fine.count({ where }),
    ]);

    return { fines, total };
  }

  async getFine(id: number) {
    const fine = await this.prisma.fine.findUnique({ where: { id }, include: FINE_INCLUDE });
    if (!fine) throw new NotFoundError('Fine not found');
    return fine;
  }

  async payFine(id: number) {
    const fine = await this.prisma.fine.findUnique({ where: { id } });
    if (!fine) throw new NotFoundError('Fine not found');
    if (fine.status !== FineStatus.pending) throw new ConflictError('Fine is not in pending state');
    return this.prisma.fine.update({ where: { id }, data: { status: FineStatus.paid, paid_at: new Date() }, include: FINE_INCLUDE });
  }

  async waiveFine(id: number, waivedBy: number, dto: WaiveFineDto) {
    const fine = await this.prisma.fine.findUnique({ where: { id } });
    if (!fine) throw new NotFoundError('Fine not found');
    if (fine.status !== FineStatus.pending) throw new ConflictError('Fine is not in pending state');
    return this.prisma.fine.update({
      where: { id },
      data: { status: FineStatus.waived, waived_by: waivedBy, waived_at: new Date(), waive_reason: dto.reason },
      include: FINE_INCLUDE,
    });
  }

  // Clears all transaction-related caches and the dashboard stats so counts stay accurate
  private async invalidateCache() {
    await this.cache.deletePattern('transactions:*');
    await this.cache.delete('dashboard:stats');
  }
}
