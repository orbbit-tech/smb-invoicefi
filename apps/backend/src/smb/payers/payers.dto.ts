import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayerCompanyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  legalName: string;

  @ApiPropertyOptional()
  industry?: string;

  @ApiPropertyOptional()
  creditScore?: string;

  @ApiProperty()
  paymentTermsDays: number;
}
