import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreateRatingDto {
  @IsString()
  @IsNotEmpty()
  reservationId: string;

  @IsEnum(['HOST', 'ACCOMMODATION'], {
    message: 'type must be either HOST or ACCOMMODATION',
  })
  type: 'HOST' | 'ACCOMMODATION';

  @IsInt()
  @Min(1)
  @Max(5)
  score: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
