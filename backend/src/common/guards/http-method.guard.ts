import {
  Injectable,
  CanActivate,
  ExecutionContext,
  MethodNotAllowedException,
} from '@nestjs/common';
import { Request } from 'express';

const FORBIDDEN_METHODS = new Set(['TRACE', 'TRACK', 'CONNECT']);

@Injectable()
export class HttpMethodGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const method = (req.method || '').toUpperCase();

    if (FORBIDDEN_METHODS.has(method)) {
      throw new MethodNotAllowedException(
        `HTTP Method '${method}' is not allowed on this server.`,
      );
    }

    return true;
  }
}
