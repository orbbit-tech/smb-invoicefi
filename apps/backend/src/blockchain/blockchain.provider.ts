import { createPublicClient, http, PublicClient } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { VIEM_CLIENT_TOKEN } from './blockchain.constants';
import { getBlockchainConfig } from './blockchain.config';

export interface ViemClients {
  publicClient: PublicClient;
  chainId: number;
}

export const viemClientProvider = {
  provide: VIEM_CLIENT_TOKEN,
  useFactory: (): ViemClients => {
    const config = getBlockchainConfig();

    // Select the appropriate chain
    const chain = config.chainId === 8453 ? base : baseSepolia;

    // Create public client for reading blockchain data
    // Backend only reads blockchain events via CDP webhooks - no write operations
    const publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    }) as any;

    return {
      publicClient,
      chainId: config.chainId,
    };
  },
};
