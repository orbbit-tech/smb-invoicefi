import { Injectable } from '@nestjs/common';
import { MessageDto } from './app.dto';

@Injectable()
export class AppService {
  getData(): MessageDto {
    return { message: 'Hello API' };
  }
}
