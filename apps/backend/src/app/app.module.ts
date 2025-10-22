import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database';
import { BlockchainModule } from '../blockchain';

// SMB Modules
import { DashboardModule } from '../smb/dashboard/dashboard.module';
import { InvoicesModule } from '../smb/invoices/invoices.module';
import { OrganizationModule } from '../smb/organization/organization.module';
import { PayersModule as SMBPayersModule } from '../smb/payers/payers.module';

// Investor Modules
import { ProfileModule } from '../investor/profile/profile.module';
import { MarketplaceModule } from '../investor/marketplace/marketplace.module';
import { PortfolioModule } from '../investor/portfolio/portfolio.module';

// Shared Modules
import { PayersModule as SharedPayersModule } from '../shared/payers/payers.module';
import { BlockchainModule as SharedBlockchainModule } from '../shared/blockchain/blockchain.module';

@Module({
  imports: [
    // Infrastructure
    DatabaseModule,
    BlockchainModule,

    // SMB Domain
    DashboardModule,
    InvoicesModule,
    OrganizationModule,
    SMBPayersModule,

    // Investor Domain
    ProfileModule,
    MarketplaceModule,
    PortfolioModule,

    // Shared Domain
    SharedPayersModule,
    SharedBlockchainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
