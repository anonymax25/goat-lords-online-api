import { Module } from '@nestjs/common';
import { LobbyModule } from '../lobby/lobby.module';
import { ChatGateway } from './chat.gateway';
import { MessageService } from './message.service';
@Module({
    imports: [
        LobbyModule
    ],
    providers: [
        ChatGateway, 
        MessageService
    ],
    controllers: [],
    exports: [
        MessageService
    ]
})
export class ChatModule {}
