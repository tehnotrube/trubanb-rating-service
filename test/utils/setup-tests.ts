import { Test } from '@nestjs/testing';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { RatingEventsPublisher } from '../../src/messaging/rating-events.publisher';

export let app: INestApplication;

export const mockReservationGrpcService = {
  getReservationForRating: jest.fn(),
};

export const mockGrpcClient = {
  getService: jest.fn().mockReturnValue(mockReservationGrpcService),
};

export const mockRatingEventsPublisher = {
  notifyHostRated: jest.fn().mockResolvedValue(undefined),
  notifyAccommodationRated: jest.fn().mockResolvedValue(undefined),
};

beforeAll(async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider('RESERVATION_PACKAGE')
    .useValue(mockGrpcClient)
    .overrideProvider(RatingEventsPublisher)
    .useValue(mockRatingEventsPublisher)
    .compile();

  app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useLogger(new Logger('E2E-TEST', { timestamp: true }));

  await app.init();
}, 120000);

afterAll(async () => {
  if (app) {
    await app.close();
  }
}, 30000);
