<p align="center">
  <img src="public/logo.webp" alt="مقايضة الهاشمية" width="140">
</p>

<h1 align="center">مقايضة الهاشمية</h1>

<p align="center">سوق مقايضة لطلاب الجامعة الهاشمية: بدّل ما عندك بما تحتاجه، من دون دفع نقود.</p>

---

## شو بيعمل الموقع

- **الطلاب** بينشروا طلب مقايضة (صورة، وصف، شو بدهم بالمقابل، الكلية، رقم التلفون).
- **كل طلب بيوصل للإدارة أول** (قيد المراجعة)، وما بيظهر للناس إلا بعد ما يوافق عليه أدمن.
- **الزوار** بيتصفحوا الطلبات، وبيبحثوا حسب الكلية أو الفئة، وبيتواصلوا مع صاحب الطلب بالواتساب أو بنسخ الرقم.
- **صاحب الطلب** بيقدر يحذفه من نفس المتصفح اللي نشر منه، والموقع بيسأله إذا تمت المقايضة عشان تنحسب بالإحصائيات.
- **لوحة الإدارة** (`/admin`): مراجعة الطلبات والموافقة أو الرفض، ولوحة تحكم فيها دونت بحالة الطلبات وإحصائيات.
- عربي وإنجليزي، فاتح وداكن.

## التقنيات

| | |
|---|---|
| الواجهة | [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript |
| قاعدة البيانات والتخزين | [Supabase](https://supabase.com) (Postgres، Auth للأدمن، Storage للصور) |
| النشر | [Netlify](https://netlify.com)، بينشر تلقائيًا مع كل `push` على `main` |

ما في سيرفر خاص: الموقع بيحكي مع Supabase مباشرة، والحماية كلها بقواعد RLS ودوال `security definer` بقاعدة البيانات.

## التشغيل على جهازك

بتحتاج Node.js 20.9 أو أحدث.

```bash
npm install
cp .env.example .env.local   # وحط مفتاح Supabase فيه (تحت)
npm run dev                  # http://localhost:3000
```

استخدم `npm run dev` للتطوير. `npm start` بيشغّل نسخة مبنية جاهزة وما بيتحدّث مع التعديلات.

| الأمر | شو بيعمل |
|---|---|
| `npm run dev` | سيرفر تطوير بيتحدّث لحاله |
| `npm run build` | بناء نسخة الإنتاج |
| `npm run typecheck` | فحص TypeScript |

### متغيرات البيئة

بملف `.env.local` محليًا، وبإعدادات Netlify (**Project configuration ← Environment variables**) للموقع اللايف:

| المتغير | القيمة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://mothuqxifpqjimvskult.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | مفتاح **anon** من Supabase ← Project Settings ← API |

مفتاح anon آمن ينكشف بالمتصفح. **لا تحط أبدًا** مفتاح `service_role` أو `secret` بالموقع.

المتغيرات اللي بتبلش بـ `NEXT_PUBLIC_` بتنحط بالموقع وقت البناء، فإذا غيّرتها على Netlify لازم تعمل **Trigger deploy ← Clear cache and deploy project**.

## قاعدة البيانات

كل الإعداد بملف واحد: [`supabase/schema.sql`](supabase/schema.sql). بتفتح Supabase ← **SQL Editor** ← New query، وبتلصق الملف كامل وبتضغط **Run**. الملف آمن تشغّله أكثر من مرة، فبعد أي تعديل عليه شغّله كامل من جديد.

**الجداول:**

| الجدول | المحتوى |
|---|---|
| `listings` | طلبات المقايضة. `status` بتكون `pending` (بانتظار الموافقة) أو `approved` (منشور) أو `swapped` (تمت المقايضة) |
| `colleges`, `categories`, `conditions` | الكليات والفئات وحالات الغرض |
| `admins` | حسابات Supabase Auth المسموح إلها تدخل لوحة الإدارة |

**الدوال اللي بيستدعيها الموقع:**

| الدالة | مين بيستخدمها | شو بتعمل |
|---|---|---|
| `create_listing` | أي زائر | بتنشئ طلب جديد (بانتظار الموافقة)، وبترجع مفتاح حذف بينحفظ بالمتصفح |
| `delete_listing` / `mark_swapped` | صاحب الطلب | حذف الطلب، أو تسجيله كـ "تمت المقايضة" |
| `approve_listing` / `admin_delete_listing` | الأدمن | موافقة، أو رفض وحذف |
| `is_admin` | الموقع | بيتأكد إذا المستخدم الحالي أدمن |

الزوار بيشوفوا الطلبات المنشورة بس. مفتاح الحذف (`edit_token`) ما بينقرأ من برا قاعدة البيانات، والإضافة والحذف ما بيصيروا إلا عن طريق الدوال.

**الصور** بتنصغّر بالمتصفح لـ 640px بصيغة JPEG، وبتنرفع على bucket اسمه `listing-images`.

## حسابات الأدمن

صفحة الدخول بتاخد **اسم مستخدم**، والموقع بيحوّله لإيميل بالشكل `اسم_المستخدم@example.com` (بأحرف صغيرة).

لإضافة أدمن جديد:

1. Supabase ← **Authentication ← Users ← Add user ← Create new user**.
   - الإيميل: `username@example.com`.
   - كلمة سر.
   - علّم على ✅ **Auto Confirm User**.
2. SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where lower(email) = 'username@example.com'
   on conflict do nothing;
   ```

**لا تحط كلمات السر بأي ملف بالمشروع**، لأن الريبو عام.

## هيكل المشروع

```
app/
  layout.tsx            الإطار العام: الخطوط، الثيم، اللغة، الإشعارات
  (site)/               صفحات الزوار، مع الشريط الجانبي الصغير
    page.tsx            الرئيسية
    market/             طلبات المقايضة
    settings/           الإعدادات (الثيم، اللغة، حذف طلباتي)
  admin/                لوحة الإدارة، بشريط جانبي خاص فيها
    page.tsx            لوحة التحكم (الدونت والإحصائيات)
    pending/ published/ swapped/
  globals.css           كل التنسيقات وألوان الثيم
components/             مكوّنات الواجهة (الكرت، النوافذ، الأزرار…)
  admin/                مكوّنات لوحة الإدارة
lib/
  data.ts               كل الاتصال مع Supabase
  i18n.ts               النصوص بالعربي والإنجليزي
  types.ts              أنواع TypeScript
public/                 اللوجو
supabase/schema.sql     إعداد قاعدة البيانات كامل
```

**لتعديل النصوص:** كل كلام الموقع موجود بملف [`lib/i18n.ts`](lib/i18n.ts)، النسخة العربية فوق والإنجليزية تحت.

**لتعديل الألوان:** ألوان الثيم معرّفة بأول ملف [`app/globals.css`](app/globals.css)، للوضع الفاتح والداكن.

---

<p align="center">مبادرة طلابية، غير تابعة رسميًا للجامعة الهاشمية.</p>
