import { createClient } from "@supabase/supabase-js";

// هذا الملف بيتشغل على السيرفر بس (API routes / Server Components).
// متستخدمش SUPABASE_SERVICE_ROLE_KEY في أي كومبوننت شغال في المتصفح.
// لو المفاتيح مش متظبطة لسه، بنستخدم قيم وهمية عشان الموقع يبني ويشتغل
// (بدل ما يكرش تمامًا)، وبس أي طلب حقيقي للداتابيز هيرجع خطأ واضح
// بدل ما يوقف السيرفر كله.
const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[supabaseAdmin] SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY مش متظبطين في .env.local"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export const GALLERY_BUCKET = "gallery";
