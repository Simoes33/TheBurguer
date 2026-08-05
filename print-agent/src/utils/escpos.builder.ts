/**
 * Utilitário para formatar cupons de impressão para a impressora Knup KP-1025 (58mm).
 * Bobina de 58mm suporta aproximadamente 32 caracteres por linha em largura normal.
 */

const LINE_WIDTH = 32;

/**
 * Sanitiza o texto para remover acentos e caracteres especiais que a Knup KP-1025
 * em modo ESC/POS direto pode interpretar incorretamente.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos (acentos)
    .replace(/[º°]/g, '.')
    .replace(/[ª]/g, 'a')
    .replace(/[^\x20-\x7E\n]/g, ''); // Mantém apenas caracteres ASCII visíveis e quebra de linha
}

function centerText(text: string): string {
  const clean = sanitizeText(text);
  if (clean.length >= LINE_WIDTH) return clean;
  const padding = Math.floor((LINE_WIDTH - clean.length) / 2);
  return ' '.repeat(padding) + clean;
}

function justifyText(left: string, right: string): string {
  const cleanLeft = sanitizeText(left);
  const cleanRight = sanitizeText(right);
  const total = cleanLeft.length + cleanRight.length;
  if (total >= LINE_WIDTH) {
    return `${cleanLeft}\n${' '.repeat(Math.max(0, LINE_WIDTH - cleanRight.length))}${cleanRight}`;
  }
  const spaceCount = LINE_WIDTH - total;
  return `${cleanLeft}${' '.repeat(spaceCount)}${cleanRight}`;
}

function divider(char = '-'): string {
  return char.repeat(LINE_WIDTH);
}

export interface PrintableOrder {
  id: string;
  createdAt?: string | Date;
  user?: {
    name?: string;
    phone?: string;
    address?: string;
    number?: string;
    neighborhood?: string;
  };
  items?: Array<{
    quantity: number;
    observation?: string | null;
    price?: number;
    product?: {
      name: string;
    };
  }>;
  total?: number;
}

/**
 * Constrói o texto formatado para envio à impressora de 58mm.
 */
export function buildReceiptText(order: PrintableOrder): string {
  const lines: string[] = [];

  // Cabeçalho
  lines.push(centerText('================================'));
  lines.push(centerText('THE BURGUER'));
  lines.push(centerText('================================'));

  const shortId = order.id ? order.id.substring(0, 8).toUpperCase() : 'N/A';
  lines.push(`Pedido #${shortId}`);

  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR');
  lines.push(sanitizeText(`Data: ${dateStr}`));
  lines.push(divider('='));

  // Cliente
  lines.push('CLIENTE:');
  lines.push(sanitizeText(` ${order.user?.name || 'Cliente'}`));

  if (order.user?.phone) {
    lines.push(sanitizeText(` Tel: ${order.user.phone}`));
  }

  if (order.user?.address) {
    lines.push(sanitizeText(` End: ${order.user.address}, ${order.user.number || 'S/N'}`));
    if (order.user.neighborhood) {
      lines.push(sanitizeText(` Bairro: ${order.user.neighborhood}`));
    }
  }

  lines.push(divider('-'));

  // Itens
  lines.push('ITENS:');

  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      const name = item.product?.name || 'Produto';
      const itemLine = `${item.quantity}x ${name}`;
      
      if (typeof item.price === 'number') {
        const itemTotal = (item.quantity * item.price).toFixed(2);
        lines.push(justifyText(itemLine, `R$ ${itemTotal}`));
      } else {
        lines.push(sanitizeText(itemLine));
      }

      if (item.observation) {
        lines.push(sanitizeText(`   Obs: ${item.observation}`));
      }
    }
  } else {
    lines.push(' Nenhum item especificado');
  }

  lines.push(divider('-'));

  // Total
  if (typeof order.total === 'number') {
    lines.push(justifyText('TOTAL:', `R$ ${order.total.toFixed(2)}`));
  }

  // Rodapé
  lines.push(divider('='));
  lines.push(centerText('Obrigado pela preferencia!'));
  lines.push(centerText('================================'));
  lines.push('\n\n\n'); // Avanço de papel

  return lines.join('\n');
}
