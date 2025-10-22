import { Module } from '@nestjs/common';
import { PayersController } from './payers.controller';
import { PayersService } from './payers.service';
import { PayersRepository } from './payers.repository';

@Module({
  controllers: [PayersController],
  providers: [PayersService, PayersRepository],
  exports: [PayersService],
})
export class PayersModule {}
