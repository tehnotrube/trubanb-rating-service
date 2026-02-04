import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rating } from './schemas/rating.schema';
import { CreateRatingDto } from './dtos/create-rating.dto';
import { ReservationClientService } from '../reservation-client/reservation-client.service';
import { UpdateRatingDto } from './dtos/update-rating.dto';
import { RatingResponseDto } from './dtos/rating.response.dto';
import { TargetRatingResponse } from './dtos/target-rating.response.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectModel(Rating.name) private ratingModel: Model<Rating>,
    private readonly reservationClient: ReservationClientService,
  ) {}

  async createRating(
    dto: CreateRatingDto,
    guestId: string,
  ): Promise<RatingResponseDto> {
    const validation =
      await this.reservationClient.validateReservationForRating(
        dto.reservationId,
        guestId,
      );

    if (!validation.canRate) {
      throw new BadRequestException(
        'You can only rate past, completed reservations.',
      );
    }

    const targetId =
      dto.type === 'HOST' ? validation.hostId : validation.accommodationId;

    const existing = await this.ratingModel.findOne({
      guestId,
      targetId,
      reservationId: dto.reservationId,
    });

    if (existing) {
      throw new BadRequestException(
        'Rating already exists for this reservation. Use Edit instead.',
      );
    }

    const newRating = new this.ratingModel({
      ...dto,
      guestId,
      targetId,
      targetType: dto.type,
    });

    const savedRating = await newRating.save();

    return {
      id: savedRating.id,
      guestId: savedRating.guestId,
      targetId: savedRating.targetId,
      targetType: savedRating.targetType as 'HOST' | 'ACCOMMODATION',
      score: savedRating.score,
      comment: savedRating.comment,
      createdAt: savedRating.createdAt,
    };
  }

  async updateRatingByReservation(
    reservationId: string,
    type: 'HOST' | 'ACCOMMODATION',
    dto: UpdateRatingDto,
    guestId: string,
  ): Promise<RatingResponseDto> {
    if (type !== 'HOST' && type !== 'ACCOMMODATION') {
      throw new BadRequestException(
        'type must be either HOST or ACCOMMODATION',
      );
    }

    const rating = await this.ratingModel.findOne({
      reservationId,
      guestId,
      targetType: type,
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    rating.score = dto.score;
    if (dto.comment !== undefined) {
      rating.comment = dto.comment;
    }

    const savedRating = await rating.save();

    return {
      id: savedRating.id,
      guestId: savedRating.guestId,
      targetId: savedRating.targetId,
      targetType: savedRating.targetType as 'HOST' | 'ACCOMMODATION',
      score: savedRating.score,
      comment: savedRating.comment,
      createdAt: savedRating.createdAt,
    };
  }

  async updateRating(
    ratingId: string,
    dto: UpdateRatingDto,
    guestId: string,
  ): Promise<RatingResponseDto> {
    const rating = await this.ratingModel.findById(ratingId);

    if (!rating) throw new NotFoundException('Rating not found');
    if (rating.guestId !== guestId) {
      throw new ForbiddenException('You can only edit your own ratings');
    }

    rating.score = dto.score;
    rating.comment = dto.comment ?? rating.comment;

    const updatedRating = await rating.save();

    return {
      id: updatedRating.id,
      guestId: updatedRating.guestId,
      targetId: updatedRating.targetId,
      targetType: updatedRating.targetType as 'HOST' | 'ACCOMMODATION',
      score: updatedRating.score,
      comment: updatedRating.comment,
      createdAt: updatedRating.createdAt,
    };
  }

  async deleteRating(ratingId: string, guestId: string): Promise<void> {
    const result = await this.ratingModel.deleteOne({ _id: ratingId, guestId });
    if (result.deletedCount === 0)
      throw new NotFoundException('Rating not found or unauthorized');
  }

  async deleteRatingByReservation(
    reservationId: string,
    type: 'HOST' | 'ACCOMMODATION',
    guestId: string,
  ): Promise<void> {
    if (type !== 'HOST' && type !== 'ACCOMMODATION') {
      throw new BadRequestException(
        'type must be either HOST or ACCOMMODATION',
      );
    }

    const result = await this.ratingModel.deleteOne({
      reservationId,
      guestId,
      targetType: type,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Rating not found or unauthorized');
    }
  }

  async getTargetRatings(targetId: string): Promise<TargetRatingResponse> {
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
              createdAt: '$createdAt',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          targetId: '$_id',
          averageScore: { $round: ['$averageScore', 1] },
          totalCount: 1,
          ratings: 1,
        },
      },
    ]);

    return (result[0] || {
      targetId,
      averageScore: 0,
      totalCount: 0,
      ratings: [],
    }) as TargetRatingResponse;
  }
}
