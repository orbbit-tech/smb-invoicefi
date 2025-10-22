import { Injectable } from '@nestjs/common';
import { PayersRepository } from './payers.repository';
import { PayerCompanyDto } from './payers.dto';

@Injectable()
export class PayersService {
  constructor(private readonly payersRepository: PayersRepository) {}

  async list(search?: string, industry?: string): Promise<PayerCompanyDto[]> {
    const payers = await this.payersRepository.list(search, industry);

    return payers.map((p: any) => ({
      id: p.id,
      name: p.name,
      legalName: p.legalName,
      industry: p.industry || undefined,
      creditScore: p.creditScore || undefined,
      paymentTermsDays: Number(p.paymentTermsDays),
    }));
  }
}
