import { createClient } from "@supabase/supabase-js";

// هذا الملف بيتشغل على السيرفر بس (API routes / Server Components).
// متستخدمش SUPABASE_SERVICE_ROLE_KEY في أي كومبوننت شغال في المتصفح.
const supabaseUrl = process.env.SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "[supabaseAdmin] SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY مش متظبطين في .env.local"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export const GALLERY_BUCKET = "gallery";
