export type TargetRatingResponse = {
  targetId: string;
  averageScore: number;
  totalCount: number;
  ratings: Array<{
    id: any;
    guestId: string;
    score: number;
    comment?: string;
    createdAt: Date;
  }>;
};
