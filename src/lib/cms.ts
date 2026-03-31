import type { Database } from "@/integrations/supabase/types";

type DestinationRow = Database["public"]["Tables"]["destinations"]["Row"];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function extractStoragePath(publicUrl: string, bucket: string) {
  const marker = `/${bucket}/`;
  const [, path = ""] = publicUrl.split(marker);
  return path;
}

export function resolveDestinationName(destination?: DestinationRow | null, fallback?: string | null) {
  return destination?.name || fallback || "";
}

export function resolveDestinationImage(destination?: DestinationRow | null, fallback = "/placeholder.svg") {
  return destination?.card_image_url || destination?.hero_image_url || fallback;
}

export function getPackagePricingDetails(discountedPrice: number, actualPrice?: number | null) {
  const normalizedDiscountedPrice = Math.max(discountedPrice || 0, 0);
  const normalizedActualPrice = Math.max(actualPrice || normalizedDiscountedPrice, normalizedDiscountedPrice);
  const discountAmount = normalizedActualPrice - normalizedDiscountedPrice;
  const discountPercent = normalizedActualPrice > 0
    ? Math.round((discountAmount / normalizedActualPrice) * 100)
    : 0;

  return {
    discountedPrice: normalizedDiscountedPrice,
    actualPrice: normalizedActualPrice,
    discountAmount,
    discountPercent,
    hasDiscount: discountAmount > 0,
  };
}
