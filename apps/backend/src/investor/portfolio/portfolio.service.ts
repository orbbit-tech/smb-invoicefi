import { Injectable, NotFoundException } from '@nestjs/common';
import { PortfolioRepository } from './portfolio.repository';
import {
  PortfolioSummaryDto,
  InvestorPositionDto,
  PositionsListResponseDto,
  PositionInvoiceDto,
  PositionNftDto,
  InvestmentDetailDto,
  PositionPayerDto,
  PositionIssuerDto,
} from './portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(private readonly portfolioRepository: PortfolioRepository) {}

  /**
   * Get portfolio summary with aggregated metrics
   */
  async getSummary(investorAddress: string): Promise<PortfolioSummaryDto> {
    const positions = await this.portfolioRepository.getSummary(
      investorAddress
    );

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalRealizedGains = 0;
    let totalUnrealizedGains = 0;
    let activeCount = 0;
    let settledCount = 0;
    let defaultedCount = 0;
    let totalApy = 0;
    let apyCount = 0;

    for (const pos of positions) {
      const fundedAmount = Number(pos.fundedAmount);
      const expectedRepayment = Number(pos.expectedRepayment);
      const actualYield = pos.investorYield
        ? Number(pos.investorYield)
        : null;

      totalInvested += fundedAmount;

      if (pos.positionStatus === 'ACTIVE') {
        activeCount++;
        totalCurrentValue += expectedRepayment;
        totalUnrealizedGains += expectedRepayment - fundedAmount;
      } else if (pos.positionStatus === 'SETTLED') {
        settledCount++;
        const settledAmount =
          actualYield !== null ? fundedAmount + actualYield : expectedRepayment;
        totalCurrentValue += settledAmount;
        totalRealizedGains += settledAmount - fundedAmount;
      } else if (pos.positionStatus === 'DEFAULTED') {
        defaultedCount++;
        // For defaulted positions, current value might be 0 or partial recovery
        const recoveredAmount =
          actualYield !== null ? fundedAmount + actualYield : 0;
        totalCurrentValue += recoveredAmount;
        totalRealizedGains += recoveredAmount - fundedAmount;
      }

      // Calculate APR for this position (simplified)
      if (expectedRepayment > 0 && fundedAmount > 0) {
        const returnBps =
          ((expectedRepayment - fundedAmount) / fundedAmount) * 10000;
        totalApy += returnBps / 100; // Convert to percentage
        apyCount++;
      }
    }

    const totalReturnPct =
      totalInvested > 0
        ? ((totalCurrentValue - totalInvested) / totalInvested) * 100
        : 0;

    const averageApy = apyCount > 0 ? totalApy / apyCount : 0;

    return {
      totalInvested,
      totalCurrentValue,
      totalRealizedGains,
      totalUnrealizedGains,
      totalReturnPct: Math.round(totalReturnPct * 100) / 100,
      activePositionsCount: activeCount,
      settledPositionsCount: settledCount,
      defaultedPositionsCount: defaultedCount,
      averageApy: Math.round(averageApy * 100) / 100,
    };
  }

  /**
   * Transform position data to DTO
   */
  private transformPositionToDto(pos: any): InvestorPositionDto {
    const fundedAmount = Number(pos.fundedAmount);
    const expectedRepayment = Number(pos.expectedRepayment);
    const actualYield = pos.investorYield
      ? Number(pos.investorYield)
      : null;

    let currentValue = 0;
    let realizedGains = 0;
    let unrealizedGains = 0;
    let actualRepayment: number | undefined;

    if (pos.positionStatus === 'ACTIVE') {
      currentValue = expectedRepayment;
      unrealizedGains = expectedRepayment - fundedAmount;
    } else if (pos.positionStatus === 'SETTLED') {
      actualRepayment =
        actualYield !== null ? fundedAmount + actualYield : expectedRepayment;
      currentValue = actualRepayment;
      realizedGains = actualRepayment - fundedAmount;
    } else if (pos.positionStatus === 'DEFAULTED') {
      actualRepayment = actualYield !== null ? fundedAmount + actualYield : 0;
      currentValue = actualRepayment;
      realizedGains = actualRepayment - fundedAmount;
    }

    const returnPct =
      fundedAmount > 0
        ? ((currentValue - fundedAmount) / fundedAmount) * 100
        : 0;

    return {
      id: pos.id,
      positionStatus: pos.positionStatus,
      currentValue,
      realizedGains,
      unrealizedGains,
      returnPct: Math.round(returnPct * 100) / 100,
      actualRepayment,
      settledAt: pos.settledAt ? Number(pos.settledAt) : undefined,
      invoice: {
        id: pos.invoiceId,
        invoiceNumber: pos.invoiceNumber,
        amount: Number(pos.amount),
        dueAt: Number(pos.dueAt),
        lifecycleStatus: pos.lifecycleStatus,
        riskScore: pos.riskScore || 'UNKNOWN',
      },
      nft: {
        tokenId: pos.tokenId,
        contractAddress: pos.contractAddress,
        ownerAddress: pos.ownerAddress,
        metadataUri: pos.metadataUri || undefined,
      },
      investment: {
        fundedAmount,
        fundedAt: Number(pos.fundedAt),
        fundingTxHash: pos.fundingTxHash,
        expectedRepayment,
        expectedReturn: Number(pos.expectedReturn || 0),
      },
      payer: {
        id: pos.payerId,
        name: pos.payerName,
        creditScore: pos.payerCreditScore || undefined,
        industry: pos.payerIndustry || undefined,
      },
      issuer: {
        id: pos.issuerId,
        name: pos.issuerName,
      },
      createdAt: new Date(pos.createdAt).toISOString(),
    };
  }

  /**
   * Get paginated list of positions
   */
  async getPositions(
    investorAddress: string,
    status?: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PositionsListResponseDto> {
    const result = await this.portfolioRepository.getPositions({
      investorAddress,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const data = result.positions.map((pos) =>
      this.transformPositionToDto(pos)
    );

    return {
      data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Get single position by ID
   */
  async getPositionById(
    positionId: string,
    investorAddress: string
  ): Promise<InvestorPositionDto> {
    const position = await this.portfolioRepository.getPositionById(
      positionId,
      investorAddress
    );

    if (!position) {
      throw new NotFoundException(`Position with ID ${positionId} not found`);
    }

    return this.transformPositionToDto(position);
  }
}
