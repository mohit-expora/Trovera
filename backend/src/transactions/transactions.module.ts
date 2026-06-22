import { Module } from '@nestjs/common';
import { TransactionsController, FinesController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  controllers: [TransactionsController, FinesController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
