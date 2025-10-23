import { Injectable, NotFoundException } from '@nestjs/common';
import { BlockchainRepository } from './blockchain.repository';
import { NftDataDto, TransactionDto, NftInvoiceDto } from './blockchain.dto';

@Injectable()
export class BlockchainService {
  constructor(private readonly blockchainRepository: BlockchainRepository) {}

  /**
   * Get NFT data by token ID
   */
  async getNftData(tokenId: string): Promise<NftDataDto> {
    const result = await this.blockchainRepository.getNftData(tokenId);

    if (!result) {
      throw new NotFoundException(`NFT with token ID ${tokenId} not found`);
    }

    const { nft, transactions } = result;

    const invoice: NftInvoiceDto = {
      id: nft.invoiceId,
      invoiceNumber: nft.invoiceNumber,
      amount: Number(nft.amount),
      dueAt: Number(nft.dueAt),
      lifecycleStatus: nft.lifecycleStatus,
      onChainStatus: nft.onChainStatus || undefined,
      organizationId: nft.organizationId,
      payerCompanyId: nft.payerCompanyId,
    };

    const transactionDtos: TransactionDto[] = transactions.map((tx: any) => ({
      txHash: tx.txHash,
      txType: tx.txType,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      amount: Number(tx.amount || 0),
      blockNumber: Number(tx.blockNumber),
      blockTimestamp: Number(tx.blockTimestamp),
      gasUsed: Number(tx.gasUsed),
      gasPriceWei: tx.gasPriceWei.toString(),
      status: tx.status,
      createdAt: new Date(tx.createdAt).toISOString(),
    }));

    return {
      tokenId: nft.tokenId,
      contractAddress: nft.contractAddress,
      chainId: Number(nft.chainId),
      ownerAddress: nft.ownerAddress,
      metadataUri: nft.metadataUri || undefined,
      mintedAt: Number(nft.mintedAt),
      mintedTxHash: nft.mintedTxHash,
      invoice,
      transactions: transactionDtos,
      createdAt: new Date(nft.createdAt).toISOString(),
    };
  }
}
