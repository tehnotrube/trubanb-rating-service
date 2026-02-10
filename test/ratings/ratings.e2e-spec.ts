import request from 'supertest';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { App } from 'supertest/types';
import { of } from 'rxjs';
import { app, mockReservationGrpcService } from '../utils/setup-tests';
import { Rating } from '../../src/ratings/schemas/rating.schema';
import { TEST_GUEST_TOKEN_HEADERS } from '../utils/auth/headers.utils';
import { RatingResponseDto } from 'src/ratings/dtos/rating.response.dto';
import { TargetRatingResponse } from 'src/ratings/dtos/target-rating.response.dto';

describe('Ratings Integration (MongoDB)', () => {
  let ratingModel: Model<Rating>;

  const GUEST_ID = 'test-guest-789';
  const ACC_ID = 'acc-uuid-123';
  const HOST_ID = 'host-uuid-456';
  const RES_ID = 'res-uuid-999';

  beforeAll(() => {
    ratingModel = app.get(getModelToken(Rating.name));
  });

  beforeEach(async () => {
    await ratingModel.deleteMany({});
    jest.clearAllMocks();
  });

  const mockGrpcResponse = (data: {
    canRate: boolean;
    accommodationId?: string;
    hostId?: string;
    isPast?: boolean;
    guestName?: string;
    accommodationName?: string;
  }) => {
    mockReservationGrpcService.getReservationForRating.mockReturnValue(
      of({
        guestName: 'Test Guest',
        accommodationName: 'Test Accommodation',
        ...data,
      }),
    );
  };

  describe('POST /ratings', () => {
    it('should successfully create an ACCOMMODATION rating and map targetId correctly', async () => {
      mockGrpcResponse({
        canRate: true,
        accommodationId: ACC_ID,
        hostId: HOST_ID,
        isPast: true,
      });

      const res = await request(app.getHttpServer() as App)
        .post('/api/ratings')
        .set(TEST_GUEST_TOKEN_HEADERS)
        .send({
          reservationId: RES_ID,
          type: 'ACCOMMODATION',
          score: 5,
          comment: 'Beautiful view!',
        })
        .expect(201);

      const body = res.body as RatingResponseDto;
      expect(body.targetId).toBe(ACC_ID);
      expect(body.targetType).toBe('ACCOMMODATION');

      const saved = await ratingModel.findOne({ reservationId: RES_ID });
      expect(saved?.targetId).toBe(ACC_ID);
    });

    it('should successfully create a HOST rating', async () => {
      mockGrpcResponse({
        canRate: true,
        accommodationId: ACC_ID,
        hostId: HOST_ID,
        isPast: true,
      });

      const res = await request(app.getHttpServer() as App)
        .post('/api/ratings')
        .set(TEST_GUEST_TOKEN_HEADERS)
        .send({
          reservationId: RES_ID,
          type: 'HOST',
          score: 4,
        })
        .expect(201);

      const body = res.body as RatingResponseDto;
      expect(body.targetId).toBe(HOST_ID);
    });

    it('should reject (400) if user tries to rate the same reservation twice', async () => {
      mockGrpcResponse({
        canRate: true,
        accommodationId: ACC_ID,
        hostId: HOST_ID,
        isPast: true,
      });

      await ratingModel.create({
        guestId: GUEST_ID,
        targetId: ACC_ID,
        reservationId: RES_ID,
        score: 5,
        targetType: 'ACCOMMODATION',
      });

      const res = await request(app.getHttpServer() as App)
        .post('/api/ratings')
        .set(TEST_GUEST_TOKEN_HEADERS)
        .send({
          reservationId: RES_ID,
          type: 'ACCOMMODATION',
          score: 1,
        })
        .expect(400);

      const body = res.body as { message: string | string[] };
      const message = Array.isArray(body.message)
        ? body.message.join(' ')
        : body.message;
      expect(message).toContain('already exists');
    });
  });

  describe('PUT /ratings/:id', () => {
    it('should update score and keep old comment if new comment is omitted', async () => {
      const rating = await ratingModel.create({
        guestId: GUEST_ID,
        targetId: ACC_ID,
        reservationId: 'res-id-123',
        score: 2,
        comment: 'Existing comment',
        targetType: 'ACCOMMODATION',
      });

      const res = await request(app.getHttpServer() as App)
        .put(`/api/ratings/${rating._id.toString()}`)
        .set(TEST_GUEST_TOKEN_HEADERS)
        .send({ score: 4 })
        .expect(200);

      const body = res.body as RatingResponseDto;
      expect(body.score).toBe(4);
      expect(body.comment).toBe('Existing comment');
    });
  });

  describe('GET /ratings/target/:id', () => {
    it('should return aggregation with rounded average', async () => {
      await ratingModel.insertMany([
        {
          targetId: 'T1',
          guestId: 'G1',
          reservationId: 'R1',
          score: 5,
          targetType: 'HOST',
        },
        {
          targetId: 'T1',
          guestId: 'G2',
          reservationId: 'R2',
          score: 4,
          targetType: 'HOST',
        },
        {
          targetId: 'T1',
          guestId: 'G3',
          reservationId: 'R3',
          score: 4,
          targetType: 'HOST',
        },
      ]);

      const res = await request(app.getHttpServer() as App)
        .get('/api/ratings/target/T1')
        .expect(200);

      const body = res.body as TargetRatingResponse;
      expect(body.averageScore).toBe(4.3);
      expect(body.totalCount).toBe(3);
      expect(body.ratings[0]).toHaveProperty('id');
    });
  });

  describe('DELETE /ratings/:id', () => {
    it('should delete if owned', async () => {
      const rating = await ratingModel.create({
        guestId: GUEST_ID,
        targetId: ACC_ID,
        reservationId: 'res-id-789',
        score: 5,
        targetType: 'ACCOMMODATION',
      });

      await request(app.getHttpServer() as App)
        .delete(`/api/ratings/${rating._id.toString()}`)
        .set(TEST_GUEST_TOKEN_HEADERS)
        .expect(200);

      const exists = await ratingModel.findById(rating._id);
      expect(exists).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should return 400 for invalid score', async () => {
      await request(app.getHttpServer() as App)
        .post('/api/ratings')
        .set(TEST_GUEST_TOKEN_HEADERS)
        .send({
          reservationId: RES_ID,
          type: 'HOST',
          score: 99,
        })
        .expect(400);
    });
  });
});
