
import { Controller, Req, UseGuards, Get, Put, Body, Post } from '@nestjs/common';
import JwtAuthenticationGuard from '../authentication/passport/jwt-authentication.guard';
import RequestWithUser from '../authentication/requestWithUser.interface';
import { TestService } from './test.service';

@Controller('test')
export class TestController {
  constructor(
    private testService: TestService,
  ) {}

  @UseGuards(JwtAuthenticationGuard)
  @Get()
  get(@Req() req: RequestWithUser) {
    return req.user;
  }
  
  @UseGuards(JwtAuthenticationGuard)
  @Post()
  post(@Req() req: RequestWithUser) {
  }
}
