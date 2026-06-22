import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { InvalidTokenError } from '../../common/exceptions/app.exception';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private cache: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'access') throw new InvalidTokenError('Invalid token type');
    if (payload.jti && await this.cache.exists(`jti:blacklist:${payload.jti}`)) {
      throw new InvalidTokenError('Token has been revoked');
    }
    return payload;
  }
}
