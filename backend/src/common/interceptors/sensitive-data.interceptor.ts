import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SensitiveDataInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this.sanitize(data);
      }),
    );
  }

  private sanitize(data: any): any {
    if (!data || typeof data !== 'object') return data;

    // Se for um objeto Date, retorna ele mesmo sem tentar espalhar ou recursar
    if (data instanceof Date) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    // Cria uma cópia para não mutar o original se necessário
    const cleanData = { ...data };

    // Remove campos sensíveis
    const sensitiveFields = ['password', 'passwordHash', 'secret'];
    
    for (const field of sensitiveFields) {
      if (field in cleanData) {
        delete cleanData[field];
      }
    }

    // Recursão para objetos aninhados (como o usuário dentro de um pedido)
    for (const key in cleanData) {
      if (typeof cleanData[key] === 'object') {
        cleanData[key] = this.sanitize(cleanData[key]);
      }
    }

    return cleanData;
  }
}
