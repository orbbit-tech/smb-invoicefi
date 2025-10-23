import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database';
import { BlockchainModule } from '../blockchain';

// Auth Modules
import { SMBAuthModule } from '../smb/auth/smb-auth.module';
import { InvestorAuthModule } from '../investor/auth/investor-auth.module';

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
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Infrastructure
    DatabaseModule,
    BlockchainModule,

    // Authentication
    SMBAuthModule,
    InvestorAuthModule,

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
