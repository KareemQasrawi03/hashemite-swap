export type Lang = 'ar' | 'en';
export type Theme = 'light' | 'dark' | 'auto';

export type Named = { id: string; name_ar: string; name_en: string };
export type Category = Named & { icon: string };

export type Lookups = {
  colleges: Named[];
  categories: Category[];
  conditions: Named[];
};

export type Listing = {
  id: string;
  created_at: string;
  title: string;
  title_en: string | null;
  description: string;
  description_en: string | null;
  want: string;
  want_en: string | null;
  category: string;
  condition: string;
  college: string;
  owner_name: string;
  phone: string | null;
  image_url: string | null;
  is_example: boolean;
};

export type NewListing = {
  title: string;
  description: string;
  want: string;
  category: string;
  condition: string;
  college: string;
  owner_name: string;
  phone: string;
  image_url: string | null;
};
