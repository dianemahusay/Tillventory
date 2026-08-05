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
  const threshold = isSmallUnit ? 1 : 3;

  // 2. Return true if current quantity is at or below threshold
  return currentQty <= threshold;
};

export const filterLowStockProducts = (products: ProductItem[]): ProductItem[] => {
  return products.filter((product) => isProductLowStock(product));
};

export const renderStockText = (item: ProductItem): string => {
  const currentQty = Number(item.quantity || 0);
  const restockUnit = item.restock_unit || item.unit || "";

  // Math.ceil rounds UP if there's any fraction left (e.g., 0.764 -> 1, 1.2 -> 2)
  const displayQty = currentQty > 0 ? Math.ceil(currentQty) : 0;

  return `${displayQty} ${restockUnit} left`;
};