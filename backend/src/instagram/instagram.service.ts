import { Injectable, Logger } from '@nestjs/common';

export interface InstaPost {
  id: string;
  url: string;
  thumbnail: string;
  permalink: string;
  caption?: string;
  mediaType: string;
  timestamp: string;
}

interface CacheEntry {
  posts: InstaPost[];
  fetchedAt: number;
}

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  private readonly GRAPH_API = 'https://graph.instagram.com';
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

  private cache: CacheEntry | null = null;
  private refreshing = false; // flag para evitar múltiplas revalidações simultâneas

  async getFeed(): Promise<InstaPost[]> {
    const isStale =
      !this.cache || Date.now() - this.cache.fetchedAt > this.CACHE_TTL_MS;

    if (isStale && !this.refreshing) {
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

      if (accessToken) {
        // Padrão stale-while-revalidate:
        // Dispara o refresh em background sem await — responde imediatamente com o cache atual.
        this.refreshing = true;
        this.fetchFromGraphAPI(accessToken)
          .then((posts) => {
            this.cache = { posts, fetchedAt: Date.now() };
            this.logger.log(`Cache do Instagram revalidado com ${posts.length} posts.`);
          })
          .catch((err) => {
            this.logger.error(`Falha ao revalidar feed do Instagram: ${err.message}`);
          })
          .finally(() => {
            this.refreshing = false;
          });
      } else {
        this.logger.warn(
          'INSTAGRAM_ACCESS_TOKEN não configurado. ' +
          'Veja INSTAGRAM_SETUP.md para instruções de configuração.',
        );
        return [];
      }
    } else if (isStale) {
      this.logger.log('Revalidação do Instagram já em andamento, servindo cache atual.');
    } else {
      this.logger.log('Servindo feed do Instagram a partir do cache.');
    }

    // Retorna imediatamente o cache existente (pode estar levemente desatualizado — isso é aceitável)
    return this.cache?.posts ?? [];
  }

  private async fetchFromGraphAPI(accessToken: string): Promise<InstaPost[]> {
    try {
      this.logger.log('Buscando feed do Instagram via Graph API...');

      // Passo 1: Obter o ID do usuário
      const meRes = await fetch(
        `${this.GRAPH_API}/me?fields=id,username&access_token=${accessToken}`,
      );
      if (!meRes.ok) {
        const err = await meRes.text();
        throw new Error(`Graph API /me falhou: ${err}`);
      }
      const me = (await meRes.json()) as { id: string; username: string };

      // Passo 2: Buscar as mídias
      const mediaRes = await fetch(
        `${this.GRAPH_API}/${me.id}/media` +
        `?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp` +
        `&limit=12&access_token=${accessToken}`,
      );
      if (!mediaRes.ok) {
        const err = await mediaRes.text();
        throw new Error(`Graph API /media falhou: ${err}`);
      }

      const mediaData = (await mediaRes.json()) as {
        data: Array<{
          id: string;
          media_type: string;
          media_url?: string;
          thumbnail_url?: string;
          permalink: string;
          caption?: string;
          timestamp: string;
        }>;
      };

      const posts: InstaPost[] = mediaData.data
        .filter(
          (m) =>
            m.media_type === 'IMAGE' ||
            m.media_type === 'CAROUSEL_ALBUM' ||
            m.media_type === 'VIDEO',
        )
        .map((m) => ({
          id: m.id,
          mediaType: m.media_type,
          url:
            m.media_type === 'VIDEO'
              ? (m.thumbnail_url ?? m.media_url ?? '')
              : (m.media_url ?? ''),
          thumbnail: m.thumbnail_url ?? m.media_url ?? '',
          permalink: m.permalink,
          caption: m.caption,
          timestamp: m.timestamp,
        }));

      this.logger.log(`${posts.length} posts obtidos do Instagram Graph API.`);
      return posts;
    } catch (error) {
      this.logger.error(`Erro no Instagram Graph API: ${error.message}`);

      // Em caso de erro na revalidação, mantém o cache existente (stale-on-error)
      if (this.cache) {
        this.logger.warn('Mantendo cache desatualizado do Instagram após erro de revalidação.');
        return this.cache.posts;
      }
      return [];
    }
  }

  /** Força revalidação imediata do cache. Pode ser chamado por endpoint admin. */
  async refreshCache(): Promise<{ success: boolean; count: number }> {
    this.cache = null;
    this.refreshing = false;
    const posts = await this.getFeed();
    // getFeed inicia o refresh em background; aguarda finalização
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return { success: true, count: this.cache?.posts.length ?? posts.length };
  }
}
