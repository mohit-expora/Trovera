import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { TranslateService } from './translate.service';

class TranslateDto {
  @IsString()
  text: string;

  @IsString()
  source_lang: string;

  @IsString()
  target_lang: string;
}

@ApiTags('translate')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('translate')
export class TranslateController {
  constructor(private translateService: TranslateService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async translate(@Body() dto: TranslateDto) {
    const translated = await this.translateService.translate(dto.text, dto.source_lang, dto.target_lang);
    return { success: true, data: { translated_text: translated, source_lang: dto.source_lang, target_lang: dto.target_lang } };
  }
}
