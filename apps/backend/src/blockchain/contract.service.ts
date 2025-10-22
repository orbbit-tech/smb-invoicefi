import { Injectable, Inject } from '@nestjs/common';
import { PublicClient } from 'viem';
import { VIEM_CLIENT_TOKEN } from './blockchain.constants';
import { ViemClients } from './blockchain.provider';
import { getBlockchainConfig } from './blockchain.config';

/**
 * Service for interacting with smart contracts on Base network
 * Provides typed methods for reading contract state and events
 */
@Injectable()
export class ContractService {
  private readonly publicClient: PublicClient;
  private readonly chainId: number;
  private readonly config: ReturnType<typeof getBlockchainConfig>;

  constructor(
    @Inject(VIEM_CLIENT_TOKEN) private readonly viemClients: ViemClients
  ) {
    this.publicClient = viemClients.publicClient;
    this.chainId = viemClients.chainId;
    this.config = getBlockchainConfig();
  }

  /**
   * Get Invoice NFT contract address
   */
  getInvoiceContractAddress(): string {
    return this.config.invoiceContractAddress;
  }

  /**
   * Get Funding Pool contract address
   */
  getFundingPoolContractAddress(): string {
    return this.config.fundingPoolContractAddress;
  }

  /**
   * Get Whitelist contract address
   */
  getWhitelistContractAddress(): string {
    return this.config.whitelistContractAddress;
  }

  /**
   * Get NFT metadata URI for a token
   */
  async getTokenURI(tokenId: bigint): Promise<string> {
    // TODO: Implement with actual contract ABI
    // const tokenURI = await this.publicClient.readContract({
    //   address: this.config.invoiceContractAddress as `0x${string}`,
    //   abi: InvoiceABI,
    //   functionName: 'tokenURI',
    //   args: [tokenId],
    // });
    // return tokenURI;
    return `https://metadata.orbbit.io/invoice/${tokenId}`;
  }

  /**
   * Get NFT owner address
   */
  async getTokenOwner(tokenId: bigint): Promise<string> {
    // TODO: Implement with actual contract ABI
    // const owner = await this.publicClient.readContract({
    //   address: this.config.invoiceContractAddress as `0x${string}`,
    //   abi: InvoiceABI,
    //   functionName: 'ownerOf',
    //   args: [tokenId],
    // });
    // return owner;
    return '0x0000000000000000000000000000000000000000';
  }

  /**
   * Get current block number
   */
  async getCurrentBlockNumber(): Promise<bigint> {
    return await this.publicClient.getBlockNumber();
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    return await this.publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });
  }
}
