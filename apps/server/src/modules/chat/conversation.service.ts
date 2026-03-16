import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConversationDto } from './dto/chat.dto';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async create(createConversationDto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        appId: createConversationDto.appId,
        metadata: createConversationDto.metadata || {},
      },
    });
  }

  async findOne(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        app: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with id "${id}" not found`);
    }

    return conversation;
  }

  async findAll(page: number = 1, pageSize: number = 20) {
    const [conversations, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: {
          app: true,
        },
      }),
      this.prisma.conversation.count(),
    ]);

    return {
      data: conversations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByApp(
    appId: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const [conversations, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where: { appId },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      this.prisma.conversation.count({
        where: { appId },
      }),
    ]);

    return {
      data: conversations,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.conversation.delete({
      where: { id },
    });
    return { message: `Conversation "${id}" deleted successfully` };
  }

  async getHistory(conversationId: string, limit: number = 20) {
    const safeLimit = typeof limit === 'number' && !isNaN(limit) ? limit : 20;
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

    return messages.reverse();
  }

  async getMessageCount(conversationId: string): Promise<number> {
    return this.prisma.message.count({
      where: { conversationId },
    });
  }
}
