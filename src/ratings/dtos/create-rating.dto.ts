export class CreateRatingDto {
  reservationId: string;
  type: 'HOST' | 'ACCOMMODATION';
  score: number;
  comment?: string;
}
