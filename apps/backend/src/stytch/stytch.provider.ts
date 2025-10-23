import { Provider } from '@nestjs/common';
import { B2BClient } from 'stytch';
import { ConfigService } from '@nestjs/config';

export const STYTCH_SMB_CLIENT = 'STYTCH_SMB_CLIENT';
export const STYTCH_INVESTOR_CLIENT = 'STYTCH_INVESTOR_CLIENT';

export const smbStytchProvider: Provider = {
  provide: STYTCH_SMB_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const projectId = configService.get<string>('STYTCH_SMB_PROJECT_ID');
    const secret = configService.get<string>('STYTCH_SMB_SECRET');

    if (!projectId) {
      throw new Error(
        'STYTCH_SMB_PROJECT_ID is required but not found in configuration',
      );
    }

    if (!secret) {
      throw new Error(
        'STYTCH_SMB_SECRET is required but not found in configuration',
      );
    }

    return new B2BClient({
      project_id: projectId,
      secret: secret,
    });
  },
};

export const investorStytchProvider: Provider = {
  provide: STYTCH_INVESTOR_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const projectId = configService.get<string>('STYTCH_INVESTOR_PROJECT_ID');
    const secret = configService.get<string>('STYTCH_INVESTOR_SECRET');

    if (!projectId) {
      throw new Error(
        'STYTCH_INVESTOR_PROJECT_ID is required but not found in configuration',
      );
    }

    if (!secret) {
      throw new Error(
        'STYTCH_INVESTOR_SECRET is required but not found in configuration',
      );
    }

    return new B2BClient({
      project_id: projectId,
      secret: secret,
    });
  },
};
