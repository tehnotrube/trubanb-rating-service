import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RatingsService } from './ratings.service';
import { Rating } from './schemas/rating.schema';
import { ReservationClientService } from '../reservation-client/reservation-client.service';
import { RatingEventsPublisher } from '../messaging/rating-events.publisher';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Model } from 'mongoose';

type JestMockModel<T> = jest.Mocked<Model<T>> & jest.Mock;

describe('RatingsService', () => {
  let service: RatingsService;
  let model: JestMockModel<Rating>;
  let mockReservationClient: jest.Mocked<ReservationClientService>;

  const mockRatingDoc = (overrides = {}) => {
    const doc = {
      id: 'rat_1',
      guestId: 'usr_guest_1',
      targetId: 'target_123',
      targetType: 'ACCOMMODATION',
      score: 5,
      comment: 'Great!',
      createdAt: new Date(),
      ...overrides,
    };
    return {
      ...doc,
      save: jest.fn().mockResolvedValue(doc),
    };
  };

  beforeEach(async () => {
    const mockModel = jest.fn().mockImplementation(() => ({
      save: jest.fn(),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: getModelToken(Rating.name),
          useValue: Object.assign(mockModel, {
            findOne: jest.fn(),
            findById: jest.fn(),
            deleteOne: jest.fn(),
            aggregate: jest.fn(),
          }),
        },
        {
          provide: ReservationClientService,
          useValue: {
            validateReservationForRating: jest.fn(),
          },
        },
        {
          provide: RatingEventsPublisher,
          useValue: {
            notifyHostRated: jest.fn().mockResolvedValue(undefined),
            notifyAccommodationRated: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    model = module.get<JestMockModel<Rating>>(getModelToken(Rating.name));
    mockReservationClient = module.get(ReservationClientService);
  });

  describe('createRating', () => {
    const createDto = {
      reservationId: 'res_1',
      type: 'ACCOMMODATION' as const,
      score: 5,
    };

    it('should create a rating successfully', async () => {
      mockReservationClient.validateReservationForRating.mockResolvedValue({
        canRate: true,
        hostId: 'host_1',
        accommodationId: 'acc_1',
        isPast: true,
        guestName: 'Test Guest',
        accommodationName: 'Test Accommodation',
      });

      (model.findOne as jest.Mock).mockResolvedValue(null);

      const savedDoc = mockRatingDoc({ targetId: 'acc_1' });
      model.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedDoc),
      }));

      const result = await service.createRating(createDto, 'usr_guest_1');

      expect(result.targetId).toBe('acc_1');
      expect(
        mockReservationClient.validateReservationForRating,
      ).toHaveBeenCalled();
    });

    it('should throw BadRequest if reservation cannot be rated', async () => {
      mockReservationClient.validateReservationForRating.mockResolvedValue({
        canRate: false,
        hostId: 'host_1',
        accommodationId: 'acc_1',
        isPast: false,
        guestName: 'Test Guest',
        accommodationName: 'Test Accommodation',
      });

      await expect(
        service.createRating(createDto, 'usr_guest_1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRating', () => {
    it('should update rating if user is the owner', async () => {
      // Create the doc and ensure save returns the object itself
      const existingRating = mockRatingDoc();
      (model.findById as jest.Mock).mockResolvedValue(existingRating);

      const updateDto = { score: 2, comment: 'Changed my mind' };

      existingRating.save.mockResolvedValue({
        ...existingRating,
        ...updateDto,
      });

      const result = await service.updateRating(
        'rat_1',
        updateDto,
        'usr_guest_1',
      );

      expect(existingRating.save).toHaveBeenCalled();
      expect(result.score).toBe(2);
    });

    it('should throw Forbidden if user is not the owner', async () => {
      (model.findById as jest.Mock).mockResolvedValue(
        mockRatingDoc({ guestId: 'different_user' }),
      );

      await expect(
        service.updateRating('rat_1', { score: 1 }, 'usr_guest_1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteRating', () => {
    it('should delete rating successfully', async () => {
      (model.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await expect(
        service.deleteRating('rat_1', 'usr_guest_1'),
      ).resolves.not.toThrow();
    });

    it('should throw NotFound if nothing was deleted', async () => {
      (model.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      await expect(
        service.deleteRating('rat_1', 'usr_guest_1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTargetRatings', () => {
    it('should return aggregated ratings', async () => {
      const mockAggResult = [
        {
          targetId: 'target_123',
          averageScore: 4.5,
          totalCount: 10,
          ratings: [],
        },
      ];
      (model.aggregate as jest.Mock).mockResolvedValue(mockAggResult);

      const result = await service.getTargetRatings('target_123');

      expect(result.averageScore).toBe(4.5);
    });
  });
});
