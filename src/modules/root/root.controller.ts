import { Controller, Get, Req } from '@nestjs/common';

@Controller('/')
export class RootController {

    @Get()
    get(@Req() req) {
        return "Welcome to the dice-town-online api!";
    }

    @Get('/lobbySocket')
    get2(@Req() req) {
        return "lobbySocket";
    }
    
    @Get('/chatSocket')
    get3(@Req() req) {
        return "chatSocket";
    }
    
    @Get('/lobbySocket/')
    get4(@Req() req) {
        return "lobbySocket2";
    }
    
    @Get('/chatSocket/')
    get5(@Req() req) {
        return "chatSocket2";
    }
}
