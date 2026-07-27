import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Tipos de arquivo permitidos (OWASP: validação server-side obrigatória)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    // ── Validação de tamanho ──────────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds the 5MB limit');
    }

    // ── Validação de MIME type (server-side, não confiar no cliente) ──────────
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Accepted types: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      );
    }

    // ── Extrai e valida a extensão do arquivo original ────────────────────────
    const rawExt = (file.originalname.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      throw new BadRequestException('File extension not allowed');
    }

    // ── Gera nome único e seguro — nunca usa o nome original (path traversal) ─
    const safeFileName = `${uuidv4()}.${rawExt}`;
    const filePath = `${folder}/${safeFileName}`;

    const { error } = await this.supabase.storage
      .from('products')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      // Não vaza detalhes internos do Supabase para o cliente
      throw new BadRequestException('File upload failed. Please try again.');
    }

    const { data: publicUrlData } = this.supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }
}
