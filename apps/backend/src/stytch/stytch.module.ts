import { Module } from '@nestjs/common';
import { smbStytchProvider, investorStytchProvider } from './stytch.provider';

@Module({
  providers: [smbStytchProvider, investorStytchProvider],
  exports: [smbStytchProvider, investorStytchProvider],
})
export class StytchModule {}
