import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  // Garante que a configuração de "isOpen" existe no banco ao iniciar
  async onModuleInit() {
    const isOpen = await this.prisma.setting.findUnique({ where: { key: 'isOpen' } });
    if (!isOpen) {
      await this.prisma.setting.create({ data: { key: 'isOpen', value: 'true' } });
    }
  }

  async getStoreStatus() {
    const setting = await this.prisma.setting.findUnique({ where: { key: 'isOpen' } });
    return { isOpen: setting?.value === 'true' };
  }

  async toggleStoreStatus(isOpen: boolean) {
    return this.prisma.setting.update({
      where: { key: 'isOpen' },
      data: { value: isOpen ? 'true' : 'false' }
    });
  }
}
