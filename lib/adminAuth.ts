import { cookies } from "next/headers";

export const ADMIN_COOKIE = "akhshab_admin_session";

// في MVP بسيط زي ده، الكوكي بتحمل قيمة ثابتة بعد تسجيل دخول ناجح.
// ده كافي كحماية أولية لصفحة إدارة داخلية، لكنه مش بديل عن نظام
// auth حقيقي (زي Supabase Auth) لو الموقع هيكبر أو يبقى فيه أكتر من أدمن.
export const ADMIN_SESSION_VALUE = "granted";

export async function isAdminAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === ADMIN_SESSION_VALUE;
}
