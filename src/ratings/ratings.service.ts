import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating } from './schemas/rating.schema';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { ReservationClientService } from 'src/reservation-client/reservation-client.service';
import { UpdateRatingDto } from './dtos/update-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectModel(Rating.name) private ratingModel: Model<Rating>,
    private readonly reservationClient: ReservationClientService,
  ) {}
  
  async createRating(dto: CreateRatingDto, guestId: string) {
    const validation = await this.reservationClient.validateReservationForRating(
      dto.reservationId,
      guestId,
    );

    Logger.log(`Reservation validation result: ${JSON.stringify(validation)}`);

    if (!validation.canRate) {
      throw new BadRequestException('You can only rate past, completed reservations.');
    }

    const targetId = dto.type === 'HOST' ? validation.hostId : validation.accommodationId;

    const existing = await this.ratingModel.findOne({ 
      guestId, 
      targetId, 
      reservationId: dto.reservationId 
    });
    
    if (existing) {
      throw new BadRequestException('Rating already exists for this reservation. Use Edit instead.');
    }

    const newRating = new this.ratingModel({
      ...dto,
      guestId,
      targetId,
      targetType: dto.type,
    });

    return newRating.save();
  }

  async updateRating(ratingId: string, dto: UpdateRatingDto, guestId: string) {
    const rating = await this.ratingModel.findById(ratingId);

    if (!rating) throw new NotFoundException('Rating not found');
    if (rating.guestId !== guestId) {
      throw new ForbiddenException('You can only edit your own ratings');
    }

    rating.score = dto.score;
    rating.comment = dto.comment ?? rating.comment;
    
    return rating.save();
  }

  async deleteRating(ratingId: string, guestId: string) {
    const result = await this.ratingModel.deleteOne({ _id: ratingId, guestId });
    if (result.deletedCount === 0) throw new NotFoundException('Rating not found or unauthorized');
  }

  async getTargetRatings(targetId: string) {
    const result = await this.ratingModel.aggregate([
      { $match: { targetId } },
      {
        $group: {
          _id: '$targetId',
          averageScore: { $avg: '$score' },
          totalCount: { $sum: 1 },
          ratings: { 
            $push: { 
              id: '$_id',
              guestId: '$guestId', 
              score: '$score', 
              comment: '$comment', 
              createdAt: '$createdAt' 
            } 
          }
        }
      },
      {
        $project: {
          _id: 0,
          targetId: '$_id',
          averageScore: { $round: ['$averageScore', 1] },
          totalCount: 1,
          ratings: 1
        }
      }
    ]);

    return result[0] || { targetId, averageScore: 0, totalCount: 0, ratings: [] };
  }
}
