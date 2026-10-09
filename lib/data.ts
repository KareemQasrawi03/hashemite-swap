import { getSupabase } from './supabase';
import type { Category, Listing, Lookups, Named, NewListing } from './types';

const BUCKET = 'listing-images';
const LISTING_COLS =
  'id,created_at,title,title_en,description,description_en,want,want_en,category,condition,college,owner_name,phone,image_url,is_example';

export class RateLimitError extends Error {}

export async function fetchLookups(): Promise<Lookups> {
  const sb = getSupabase();
  const [colleges, categories, conditions] = await Promise.all([
    sb.from('colleges').select('id,name_ar,name_en').order('sort'),
    sb.from('categories').select('id,icon,name_ar,name_en').order('sort'),
    sb.from('conditions').select('id,name_ar,name_en').order('sort'),
  ]);
  for (const r of [colleges, categories, conditions]) if (r.error) throw r.error;
  return {
    colleges: colleges.data as Named[],
    categories: categories.data as Category[],
    conditions: conditions.data as Named[],
  };
}

export async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await getSupabase()
    .from('listings')
    .select(LISTING_COLS)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as Listing[];
}

export async function uploadImage(blob: Blob): Promise<string> {
  const storage = getSupabase().storage.from(BUCKET);
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await storage.upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return storage.getPublicUrl(path).data.publicUrl;
}

export async function createListing(l: NewListing): Promise<{ id: string; edit_token: string }> {
  const { data, error } = await getSupabase().rpc('create_listing', {
    p_title: l.title,
    p_description: l.description,
    p_want: l.want,
    p_category: l.category,
    p_condition: l.condition,
    p_college: l.college,
    p_owner_name: l.owner_name,
    p_phone: l.phone,
    p_image_url: l.image_url,
  });
  if (error) throw /rate_limited/.test(error.message) ? new RateLimitError(error.message) : error;
  return data as { id: string; edit_token: string };
}

/** Resolves true if a row was deleted; rejects only on network/server errors. */
export async function deleteListing(id: string, token: string): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('delete_listing', { p_id: id, p_token: token });
  if (error) throw error;
  return Boolean(data);
}
