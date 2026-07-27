import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Sobrescreve para não lançar erro se o token estiver ausente ou inválido
  handleRequest(err, user, info) {
    return user || null;
  }
}
