import type { Lookups } from './types';

/** Mirrors the seed rows in supabase/schema.sql. Used when the database is unreachable or not configured. */
export const DEFAULT_LOOKUPS: Lookups = {
  colleges: [
    { id: 'arts', name_ar: 'كلية الآداب', name_en: 'Faculty of Arts' },
    { id: 'science', name_ar: 'كلية العلوم', name_en: 'Faculty of Science' },
    { id: 'edu', name_ar: 'كلية العلوم التربوية', name_en: 'Faculty of Educational Sciences' },
    { id: 'econ', name_ar: 'كلية الاقتصاد والعلوم الإدارية', name_en: 'Faculty of Economics & Administrative Sciences' },
    { id: 'eng', name_ar: 'كلية الهندسة', name_en: 'Faculty of Engineering' },
    { id: 'it', name_ar: 'كلية تكنولوجيا المعلومات', name_en: 'Faculty of Information Technology' },
    { id: 'med', name_ar: 'كلية الطب', name_en: 'Faculty of Medicine' },
    { id: 'nurs', name_ar: 'كلية التمريض', name_en: 'Faculty of Nursing' },
    { id: 'allied', name_ar: 'كلية العلوم الطبية التطبيقية', name_en: 'Faculty of Allied Medical Sciences' },
    { id: 'pharm', name_ar: 'كلية الصيدلة', name_en: 'Faculty of Pharmacy' },
    { id: 'nat', name_ar: 'كلية الموارد الطبيعية والبيئة', name_en: 'Faculty of Natural Resources & Environment' },
    { id: 'other', name_ar: 'أخرى', name_en: 'Other' },
  ],
  categories: [
    { id: 'books', icon: 'book', name_ar: 'كتب ومراجع', name_en: 'Books & notes' },
    { id: 'electronics', icon: 'cpu', name_ar: 'إلكترونيات', name_en: 'Electronics' },
    { id: 'lab', icon: 'ruler', name_ar: 'أدوات مخبر وهندسة', name_en: 'Lab & engineering' },
    { id: 'clothes', icon: 'shirt', name_ar: 'ملابس ومعاطف', name_en: 'Clothing' },
    { id: 'stationery', icon: 'pencil', name_ar: 'قرطاسية', name_en: 'Stationery' },
    { id: 'other', icon: 'box', name_ar: 'أخرى', name_en: 'Other' },
  ],
  conditions: [
    { id: 'new', name_ar: 'جديد', name_en: 'New' },
    { id: 'excellent', name_ar: 'ممتازة', name_en: 'Excellent' },
    { id: 'good', name_ar: 'جيدة', name_en: 'Good' },
    { id: 'used', name_ar: 'مستعملة', name_en: 'Used' },
  ],
};
