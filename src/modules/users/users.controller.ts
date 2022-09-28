import { UsersService } from './users.service';
import { Controller, Req, UseGuards, Get, Put, Body, Query, Param, HttpException, HttpCode, HttpStatus } from '@nestjs/common';
import JwtAuthenticationGuard from '../authentication/passport/jwt-authentication.guard';
import RequestWithUser from '../authentication/requestWithUser.interface';
import { User } from '../../entities/user.entity';
import { Lobby } from '../../entities/lobby.entity';

@Controller('user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService
  ) {}

  @UseGuards(JwtAuthenticationGuard)
  @Get(':id')
  async getProfile(@Param() params) {
    if(!Number.isInteger(parseInt(params.id)))
      throw new HttpException('Bad Request', HttpStatus.BAD_REQUEST)

    const user = await this.usersService.findCompleteUser(parseInt(params.id))

    if(!user)
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)

    return user
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get('lobbies/:id')
  async getUsersLobbies(@Param() params): Promise<Lobby[]> {
    const id = params.id
    if (!id)
      throw new HttpException('id parameter is missing', HttpStatus.BAD_REQUEST);
      
    return await (await this.usersService.findCompleteUser(parseInt(params.id))).lobbies
  }
  
  @UseGuards(JwtAuthenticationGuard)
  @Put()
  async update(@Req() req: RequestWithUser, @Body() user: User) {
    return this.usersService.updateFields(req.user.id, user);
  }
}
