import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const isProduction = process.env.NODE_ENV === 'production';
        const secret = process.env.JWT_SECRET;
        if (isProduction && !secret) {
          throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
        }
        return {
          secret: secret || 'theburguer_super_secret_key_2026_!@#',
          signOptions: { expiresIn: '1d' },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
