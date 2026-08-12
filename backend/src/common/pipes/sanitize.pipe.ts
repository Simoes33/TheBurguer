import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return this.sanitizeObject(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item, metadata));
    }
    return value;
  }

  private sanitizeString(str: string): string {
    return str
      // Strip HTML tags
      .replace(/<[^>]*>?/gm, '')
      // Strip inline event handlers (onerror, onload, onclick, etc)
      .replace(/on\w+\s*=/gi, '')
      // Strip javascript: pseudo-protocols
      .replace(/javascript\s*:/gi, '');
  }

  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string') {
        sanitized[key] = this.sanitizeString(val);
      } else if (val && typeof val === 'object') {
        sanitized[key] = this.transform(val, { type: 'body' });
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }
}
