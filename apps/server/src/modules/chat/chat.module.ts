import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatService } from './chat.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [ChatService, ConversationService, MessageService],
  exports: [ChatService, ConversationService, MessageService],
})
export class ChatModule {}
