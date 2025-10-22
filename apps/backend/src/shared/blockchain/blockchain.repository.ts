import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import type Database from '../../../../../src/types/db/Database';
import { DATABASE_TOKEN } from '../../database/database.constants';

@Injectable()
export class BlockchainRepository {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>
  ) {}

  /**
   * Get NFT data by token ID including invoice and transaction history
   */
  async getNftData(tokenId: string) {
    // Get NFT details with invoice
    const nft = await this.db
      .selectFrom('blockchain.invoiceNft as nft')
      .innerJoin('invoice.invoice as i', 'nft.invoiceId', 'i.id')
      .select([
        'nft.id as nftId',
        'nft.tokenId',
        'nft.contractAddress',
        'nft.chainId',
        'nft.ownerAddress',
        'nft.metadataUri',
        'nft.mintedAt',
        'nft.mintedTxHash',
        'nft.createdAt',
        'i.id as invoiceId',
        'i.invoiceNumber',
        'i.amountCents',
        'i.dueAt',
        'i.lifecycleStatus',
        'i.onChainStatus',
        'i.organizationId',
        'i.payerCompanyId',
      ])
      .where('nft.tokenId', '=', tokenId)
      .where('nft.deletedAt', 'is', null)
      .where('i.deletedAt', 'is', null)
      .executeTakeFirst();

    if (!nft) {
      return null;
    }

    // Get all transactions related to this NFT
    const transactions = await this.db
      .selectFrom('blockchain.transaction')
      .selectAll()
      .where('nftId', '=', nft.nftId)
      .orderBy('blockTimestamp', 'desc')
      .execute();

    return {
      nft,
      transactions,
    };
  }
}
