import { Controller, Get } from '@nestjs/common';

@Controller('api/ratings/health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'rating-service',
      timestamp: new Date().toISOString(),
    };
  }
}
