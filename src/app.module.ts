import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsModule } from './metrics';
import { HealthModule } from './health/health.module';
import { RatingsModule } from './ratings/ratings.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MetricsModule,
    HealthModule,
    RatingsModule,
    MessagingModule,
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ratings_db',
        directConnection: true,
        serverSelectionTimeoutMS: 5000,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
