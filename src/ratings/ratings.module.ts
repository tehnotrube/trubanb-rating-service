import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { Rating, RatingSchema } from './schemas/rating.schema';
import { ReservationsClientModule } from '../reservation-client/reservation-client.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rating.name, schema: RatingSchema }]),
    ClientsModule.register([
      {
        name: 'RESERVATION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'reservation',
          protoPath: join(__dirname, '../proto/reservation.proto'),
          url:
            process.env.RESERVATION_GRPC_URL ||
            'trubanb-reservation-service:50052',
        },
      },
    ]),
    ReservationsClientModule,
    MessagingModule,
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
