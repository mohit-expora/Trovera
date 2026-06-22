import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService, TTL } from '../cache/cache.service';

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name);

  constructor(
    private config: ConfigService,
    private cache: CacheService,
  ) {}

  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    if (sourceLang === targetLang) return text;

    const cacheKey = `translate:${sourceLang}:${targetLang}:${Buffer.from(text).toString('base64').slice(0, 64)}`;
    const cached = await this.cache.get<string>(cacheKey);
    if (cached) return cached;

    let result: string | null = null;

    const deeplxUrl = this.config.get<string>('translation.deeplxUrl');
    if (deeplxUrl) {
      result = await this.translateViaDeeplx(deeplxUrl, text, sourceLang, targetLang);
    }

    const libreUrl = this.config.get<string>('translation.libreTranslateUrl');
    if (!result && libreUrl) {
      result = await this.translateViaLibre(libreUrl, text, sourceLang, targetLang);
    }

    if (!result) {
      this.logger.warn('No translation service configured, returning original text');
      return text;
    }

    await this.cache.set(cacheKey, result, TTL.TRANSLATIONS);
    return result;
  }

  private async translateViaDeeplx(url: string, text: string, source: string, target: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source_lang: source.toUpperCase(), target_lang: target.toUpperCase() }),
      });
      if (!response.ok) return null;
      const data = await response.json() as any;
      return data?.data || null;
    } catch {
      return null;
    }
  }

  private async translateViaLibre(url: string, text: string, source: string, target: string): Promise<string | null> {
    try {
      const response = await fetch(`${url}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source, target, format: 'text' }),
      });
      if (!response.ok) return null;
      const data = await response.json() as any;
      return data?.translatedText || null;
    } catch {
      return null;
    }
  }
}
