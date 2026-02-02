import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsModule } from './metrics';
import { HealthModule } from './health/health.module';
import { RatingsModule } from './ratings/ratings.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MetricsModule,
    HealthModule,
    RatingsModule,
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
