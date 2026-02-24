import { supabase, STORAGE_BUCKET } from "./supabase";
import type { ProductRecord, ProductFilters, ProductStoneEntry } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SaveProductPayload {
  productName: string;
  productImageFile: File | null;
  existingImageUrl: string | null; // reuse if no new file picked
  purity: string;
  netGoldWeight: number;
  stones: ProductStoneEntry[];     // stoneTypeId, name, weight, quantity only
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

export async function uploadProductImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) {
    const isBucketMissing =
      error.message?.toLowerCase().includes("bucket") ||
      error.message?.toLowerCase().includes("not found");
    if (!isBucketMissing) {
      console.error("[productsApi] Image upload failed:", error.message);
    }
    return null;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ─── Save Product ─────────────────────────────────────────────────────────────

export async function saveProduct(
  payload: SaveProductPayload
): Promise<{ data: ProductRecord | null; error: string | null }> {
  // Guard: require product name
  if (!payload.productName.trim()) {
    return { data: null, error: "Product name is required to save." };
  }

  // Guard: require image (either a new file or an existing URL)
  const hasImage = payload.productImageFile !== null || payload.existingImageUrl !== null;
  if (!hasImage) {
    return { data: null, error: "A product image is required to save." };
  }

  // Resolve image URL: upload new file, or reuse existing URL
  let imageUrl: string | null = payload.existingImageUrl;
  if (payload.productImageFile) {
    imageUrl = await uploadProductImage(payload.productImageFile);
    // If upload failed, fall back to existing URL rather than blocking save
    if (!imageUrl) {
      imageUrl = payload.existingImageUrl;
    }
  }

  const row = {
    product_name: payload.productName.trim(),
    product_image_url: imageUrl,
    purity: payload.purity,
    net_gold_weight: payload.netGoldWeight,
    stones: payload.stones,
  };

  const { data, error } = await supabase
    .from("products")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("[productsApi] Save failed:", error.message);
    return { data: null, error: error.message };
  }

  return { data: data as ProductRecord, error: null };
}

// ─── Fetch Products (with server-side filters) ────────────────────────────────

export async function fetchProducts(
  filters: ProductFilters
): Promise<{ data: ProductRecord[]; error: string | null }> {
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  // Text search on product name
  if (filters.search.trim()) {
    query = query.ilike("product_name", `%${filters.search.trim()}%`);
  }

  // Purity filter
  if (filters.purities.length > 0) {
    query = query.in("purity", filters.purities);
  }

  // Gold weight range (server-side)
  if (filters.goldWeightMin !== "") {
    query = query.gte("net_gold_weight", parseFloat(filters.goldWeightMin));
  }
  if (filters.goldWeightMax !== "") {
    query = query.lte("net_gold_weight", parseFloat(filters.goldWeightMax));
  }

  const { data, error } = await query;

  if (error) {
    console.error("[productsApi] Fetch failed:", error.message);
    return { data: [], error: error.message };
  }

  let results = (data ?? []) as ProductRecord[];

  // Stone type filter — client-side (JSONB array containment)
  if (filters.stoneTypeIds.length > 0) {
    results = results.filter((p) =>
      p.stones.some((s) => filters.stoneTypeIds.includes(s.stoneTypeId))
    );
  }

  // Note: price range filter is applied client-side in useProducts after
  // dynamic pricing is computed, since prices are not stored in the DB.

  return { data: results, error: null };
}

// ─── Delete Product ───────────────────────────────────────────────────────────

export async function deleteProduct(
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error("[productsApi] Delete failed:", error.message);
    return { error: error.message };
  }

  return { error: null };
}
