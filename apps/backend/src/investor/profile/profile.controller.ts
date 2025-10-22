import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UserProfileDto } from './profile.dto';

@ApiTags('Investor - Profile')
@Controller('api/investor/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve investor profile information including KYC status and whitelisting',
  })
  @ApiQuery({ name: 'userId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Query('userId') userId: string): Promise<UserProfileDto> {
    return await this.profileService.getProfile(userId);
  }
}
