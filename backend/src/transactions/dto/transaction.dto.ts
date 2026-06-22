import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class IssueBookDto {
  @IsUUID()
  book_id: string;

  @IsUUID()
  member_id: string;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReturnBookDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WaiveFineDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
