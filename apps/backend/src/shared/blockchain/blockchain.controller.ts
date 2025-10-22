import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BlockchainService } from './blockchain.service';
import { NftDataDto } from './blockchain.dto';

@ApiTags('Shared - Blockchain')
@Controller('api/shared/blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('nft/:tokenId')
  @ApiOperation({
    summary: 'Get NFT data',
    description: 'Retrieve complete NFT information including invoice details and transaction history',
  })
  @ApiParam({ name: 'tokenId', description: 'NFT Token ID' })
  @ApiResponse({
    status: 200,
    description: 'NFT data retrieved successfully',
    type: NftDataDto,
  })
  @ApiResponse({ status: 404, description: 'NFT not found' })
  async getNftData(@Param('tokenId') tokenId: string): Promise<NftDataDto> {
    return await this.blockchainService.getNftData(tokenId);
  }
}
