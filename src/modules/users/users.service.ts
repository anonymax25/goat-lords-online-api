import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '../../shared/classes/base.service';
import { User } from '../../entities/user.entity';

@Injectable()
export class UsersService extends BaseService<User>{
  constructor(
  ) {
    super(User)
  }

  async findCompleteUser(id: number): Promise<User>{
    return await this.getRepository()
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.lobbies', 'lobbies')
      .where('user.id = :id', {id})
      .getOne();
  }
}
