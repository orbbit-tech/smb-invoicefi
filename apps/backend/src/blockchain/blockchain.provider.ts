import { createPublicClient, createWalletClient, http, PublicClient, WalletClient } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { VIEM_CLIENT_TOKEN } from './blockchain.constants';
import { getBlockchainConfig } from './blockchain.config';

export interface ViemClients {
  publicClient: PublicClient;
  walletClient?: WalletClient;
  chainId: number;
}

export const viemClientProvider = {
  provide: VIEM_CLIENT_TOKEN,
  useFactory: (): ViemClients => {
    const config = getBlockchainConfig();

    // Select the appropriate chain
    const chain = config.chainId === 8453 ? base : baseSepolia;

    // Create public client for reading blockchain data
    const publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    }) as any;

    // Create wallet client if private key is provided (for transactions)
    let walletClient: WalletClient | undefined;
    if (process.env.DEPLOYER_PRIVATE_KEY) {
      const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`);
      walletClient = createWalletClient({
        account,
        chain,
        transport: http(config.rpcUrl),
      }) as any;
    }

    return {
      publicClient,
      walletClient,
      chainId: config.chainId,
    };
  },
};
