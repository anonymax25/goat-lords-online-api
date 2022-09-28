import { Injectable } from '@nestjs/common';
import { BaseService } from '../../shared/classes/base.service';
import { Message } from '../../entities/chat/message.entity';

@Injectable()
export class MessageService extends BaseService<Message>{
    constructor(){
        super(Message)
    }
}
