import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  // TODO: Initialize Prisma Client after generation
  async onModuleInit() {
    // await this.$connect();
  }

  async onModuleDestroy() {
    // await this.$disconnect();
  }
}
