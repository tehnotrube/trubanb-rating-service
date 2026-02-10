import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RatingEventsPublisher } from './rating-events.publisher';
import * as ratingEvents from './events/rating-events';

describe('RatingEventsPublisher', () => {
  let publisher: RatingEventsPublisher;
  let mockAmqpConnection: jest.Mocked<AmqpConnection>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingEventsPublisher,
        {
          provide: AmqpConnection,
          useValue: {
            publish: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    publisher = module.get<RatingEventsPublisher>(RatingEventsPublisher);
    mockAmqpConnection = module.get(AmqpConnection);

    jest.clearAllMocks();

    jest
      .spyOn(ratingEvents, 'createNotificationEventId')
      .mockReturnValue('test-event-id');
    jest
      .spyOn(ratingEvents, 'createTimestamp')
      .mockReturnValue('2026-01-15T10:00:00.000Z');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('notifyHostRated', () => {
    it('should publish host rated event to trubanb.notifications exchange', async () => {
      const payload = {
        ratingId: 'rating_123',
        hostId: 'host_456',
        guestId: 'guest_789',
        guestName: 'John Doe',
        rating: 5,
        comment: 'Excellent host!',
      };

      await publisher.notifyHostRated(payload);

      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'trubanb.notifications',
        'rating.host.created',
        {
          eventId: 'test-event-id',
          eventType: 'rating.host.created',
          timestamp: '2026-01-15T10:00:00.000Z',
          payload,
        },
      );
    });

    it('should publish host rated event without comment', async () => {
      const payload = {
        ratingId: 'rating_123',
        hostId: 'host_456',
        guestId: 'guest_789',
        guestName: 'John Doe',
        rating: 4,
      };

      await publisher.notifyHostRated(payload);

      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'trubanb.notifications',
        'rating.host.created',
        {
          eventId: 'test-event-id',
          eventType: 'rating.host.created',
          timestamp: '2026-01-15T10:00:00.000Z',
          payload,
        },
      );
    });
  });

  describe('notifyAccommodationRated', () => {
    it('should publish accommodation rated event to trubanb.notifications exchange', async () => {
      const payload = {
        ratingId: 'rating_456',
        accommodationId: 'acc_123',
        accommodationName: 'Beach House',
        hostId: 'host_789',
        guestId: 'guest_012',
        guestName: 'Jane Smith',
        rating: 5,
        comment: 'Beautiful place!',
      };

      await publisher.notifyAccommodationRated(payload);

      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'trubanb.notifications',
        'rating.accommodation.created',
        {
          eventId: 'test-event-id',
          eventType: 'rating.accommodation.created',
          timestamp: '2026-01-15T10:00:00.000Z',
          payload,
        },
      );
    });

    it('should publish accommodation rated event without comment', async () => {
      const payload = {
        ratingId: 'rating_456',
        accommodationId: 'acc_123',
        accommodationName: 'Mountain Cabin',
        hostId: 'host_789',
        guestId: 'guest_012',
        guestName: 'Jane Smith',
        rating: 3,
      };

      await publisher.notifyAccommodationRated(payload);

      expect(mockAmqpConnection.publish).toHaveBeenCalledWith(
        'trubanb.notifications',
        'rating.accommodation.created',
        {
          eventId: 'test-event-id',
          eventType: 'rating.accommodation.created',
          timestamp: '2026-01-15T10:00:00.000Z',
          payload,
        },
      );
    });
  });
});
