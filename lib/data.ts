import { getSupabase } from './supabase';
import type { Category, Listing, Lookups, Named, NewListing } from './types';

const BUCKET = 'listing-images';
const LISTING_COLS =
  'id,created_at,title,title_en,description,description_en,want,want_en,category,condition,college,owner_name,phone,image_url,is_example,status';
// The site's login form takes a username; Supabase Auth needs an email.
const ADMIN_EMAIL_DOMAIN = 'example.com';

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
    // RLS already hides pending rows from visitors; this keeps them off the public board for a signed-in admin too.
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data as Listing[];
}

/* ---------- phone verification (Supabase phone OTP over SMS) ---------- */

export class PhoneNotVerifiedError extends Error {}

const toE164 = (p07: string) => '+962' + p07.slice(1);

/** Texts a one-time code to a 07XXXXXXXX number. */
export async function sendPhoneCode(phone: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOtp({ phone: toE164(phone) });
  if (error) throw error;
}

/** Checks the code; on success the browser is signed in as that phone number. */
export async function verifyPhoneCode(phone: string, code: string): Promise<void> {
  const { error } = await getSupabase().auth.verifyOtp({ phone: toE164(phone), token: code, type: 'sms' });
  if (error) throw error;
}

/** The SMS-verified number of the signed-in user as 07XXXXXXXX, or null. */
export async function verifiedPhone(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  const p = data.session?.user.phone; // e.g. "962791234567"
  return p && p.startsWith('962') && data.session?.user.phone_confirmed_at ? '0' + p.slice(3) : null;
}

/* ---------- admin ---------- */

export class NotAdminError extends Error {}

/** Signs in with a username and password; rejects with NotAdminError if the account is not an admin. */
export async function adminSignIn(username: string, password: string): Promise<void> {
  const sb = getSupabase();
  const email = `${username.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!(await isAdmin())) {
    await sb.auth.signOut();
    throw new NotAdminError('not an admin');
  }
}

export async function adminSignOut(): Promise<void> {
  await getSupabase().auth.signOut();
}

/** Username of the signed-in admin, or null. */
export async function currentAdmin(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  const email = data.session?.user.email;
  if (!email || !(await isAdmin())) return null;
  return email.split('@')[0];
}

async function isAdmin(): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('is_admin');
  return !error && data === true;
}

/** Every listing (pending and approved), for the admin page. */
export async function fetchAllListings(): Promise<Listing[]> {
  const { data, error } = await getSupabase()
    .from('listings')
    .select(LISTING_COLS)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data as Listing[];
}

export async function approveListing(id: string): Promise<void> {
  const { error } = await getSupabase().rpc('approve_listing', { p_id: id });
  if (error) throw error;
}

export async function adminDeleteListing(id: string): Promise<void> {
  const { error } = await getSupabase().rpc('admin_delete_listing', { p_id: id });
  if (error) throw error;
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
  if (error) {
    if (/rate_limited/.test(error.message)) throw new RateLimitError(error.message);
    if (/phone_not_verified/.test(error.message)) throw new PhoneNotVerifiedError(error.message);
    throw error;
  }
  return data as { id: string; edit_token: string };
}

/** Resolves true if a row was deleted; rejects only on network/server errors. */
export async function deleteListing(id: string, token: string): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('delete_listing', { p_id: id, p_token: token });
  if (error) throw error;
  return Boolean(data);
}
