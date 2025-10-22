import { Global, Module } from '@nestjs/common';
import { viemClientProvider } from './blockchain.provider';
import { ContractService } from './contract.service';
import { EventListenerService } from './event-listener.service';

/**
 * Global blockchain module providing Viem client and contract services
 * Automatically starts event listener on module initialization
 */
@Global()
@Module({
  providers: [
    viemClientProvider,
    ContractService,
    EventListenerService,
  ],
  exports: [
    viemClientProvider,
    ContractService,
    EventListenerService,
  ],
})
export class BlockchainModule {}
