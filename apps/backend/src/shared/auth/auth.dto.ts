import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTOs for Authentication endpoints
 */

export class SendEmailOtpDto {
  @ApiProperty({
    description: 'Email address to send OTP to',
    example: 'user@company.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class AuthenticateEmailOtpDto {
  @ApiProperty({
    description: 'Email address',
    example: 'user@company.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  code: string;
}

export class CompleteSignupDto {
  @ApiProperty({
    description: 'Intermediate session token from OTP authentication',
  })
  @IsString()
  @IsNotEmpty()
  intermediateSessionToken: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Acme Corp',
  })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiProperty({
    description: 'User given name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  givenName: string;

  @ApiProperty({
    description: 'User family name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  familyName: string;
}

export class ExchangeIntermediateSessionDto {
  @ApiProperty({
    description: 'Intermediate session token from OTP authentication',
  })
  @IsString()
  @IsNotEmpty()
  intermediateSessionToken: string;

  @ApiProperty({
    description: 'Organization ID to join',
  })
  @IsString()
  @IsNotEmpty()
  organizationId: string;
}

export class LogoutDto {
  @ApiProperty({
    description: 'Session JWT to revoke',
  })
  @IsString()
  @IsNotEmpty()
  sessionJwt: string;
}
