import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/chat.dto';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async save(data: CreateMessageDto) {
    return this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        tokens: data.tokens,
        metadata: data.metadata || {},
      },
    });
  }

  async saveBatch(messages: CreateMessageDto[]) {
    if (messages.length === 0) {
      return [];
    }

    return this.prisma.$transaction(
      messages.map((msg) =>
        this.prisma.message.create({
          data: {
            conversationId: msg.conversationId,
            role: msg.role,
            content: msg.content,
            tokens: msg.tokens,
            metadata: msg.metadata || {},
          },
        }),
      ),
    );
  }

  async findOne(id: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException(`Message with id "${id}" not found`);
    }

    return message;
  }

  async findByConversation(
    conversationId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  async getHistory(conversationId: string, limit: number = 10) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse();
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.message.delete({
      where: { id },
    });
    return { message: `Message "${id}" deleted successfully` };
  }

  async countByConversation(conversationId: string): Promise<number> {
    return this.prisma.message.count({
      where: { conversationId },
    });
  }
}
