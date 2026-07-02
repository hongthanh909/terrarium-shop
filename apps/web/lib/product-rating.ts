type RatingSource = {
  rating?: number | null;
};

type ProductRatingSource = {
  displayRating?: number | string | { toString: () => string } | null;
  displayReviewCount?: number | null;
  reviews?: RatingSource[] | null;
  _count?: { reviews?: number | null } | null;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function toNumber(value: number | string | { toString: () => string } | null | undefined) {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(parsed) ? parsed : null;
}

export function getProductRatingSummary(product: ProductRatingSource) {
  const reviews = Array.isArray(product.reviews) ? product.reviews : [];
  if (reviews.length > 0) {
    const avg = reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length;
    return {
      rating: Math.round(avg * 10) / 10,
      reviewCount: reviews.length,
      hasRealReviews: true,
    };
  }

  const displayRating = toNumber(product.displayRating);
  const displayReviewCount = product.displayReviewCount || 0;

  if (displayRating && displayReviewCount > 0) {
    return {
      rating: Math.round(clamp(displayRating, 0, 5) * 10) / 10,
      reviewCount: displayReviewCount,
      hasRealReviews: false,
    };
  }

  return {
    rating: 0,
    reviewCount: 0,
    hasRealReviews: false,
  };
}

export function getPositiveRatingBreakdown(rating: number, count: number) {
  if (rating <= 0 || count <= 0) {
    return [
      { stars: 5, count: 0, percent: 0 },
      { stars: 4, count: 0, percent: 0 },
      { stars: 3, count: 0, percent: 0 },
      { stars: 2, count: 0, percent: 0 },
      { stars: 1, count: 0, percent: 0 },
    ];
  }

  const fiveStarCount = Math.max(0, Math.min(count, Math.round(count * clamp(rating - 4, 0, 1))));
  const fourStarCount = count - fiveStarCount;

  return [
    { stars: 5, count: fiveStarCount, percent: Math.round((fiveStarCount / count) * 100) },
    { stars: 4, count: fourStarCount, percent: Math.round((fourStarCount / count) * 100) },
    { stars: 3, count: 0, percent: 0 },
    { stars: 2, count: 0, percent: 0 },
    { stars: 1, count: 0, percent: 0 },
  ];
}
