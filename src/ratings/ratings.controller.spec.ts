import { Test, TestingModule } from '@nestjs/testing';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { RatingResponseDto } from './dtos/rating.response.dto';
import { TargetRatingResponse } from './dtos/target-rating.response.dto';
import { UserRole } from '../auth/guards/roles.guard';

describe('RatingsController', () => {
  let controller: RatingsController;
  let mockRatingsService: jest.Mocked<RatingsService>;

  const mockUser = (): AuthenticatedUser => ({
    id: 'usr_guest_1',
    email: 'guest@test.com',
    role: UserRole.GUEST,
  });

  const mockRatingResponse = (overrides = {}): RatingResponseDto => ({
    id: 'rat_1',
    guestId: 'usr_guest_1',
    targetId: 'target_123',
    targetType: 'ACCOMMODATION',
    score: 5,
    comment: 'Great stay!',
    createdAt: new Date(),
    ...overrides,
  });

  const mockTargetResponse = (): TargetRatingResponse => ({
    targetId: 'target_123',
    averageScore: 4.5,
    totalCount: 1,
    ratings: [
      {
        id: 'rat_1',
        guestId: 'usr_guest_1',
        score: 5,
        comment: 'Great stay!',
        createdAt: new Date(),
      },
    ],
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [
        {
          provide: RatingsService,
          useValue: {
            createRating: jest.fn(),
            updateRating: jest.fn(),
            getTargetRatings: jest.fn(),
            deleteRating: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(RatingsController);
    mockRatingsService = module.get(RatingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new rating', async () => {
      const dto = {
        reservationId: 'res_123',
        type: 'ACCOMMODATION' as const,
        score: 5,
        comment: 'Excellent',
      };

      const expectedResponse = mockRatingResponse();
      mockRatingsService.createRating.mockResolvedValue(expectedResponse);

      const result = await controller.create(dto, mockUser());

      expect(mockRatingsService.createRating).toHaveBeenCalledWith(
        dto,
        mockUser().id,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('update', () => {
    it('should update an existing rating', async () => {
      const dto = {
        score: 4,
        comment: 'Updated comment',
      };

      const expectedResponse = mockRatingResponse({
        score: 4,
        comment: 'Updated comment',
      });
      mockRatingsService.updateRating.mockResolvedValue(expectedResponse);

      const result = await controller.update('rat_1', dto, mockUser());

      expect(mockRatingsService.updateRating).toHaveBeenCalledWith(
        'rat_1',
        dto,
        mockUser().id,
      );
      expect(result.score).toBe(4);
    });
  });

  describe('getRatings', () => {
    it('should return all ratings and metadata for a specific target', async () => {
      const expectedResponse = mockTargetResponse();
      mockRatingsService.getTargetRatings.mockResolvedValue(expectedResponse);

      const result = await controller.getRatings('target_123');

      expect(mockRatingsService.getTargetRatings).toHaveBeenCalledWith(
        'target_123',
      );
      expect(result.targetId).toBe('target_123');
      expect(result.ratings).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('should successfully delete a rating', async () => {
      mockRatingsService.deleteRating.mockResolvedValue(undefined);

      const result = await controller.delete('rat_1', mockUser());

      expect(mockRatingsService.deleteRating).toHaveBeenCalledWith(
        'rat_1',
        mockUser().id,
      );
      expect(result).toBeUndefined();
    });

    it('should propagate service errors', async () => {
      mockRatingsService.deleteRating.mockRejectedValue(new Error('NotFound'));

      await expect(
        controller.delete('rat_invalid', mockUser()),
      ).rejects.toThrow('NotFound');
    });
  });
});
