'use client';

import React from 'react';
import { getProductImageUrl } from '@/lib/product-images';

interface ProductImageProps {
  product?: {
    sku?: string | null;
    name?: string | null;
    imageEmoji?: string | null;
  } | null;
  className?: string;
  fallbackEmoji?: string;
  alt?: string;
}

export function ProductImage({
  product,
  className = 'w-10 h-10',
  fallbackEmoji,
  alt,
}: ProductImageProps) {
  const imageUrl = getProductImageUrl(product);
  const emoji = fallbackEmoji || product?.imageEmoji || '📦';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt || product?.name || 'BIHAN Product'}
        className={`object-contain inline-block shrink-0 ${className}`}
        loading="lazy"
      />
    );
  }

  return (
    <span className="inline-flex items-center justify-center shrink-0 select-none">
      {emoji}
    </span>
  );
}
