import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  HostRatedNotificationEvent,
  AccommodationRatedNotificationEvent,
  createNotificationEventId,
  createTimestamp,
} from './events/rating-events';

@Injectable()
export class RatingEventsPublisher {
  private readonly logger = new Logger(RatingEventsPublisher.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  async notifyHostRated(
    payload: HostRatedNotificationEvent['payload'],
  ) {
    const event: HostRatedNotificationEvent = {
      eventId: createNotificationEventId(),
      eventType: 'rating.host.created',
      timestamp: createTimestamp(),
      payload,
    };

    this.logger.log(
      `Publishing notification: rating.host.created for host ${payload.hostId}`,
    );

    await this.amqpConnection.publish(
      'trubanb.notifications',
      'rating.host.created',
      event,
    );
  }

  async notifyAccommodationRated(
    payload: AccommodationRatedNotificationEvent['payload'],
  ) {
    const event: AccommodationRatedNotificationEvent = {
      eventId: createNotificationEventId(),
      eventType: 'rating.accommodation.created',
      timestamp: createTimestamp(),
      payload,
    };

    this.logger.log(
      `Publishing notification: rating.accommodation.created for accommodation ${payload.accommodationId}`,
    );

    await this.amqpConnection.publish(
      'trubanb.notifications',
      'rating.accommodation.created',
      event,
    );
  }
}
