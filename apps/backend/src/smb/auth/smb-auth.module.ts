import { Module } from '@nestjs/common';
import { SMBAuthController } from './smb-auth.controller';
import { SMBAuthService } from './smb-auth.service';
import { StytchModule } from '../../stytch/stytch.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [StytchModule, DatabaseModule],
  controllers: [SMBAuthController],
  providers: [SMBAuthService],
  exports: [SMBAuthService],
})
export class SMBAuthModule {}
