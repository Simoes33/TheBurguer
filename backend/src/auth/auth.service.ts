import { Injectable, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { createClient } from '@supabase/supabase-js';

// Provedores sociais suportados — whitelist explícita (OWASP A03)
const ALLOWED_PROVIDERS = new Set(['google']);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  private resetCodes = new Map<string, { code: string; expires: Date }>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      // Log com email mascarado para não vazar PII nos logs
      this.logger.warn(`Failed login attempt for email: ${loginDto.email.replace(/(.{2}).+(@.+)/, '$1***$2')}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async socialLogin(token: string, provider?: string) {
    // ── Validar provider — aceita apenas provedores conhecidos ────────────────
    if (provider && !ALLOWED_PROVIDERS.has(provider)) {
      throw new BadRequestException(`Provider '${provider}' is not supported`);
    }

    // 1. Valida o token com o Supabase
    const { data: { user: sbUser }, error } = await this.supabase.auth.getUser(token);

    if (error || !sbUser) {
      throw new UnauthorizedException('Token social inválido');
    }

    // 2. Busca ou cria o usuário no nosso banco
    let user = await this.usersService.findByEmail(sbUser.email);

    if (!user) {
      // Usa crypto.randomBytes para senha aleatória criptograficamente segura
      const randomPassword = crypto.randomBytes(32).toString('hex');
      user = await this.usersService.create({
        email: sbUser.email,
        name: sbUser.user_metadata?.full_name || sbUser.email.split('@')[0],
        password: await bcrypt.hash(randomPassword, 12),
        phone: sbUser.phone || '',
      }) as any;
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
