import { IsString, IsDateString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class IssueBookDto {
  @Type(() => Number)
  @IsInt()
  book_id: number;

  @Type(() => Number)
  @IsInt()
  member_id: number;

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
