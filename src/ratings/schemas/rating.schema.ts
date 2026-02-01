// src/ratings/schemas/rating.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt
export class Rating extends Document {
  @Prop({ required: true })
  guestId: string;

  @Prop({ required: true })
  reservationId: string;

  @Prop({ required: true, enum: ['HOST', 'ACCOMMODATION'] })
  targetType: string;

  @Prop({ required: true })
  targetId: string; // Will store either HostID or AccommodationID

  @Prop({ required: true, min: 1, max: 5 })
  score: number;

  @Prop()
  comment: string;

  createdAt: Date;
  updatedAt: Date;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

// INDEXES: Important for performance
// 1. Ensure a guest can only rate a specific target ONCE per reservation
RatingSchema.index(
  { guestId: 1, targetId: 1, reservationId: 1 },
  { unique: true },
);
// 2. Fast lookup for averages
RatingSchema.index({ targetId: 1 });
