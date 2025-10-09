import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({
    description: 'A welcome message from the API',
    example: 'Hello API',
  })
  message: string;
}
