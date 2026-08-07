import { Databases } from "react-native-appwrite";
import { ProductItem } from "./stockUtils";

const DATABASE_ID = "6a694ca9001b95d71b14";
const PRODUCTS_COLLECTION_ID = "products";

type CacheStore = {
  data: ProductItem[] | null;
  timestamp: number | null;
};

const cache: CacheStore = {
  data: null,
  timestamp: null,
};

// Time-to-live for cache in milliseconds (2 minutes)
const TTL = 2 * 60 * 1000;

export const getProducts = async (databases: Databases, force = false): Promise<ProductItem[]> => {
  const now = Date.now();
  if (!force && cache.data && cache.timestamp && now - cache.timestamp < TTL) {
    return cache.data;
  }

  const res = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID);
  const docs = (res.documents || []) as ProductItem[];
  cache.data = docs;
  cache.timestamp = Date.now();
  return docs;
};

export const invalidateProductsCache = () => {
  cache.data = null;
  cache.timestamp = null;
};

export default { getProducts, invalidateProductsCache };
