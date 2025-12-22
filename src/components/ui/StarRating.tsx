import React from "react";

interface StarRatingProps {
  rating: number | null;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = "md",
  showNumber = true,
  className,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const renderStars = () => {
    const stars = [];
    const ratingValue = rating ?? 0;
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={i}
          className={`${sizeClasses[size]} text-[#fbbf24] fill-current`}
          viewBox="0 0 24 24"
        >
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
        </svg>
      );
    }

    if (hasHalfStar && fullStars < maxRating) {
      stars.push(
        <div key="half" className="relative inline-block">
          <svg
            className={`${sizeClasses[size]} text-gray-300 fill-current`}
            viewBox="0 0 24 24"
          >
            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
          </svg>
          <div className="absolute top-0 left-0 overflow-hidden" style={{ width: "50%", height: "100%" }}>
            <svg
              className={`${sizeClasses[size]} text-[#fbbf24] fill-current`}
              viewBox="0 0 24 24"
            >
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      );
    }

    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg
          key={`empty-${i}`}
          className={`${sizeClasses[size]} text-gray-300 fill-current`}
          viewBox="0 0 24 24"
        >
          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
        </svg>
      );
    }

    return stars;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">{renderStars()}</div>
      {showNumber && (
        <span className="ml-1 text-sm font-medium text-gray-700">
          {rating !== null ? rating.toFixed(1) : "N/A"}
        </span>
      )}
    </div>
  );
};
