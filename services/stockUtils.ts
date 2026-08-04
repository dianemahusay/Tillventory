import { Models } from "react-native-appwrite";

export interface ProductItem extends Models.Document {
  product_name: string;
  quantity: number;
  restock_unit?: string;
  unit?: string;
  unit_cost?: number;
  conversion_factor?: number;
}

/**
 * Checks whether a single product is in low-stock status.
 * Falls back to unit type (small-unit vs large-unit thresholds).
 */
export const isProductLowStock = (product: ProductItem): boolean => {
  const currentQty = Number(product.quantity || 0);

  // 1. Identify unit type to determine fallback threshold
  const unit = (product.unit || "").trim().toLowerCase();
  const isSmallUnit = ["tbsp", "tbps", "tsp", "shot", "pcs"].includes(unit);
  const threshold = isSmallUnit ? 1 : 4;

  // 2. Return true if current quantity is at or below threshold
  return currentQty <= threshold;
};

export const filterLowStockProducts = (products: ProductItem[]): ProductItem[] => {
  return products.filter((product) => isProductLowStock(product));
};

export const renderStockText = (item: ProductItem): string => {
  const currentQty = Number(item.quantity || 0);
  const restockUnit = item.restock_unit || item.unit || "";

  let displayQty = Math.floor(currentQty);

  // If you want to decrement when the decimal portion is <= 0.5:
  const decimalPart = currentQty % 1;
  if (decimalPart > 0 && decimalPart <= 0.05) {
    displayQty = Math.max(0, Math.floor(currentQty) - 1);
  }

  return `${displayQty} ${restockUnit} left`;
};