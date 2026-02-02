export class RatingResponseDto {
  id: string;
  guestId: string;
  targetId: string;
  targetType: 'HOST' | 'ACCOMMODATION';
  score: number;
  comment?: string;
  createdAt: Date;
}
