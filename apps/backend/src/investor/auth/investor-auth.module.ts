import { Module } from '@nestjs/common';
import { InvestorAuthController } from './investor-auth.controller';
import { InvestorAuthService } from './investor-auth.service';
import { StytchModule } from '../../stytch/stytch.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [StytchModule, DatabaseModule],
  controllers: [InvestorAuthController],
  providers: [InvestorAuthService],
  exports: [InvestorAuthService],
})
export class InvestorAuthModule {}
