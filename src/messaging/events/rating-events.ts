import { randomUUID } from 'crypto';

export interface HostRatedNotificationEvent {
  eventId: string;
  eventType: 'rating.host.created';
  timestamp: string;
  payload: {
    ratingId: string;
    hostId: string;
    guestId: string;
    guestName: string;
    rating: number;
    comment?: string;
  };
}

export interface AccommodationRatedNotificationEvent {
  eventId: string;
  eventType: 'rating.accommodation.created';
  timestamp: string;
  payload: {
    ratingId: string;
    accommodationId: string;
    accommodationName: string;
    hostId: string;
    guestId: string;
    guestName: string;
    rating: number;
    comment?: string;
  };
}

export function createNotificationEventId(): string {
  return randomUUID();
}

export function createTimestamp(): string {
  return new Date().toISOString();
}
