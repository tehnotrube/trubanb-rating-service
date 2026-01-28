import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Delete, 
  UseGuards, 
  Put 
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { KongJwtGuard } from '../auth/guards/kong-jwt.guard';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { UpdateRatingDto } from './dtos/update-rating.dto';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(KongJwtGuard)
  async create(@Body() dto: CreateRatingDto, @CurrentUser() user: any) {
    return this.ratingsService.createRating(dto, user.id);
  }

  @Put(':id')
  @UseGuards(KongJwtGuard)
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateRatingDto, 
    @CurrentUser() user: any
  ) {
    return this.ratingsService.updateRating(id, dto, user.id);
  }

  @Get('target/:id')
  async getRatings(@Param('id') targetId: string) {
    return this.ratingsService.getTargetRatings(targetId);
  }

  @Delete(':id')
  @UseGuards(KongJwtGuard)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ratingsService.deleteRating(id, user.id);
  }
}