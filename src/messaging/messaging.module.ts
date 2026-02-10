import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RatingEventsPublisher } from './rating-events.publisher';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'trubanb.notifications',
            type: 'topic',
          },
        ],
        uri: configService.get<string>(
          'RABBITMQ_URL',
          'amqp://guest:guest@localhost:5672',
        ),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  providers: [RatingEventsPublisher],
  exports: [RatingEventsPublisher],
})
export class MessagingModule {}
