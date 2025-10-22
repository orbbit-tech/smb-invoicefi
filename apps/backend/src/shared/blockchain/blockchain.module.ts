import { Module } from '@nestjs/common';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';
import { BlockchainRepository } from './blockchain.repository';

@Module({
  controllers: [BlockchainController],
  providers: [BlockchainService, BlockchainRepository],
  exports: [BlockchainService],
})
export class BlockchainModule {}
