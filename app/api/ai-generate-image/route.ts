import { NextRequest, NextResponse } from "next/server";

const IMG_COOKIE = "akhshab_img_gen_count";
const MAX_PER_SESSION = 2;

// المدة القصوى المسموحة للفانكشن - توليد الصور ممكن ياخد وقت أطول
// من الطبيعي خصوصًا أول مرة بتحمل الموديل. لو خطة Vercel بتاعتك بتسمح
// بمدة أطول، ارفع الرقم ده.
export const maxDuration = 60;

function buildPrompt(room: string, style: string, notes: string) {
  return `Luxury interior design photo of a ${room}, ${style} style, warm dark wood tones with brass and gold accents, natural wood grain furniture, professional architectural photography, warm ambient lighting, brand identity: AKHSHAB wood designs. ${notes || ""}`;
}

async function generateViaModelRunner(prompt: string): Promise<string | null> {
  const baseUrl = process.env.MODEL_RUNNER_URL;
  if (!baseUrl) return null;

  const model = process.env.MODEL_RUNNER_MODEL || "stable-diffusion";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.MODEL_RUNNER_API_KEY) {
      headers.Authorization = `Bearer ${process.env.MODEL_RUNNER_API_KEY}`;
    }

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/engines/diffusers/v1/images/generations`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, prompt }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("Model Runner error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    return b64 ? `data:image/png;base64,${b64}` : null;
  } catch (err) {
    console.error("Model Runner unreachable:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateViaOpenRouter(prompt: string): Promise<string | null> {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite-image",
        prompt,
      }),
    });
    if (!res.ok) {
      console.error("OpenRouter image error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    return b64 ? `data:image/png;base64,${b64}` : null;
  } catch (err) {
    console.error("OpenRouter image generation failed:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const currentCount = parseInt(req.cookies.get(IMG_COOKIE)?.value || "0", 10);

  if (currentCount >= MAX_PER_SESSION) {
    return NextResponse.json(
      { error: `خلصت عدد المحاولات المتاحة لتوليد الصور في الجلسة دي (${MAX_PER_SESSION}).` },
      { status: 429 }
    );
  }

  const { room, style, notes } = await req.json();
  const prompt = buildPrompt(room, style, notes);

  // بنجرب الـ Model Runner بتاعك الأول (مجاني، شغال على السيرفر بتاعك)،
  // ولو مش متظبط أو مش متاح دلوقتي، بنرجع تلقائي لـ OpenRouter
  // (فيه تكلفة صغيرة لكل صورة) عشان الفيتشر يفضل شغال للعميل.
  let image = await generateViaModelRunner(prompt);
  let source = "model-runner";

  if (!image) {
    image = await generateViaOpenRouter(prompt);
    source = "openrouter-fallback";
  }

  if (!image) {
    return NextResponse.json(
      { error: "معرفناش نولّد الصورة دلوقتي، جرب تاني كمان شوية." },
      { status: 500 }
    );
  }

  const newCount = currentCount + 1;
  const response = NextResponse.json({
    image,
    source,
    remaining: MAX_PER_SESSION - newCount,
  });
  response.cookies.set(IMG_COOKIE, String(newCount), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
