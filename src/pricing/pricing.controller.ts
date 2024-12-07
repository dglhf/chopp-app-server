import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePricingConfigDto } from './dto/create-pricing-config.dto';
import { PricingService } from './pricing.service';
import { PricingConfig } from './pricing-config.model';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update pricing configuration' })
  @UseGuards(JwtAuthGuard)
  createOrUpdateConfig(@Body() dto: CreatePricingConfigDto) {
    return this.pricingService.createOrUpdateConfig(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get pricing configuration' })
  @UseGuards(JwtAuthGuard)
  getConfig(): Promise<PricingConfig> {
    return this.pricingService.getConfig();
  }
}
