/**
 * BIHAN Product Image Mapping
 * Maps product SKU and name to high-resolution product photography
 */

export function getProductImageUrl(
  product?: {
    sku?: string | null;
    name?: string | null;
  } | null
): string | null {
  if (!product) return null;

  const sku = (product.sku || '').toUpperCase();
  const name = (product.name || '').toLowerCase();

  // 1. Classic Floor Cleaner (White container)
  if (sku.includes('CLASSIC') || name.includes('classic')) {
    return '/products/classic-floor-cleaner.png';
  }

  // 2. Toilet Cleaner (Blue container)
  if (sku.includes('TC') || sku.includes('TOILET') || name.includes('toilet')) {
    return '/products/toilet-cleaner.png';
  }

  // 3. Lavender Floor Cleaner (Lavender / cyan container)
  if (sku.includes('LAVENDER') || name.includes('lavender')) {
    return '/products/lavender-floor-cleaner.png';
  }

  // Fallback for general floor cleaner if not lavender
  if (sku.includes('FC') || name.includes('floor')) {
    return '/products/classic-floor-cleaner.png';
  }

  return null;
}
