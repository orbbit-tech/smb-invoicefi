import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { MessageDto } from './app.dto';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get welcome message',
    description: 'Returns a welcome message from the API',
    operationId: 'getData',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved welcome message',
    type: MessageDto,
  })
  getData(): MessageDto {
    return this.appService.getData();
  }
}
