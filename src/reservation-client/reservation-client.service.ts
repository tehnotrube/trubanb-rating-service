import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

interface RatingValidationRequest {
  reservationId: string;
  guestId: string;
}

export interface RatingValidationResponse {
  canRate: boolean;
  hostId: string;
  accommodationId: string;
  isPast: boolean;
}

interface ReservationGrpcService {
  getReservationForRating(
    data: RatingValidationRequest,
  ): Observable<RatingValidationResponse>;
}

@Injectable()
export class ReservationClientService implements OnModuleInit {
  private reservationService: ReservationGrpcService;

  constructor(
    @Inject('RESERVATION_PACKAGE')
    private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.reservationService =
      this.client.getService<ReservationGrpcService>('ReservationService');
  }

  async validateReservationForRating(
    reservationId: string,
    guestId: string,
  ): Promise<RatingValidationResponse> {
    try {
      return await firstValueFrom(
        this.reservationService.getReservationForRating({
          reservationId,
          guestId,
        }),
      );
    } catch (error) {
      Logger.error('gRPC call failed', error);
      return { canRate: false, hostId: '', accommodationId: '', isPast: false };
    }
  }
}
