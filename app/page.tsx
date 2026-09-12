"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/constants";

const WORDS = ["خامات أصلية", "تفاصيل مدروسة", "تنفيذ بالميلي", "تصميم يدوم لسنين"];

const ROOM_OPTIONS = CATEGORIES;
const STYLE_OPTIONS = ["مودرن دافئ", "كلاسيك هادئ", "مينيمال", "صناعي Industrial"];
const MAX_IMAGE_GENS = 2;

type Suggestion = { title: string; description: string; materials?: string[] };
type GalleryImage = { name: string; url: string; category: string };
type Product = {
  id: string;
  category: string;
  name: string;
  price: number;
  offer_price: number | null;
  image_url: string | null;
};

/* ---------- reusable scroll-reveal wrapper ---------- */
function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal${inView ? " in" : ""}`}>
      {children}
    </div>
  );
}

/* ---------- animated stat number ---------- */
function StatNumber({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const step = Math.max(1, Math.round(target / 30));
          let cur = 0;
          const t = setInterval(() => {
            cur += step;
            if (cur >= target) {
              cur = target;
              clearInterval(t);
            }
            setValue(cur);
          }, 30);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <div className="num" ref={ref}>
      {value}
      {suffix}
    </div>
  );
}

function tiltHandlers() {
  return {
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      e.currentTarget.style.transform = `perspective(700px) rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "";
    },
  };
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---- AI assistant state ---- */
  const [aiMode, setAiMode] = useState<"ideas" | "image">("ideas");
  const [room, setRoom] = useState(ROOM_OPTIONS[0]);
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [notes, setNotes] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [aiError, setAiError] = useState(false);

  const [imgLoading, setImgLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imgError, setImgError] = useState("");
  const [remainingImageGens, setRemainingImageGens] = useState(MAX_IMAGE_GENS);

  async function handleAiSubmit() {
    setAiLoading(true);
    setAiError(false);
    setSuggestions(null);
    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, style, notes }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleGenerateImage() {
    if (remainingImageGens <= 0) return;
    setImgLoading(true);
    setImgError("");
    setGeneratedImage(null);
    try {
      const res = await fetch("/api/ai-generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, style, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImgError(data.error || "حصل خطأ");
        if (typeof data.remaining === "number") setRemainingImageGens(data.remaining);
        else setRemainingImageGens(0);
        return;
      }
      setGeneratedImage(data.image);
      setRemainingImageGens(data.remaining);
    } catch {
      setImgError("حصل خطأ، جرب تاني");
    } finally {
      setImgLoading(false);
    }
  }

  /* ---- gallery state ---- */
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [galleryTab, setGalleryTab] = useState("الكل");
  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((d) => setGallery(d.images || []))
      .catch(() => {});
  }, []);
  const galleryTabs = useMemo(() => {
    const cats = Array.from(new Set(gallery.map((i) => i.category)));
    return ["الكل", ...cats];
  }, [gallery]);
  const visibleGallery =
    galleryTab === "الكل" ? gallery : gallery.filter((i) => i.category === galleryTab);

  /* ---- products state ---- */
  const [products, setProducts] = useState<Product[]>([]);
  const [productTab, setProductTab] = useState("الكل");
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {});
  }, []);
  const productTabs = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ["الكل", ...cats];
  }, [products]);
  const visibleProducts =
    productTab === "الكل" ? products : products.filter((p) => p.category === productTab);

  /* ---- booking form state ---- */
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  async function handleBookingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBookingSubmitting(true);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          room_type: fd.get("room_type"),
          preferred_date: fd.get("preferred_date"),
          contact_method: fd.get("contact_method"),
          notes: fd.get("notes"),
        }),
      });
      if (res.ok) {
        setBookingSuccess(true);
        setTimeout(() => {
          setBookingSuccess(false);
          form.reset();
        }, 3200);
      }
    } finally {
      setBookingSubmitting(false);
    }
  }

  return (
    <>
      <header className={scrolled ? "scrolled" : ""}>
        <div className="wrap">
          <a href="#top" className="brand">
            <img src="/logo.webp" alt="شعار أخشاب" />
            <span className="brand-name">
              أخشاب<span>AKHSHAB — WOOD DESIGNS</span>
            </span>
          </a>
          <nav className="primary">
            <a href="#top">الرئيسية</a>
            <a href="#about">فلسفتنا</a>
            <a href="#collections">تصميماتنا</a>
            <a href="#gallery">شغلنا</a>
            <a href="#shop">منتجاتنا</a>
            <a href="#ai-assistant">المساعد الذكي</a>
            <a href="#booking">تواصل</a>
          </nav>
          <div className="nav-cta">
            <a href="#booking" className="btn btn-gold">احجز معاينة</a>
            <button className="menu-toggle" aria-label="القائمة" onClick={() => setMenuOpen((v) => !v)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <a href="#top" onClick={() => setMenuOpen(false)}>الرئيسية</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>فلسفتنا</a>
        <a href="#collections" onClick={() => setMenuOpen(false)}>تصميماتنا</a>
        <a href="#gallery" onClick={() => setMenuOpen(false)}>شغلنا</a>
        <a href="#shop" onClick={() => setMenuOpen(false)}>منتجاتنا</a>
        <a href="#ai-assistant" onClick={() => setMenuOpen(false)}>المساعد الذكي</a>
        <a href="#booking" onClick={() => setMenuOpen(false)}>تواصل</a>
      </div>

      <section className="hero" id="top">
        <div className="wrap">
          <div>
            <div className="hero-eyebrow"><i />تأسست 2025 — أثاث وأبواب خشبية</div>
            <h1>مفيش تفصيلة بسيطة<br />لما بيتك هو الموضوع</h1>
            <p className="lead">
              بنصمم ونصنّع قطع أثاث وأبواب من خشب حقيقي، بمراجعة دقيقة لكل قياس
              ولكل خامة قبل ما توصلك. مش بس شكل، ده أثاث بيتصنّع عشان يعيش معاك سنين.
            </p>
            <div className="hero-actions">
              <a href="#booking" className="btn btn-gold">احجز معاينة</a>
              <a href="#collections" className="btn btn-ghost">شوف تصميماتنا</a>
            </div>
          </div>
          <div className="hero-mark">
            <div className="hero-mark-inner">
              <img src="/logo.webp" alt="أخشاب — AKHSHAB Wood Designs" />
            </div>
          </div>
        </div>
        <div className="scroll-cue"><i />انزل تحت</div>
      </section>

      <div className="marquee-strip">
        <div className="marquee-track">
          {[...WORDS, ...WORDS].map((w, i) => (
            <span key={i}>{w}<i /></span>
          ))}
        </div>
      </div>

      <section className="about" id="about">
        <div className="wrap about-grid">
          <Reveal>
            <div className="about-copy">
              <h2 style={{ fontSize: "clamp(26px,3.2vw,36px)", marginBottom: 18 }}>
                التفاصيل مش تفاصيل
              </h2>
              <p>
                كل قطعة بتخرج من عندنا بتعدي على مراحل مراجعة قبل التنفيذ:
                القياسات، نوع الخشب، التشطيب، وحتى اتجاه عروق الخشب نفسه.
              </p>
              <p>
                مش بنستخدم بدائل خشب مضغوط رخيصة. بنشتغل بخامات حقيقية عشان
                القطعة تعيش في بيتك مش بس تتصور في الافتتاح.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="stat-row">
              <div className="stat"><StatNumber target={50} suffix="+" /><div className="label">مشروع اتسلّم بدقة</div></div>
              <div className="stat"><StatNumber target={100} suffix="%" /><div className="label">خشب حقيقي، من غير بدائل</div></div>
              <div className="stat"><StatNumber target={5} suffix="" /><div className="label">سنين ضمان على التصنيع</div></div>
              <div className="stat"><StatNumber target={3} suffix="" /><div className="label">أيام لتصميم أولي ببلاش</div></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="collections">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <h2>اختار المساحة اللي عايز نطورها</h2>
              <p>كل تصميم بنبنيه حوالين المساحة الحقيقية عندك، مش قالب جاهز بنكرره.</p>
            </div>
          </Reveal>
        </div>
        <div className="collections-grid">
          {[
            { g: "ن", t: "غرف النوم", tag: "دواليب، تخت، وحدات جانبية" },
            { g: "م", t: "المكاتب", tag: "مكتب تنفيذي، مكتبة، تخزين" },
            { g: "س", t: "غرف السفرة", tag: "طاولة، بوفيه، إضاءة معلقة" },
            { g: "ص", t: "الصالونات", tag: "أنتريه، وحدات تلفزيون، ركن قراءة" },
            { g: "أ", t: "الأبواب", tag: "أبواب داخلية وخارجية بتصميم مخصص" },
          ].map((c) => (
            <div className="collection-card" key={c.t} {...tiltHandlers()}>
              <div className="glyph">{c.g}</div>
              <h3>{c.t}</h3>
              <div className="tag">{c.tag}</div>
              <a href="#booking" className="go">اطلب تصميم مخصص</a>
            </div>
          ))}
        </div>
      </section>

      <section id="gallery">
        <div className="wrap">
          <Reveal>
            <div className="section-head center">
              <h2>شغلنا</h2>
              <p>لقطات حقيقية من مشاريع اتسلّمت، مقسّمة حسب نوع المساحة.</p>
            </div>
          </Reveal>

          <div className="gallery-tabs">
            {galleryTabs.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip${galleryTab === t ? " active" : ""}`}
                onClick={() => setGalleryTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {visibleGallery.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--muted)", marginBottom: 40 }}>
              لسه مفيش صور في القسم ده.
            </p>
          ) : (
            <div className="gallery-grid" key={galleryTab}>
              {visibleGallery.map((img, i) => (
                <div className="gallery-tile" key={img.name} style={{ animationDelay: `${i * 0.06}s` }}>
                  <img src={img.url} alt={img.category} loading="lazy" />
                  <span className="cat-label">{img.category}</span>
                </div>
              ))}
            </div>
          )}

          <div className="social-links">
            <a className="social-link" href="https://instagram.com/akhshabeg1" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>
              instagram/akhshabeg1
            </a>
            <a className="social-link" href="https://www.facebook.com/share/1BsHeDc5kf/?mibextid=wwXIfr" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 3h-2a5 5 0 0 0-5 5v2H6v4h2v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3z"/></svg>
              فيسبوك أخشاب
            </a>
            <a className="social-link" href="https://wa.me/201555970059" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20l1.1-5.4A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 9.5c0 4 3 6.5 6 6.5"/></svg>
              واتساب مباشر
            </a>
          </div>
        </div>
      </section>

      <section className="ai-section" id="shop">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <h2>عايز تشتري جاهز؟</h2>
              <p>منتجات جاهزة عندنا دلوقتي، من غير ما تستنى تصميم مخصص.</p>
            </div>
          </Reveal>

          {productTabs.length > 1 && (
            <div className="gallery-tabs">
              {productTabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip${productTab === t ? " active" : ""}`}
                  onClick={() => setProductTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {visibleProducts.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--muted)" }}>
              لسه مفيش منتجات متاحة دلوقتي — تابعنا على السوشيال ميديا لأحدث العروض.
            </p>
          ) : (
            <div className="product-grid">
              {visibleProducts.map((p) => {
                const hasOffer = !!p.offer_price && p.offer_price < p.price;
                return (
                  <div className="product-card" key={p.id}>
                    <div className="thumb">
                      {p.image_url && <img src={p.image_url} alt={p.name} />}
                      {hasOffer && <span className="badge-offer">عرض</span>}
                    </div>
                    <div className="body">
                      <div className="cat">{p.category}</div>
                      <h4>{p.name}</h4>
                      <div className="price-row">
                        {hasOffer ? (
                          <>
                            <span className="old">{p.price} ج.م</span>
                            <span className="now">{p.offer_price} ج.م</span>
                          </>
                        ) : (
                          <span className="now">{p.price} ج.م</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="ai-assistant">
        <div className="wrap">
          <Reveal>
            <div className="section-head">
              <h2>مش عارف تختار؟ خليه يساعدك</h2>
              <p>قولنا نوع المساحة واللي بتحبه — خد أفكار واستشارة، أو ولّد صورة أولية للفكرة.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="ai-panel">
              <div className="ai-form">
                <div className="ai-mode-toggle">
                  <button
                    type="button"
                    className={aiMode === "ideas" ? "active" : ""}
                    onClick={() => setAiMode("ideas")}
                  >
                    عايز أفكار واستشارة
                  </button>
                  <button
                    type="button"
                    className={aiMode === "image" ? "active" : ""}
                    onClick={() => setAiMode("image")}
                  >
                    ولّد صورة للفكرة
                  </button>
                </div>

                <label>المساحة</label>
                <div className="chip-group">
                  {ROOM_OPTIONS.map((r) => (
                    <button key={r} type="button" className={`chip${room === r ? " active" : ""}`} onClick={() => setRoom(r)}>
                      {r}
                    </button>
                  ))}
                </div>
                <label>الستايل المفضل</label>
                <div className="chip-group">
                  {STYLE_OPTIONS.map((s) => (
                    <button key={s} type="button" className={`chip${style === s ? " active" : ""}`} onClick={() => setStyle(s)}>
                      {s}
                    </button>
                  ))}
                </div>
                <label>أي تفاصيل تانية؟ (اختياري)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: المساحة صغيرة، وعايز ألوان فاتحة..."
                />

                {aiMode === "ideas" ? (
                  <button className="btn btn-gold btn-block" onClick={handleAiSubmit} disabled={aiLoading}>
                    {aiLoading ? "بيفكر..." : "اقترح عليا تصميم"}
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-gold btn-block"
                      onClick={handleGenerateImage}
                      disabled={imgLoading || remainingImageGens <= 0}
                    >
                      {imgLoading ? "بيرسم..." : remainingImageGens <= 0 ? "خلصت المحاولات" : "ولّد صورة للفكرة"}
                    </button>
                    <div className="ai-quota">متبقي لك {remainingImageGens} من {MAX_IMAGE_GENS} في الجلسة دي</div>
                  </>
                )}
              </div>

              <div className="ai-result">
                {aiMode === "ideas" && (
                  <>
                    {aiLoading && <div className="typing"><span /><span /><span /></div>}
                    {!aiLoading && aiError && <div className="ai-error">حصل خطأ، جرب تاني كمان شوية.</div>}
                    {!aiLoading && !aiError && !suggestions && (
                      <div className="ai-placeholder">
                        <span className="big">✦</span>
                        اختار المساحة والستايل، وهنجهزلك ٣ أفكار تناسب ذوقك بهوية أخشاب.
                      </div>
                    )}
                    {!aiLoading && suggestions && (
                      <>
                        {suggestions.map((s, i) => (
                          <div className="suggestion-card" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                            <h4>{s.title}</h4>
                            <p>{s.description}</p>
                            {s.materials && (
                              <div className="mats">
                                {s.materials.map((m, j) => <span key={j}>{m}</span>)}
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="ai-note">مقترحات أولية — التصميم النهائي بيتحدد بعد المعاينة.</div>
                      </>
                    )}
                  </>
                )}

                {aiMode === "image" && (
                  <>
                    {imgLoading && <div className="typing"><span /><span /><span /></div>}
                    {!imgLoading && imgError && <div className="ai-error">{imgError}</div>}
                    {!imgLoading && !imgError && !generatedImage && (
                      <div className="ai-placeholder">
                        <span className="big">✦</span>
                        هنولّدلك صورة أولية تقريبية للفكرة بهوية أخشاب (مش تصميم نهائي).
                      </div>
                    )}
                    {!imgLoading && generatedImage && (
                      <div className="ai-image-result">
                        <img src={generatedImage} alt="فكرة تصميم مولدة بالـ AI" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="booking">
        <div className="wrap booking-wrap">
          <Reveal>
            <div className="booking-info">
              <h2>احجز معاينة</h2>
              <p>
                المعاينة الميدانية للمساحة عندك برسوم رمزية بيتم تأكيدها مع
                فريقنا. بعد المعاينة، التصميم الأولي ببلاش بالكامل.
              </p>
              <ul>
                <li><i />معاينة ميدانية دقيقة للمساحة (برسوم)</li>
                <li><i />تصميم أولي ببلاش خلال 3 أيام عمل بعد المعاينة</li>
                <li><i />خامات حقيقية معروضة قبل التنفيذ</li>
                <li><i />طنطا — منطقة الاستاد — شارع البنداري</li>
              </ul>
            </div>
          </Reveal>
          <Reveal>
            <form className="booking-form" onSubmit={handleBookingSubmit}>
              <div className="field-row">
                <div className="field">
                  <label>الاسم</label>
                  <input type="text" name="name" required placeholder="اسمك بالكامل" />
                </div>
                <div className="field">
                  <label>رقم الموبايل</label>
                  <input type="tel" name="phone" required placeholder="01xxxxxxxxx" />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>نوع الأثاث المطلوب</label>
                  <select name="room_type" defaultValue="غرفة نوم">
                    <option>غرفة نوم</option>
                    <option>مكتب</option>
                    <option>صالون</option>
                    <option>غرفة سفرة</option>
                    <option>أبواب</option>
                    <option>مشروع تاني</option>
                  </select>
                </div>
                <div className="field">
                  <label>التاريخ المفضل للمعاينة</label>
                  <input type="date" name="preferred_date" />
                </div>
              </div>
              <div className="field">
                <label>أحسن طريقة نتواصل بيها معاك</label>
                <select name="contact_method" defaultValue="مكالمة تليفونية">
                  <option>مكالمة تليفونية</option>
                  <option>واتساب</option>
                </select>
              </div>
              <div className="field">
                <label>ملاحظات</label>
                <textarea name="notes" placeholder="احكيلنا عن المساحة أو أي تفاصيل مهمة" />
              </div>
              <button type="submit" className="btn btn-gold btn-block" disabled={bookingSubmitting}>
                {bookingSubmitting ? "بيترسل..." : "تأكيد الحجز"}
              </button>

              <div className={`form-success${bookingSuccess ? " show" : ""}`}>
                <div className="check-circle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
                </div>
                <h4>تم استلام طلبك</h4>
                <p>هيتصل بيك حد من فريقنا خلال 24 ساعة لتأكيد الموعد.</p>
              </div>
            </form>
          </Reveal>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="footer-top">
            <div className="footer-brand">
              <img src="/logo.webp" alt="شعار أخشاب" />
              <div className="brand-name">أخشاب<span>WE MAKE THE WOOD</span></div>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h5>روابط</h5>
                <a href="#about">فلسفتنا</a>
                <a href="#collections">تصميماتنا</a>
                <a href="#shop">منتجاتنا</a>
                <a href="#ai-assistant">المساعد الذكي</a>
              </div>
              <div className="footer-col">
                <h5>تواصل</h5>
                <p dir="ltr" style={{ textAlign: "right" }}>ahmedelzanaty001@gmail.com</p>
                <p dir="ltr" style={{ textAlign: "right" }}>01555970059</p>
                <p>طنطا — منطقة الاستاد — شارع البنداري</p>
              </div>
            </div>
          </div>
          <hr className="hairline" />
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} أخشاب — AKHSHAB Wood Designs. كل الحقوق محفوظة.</span>
            <div className="social-links">
              <a className="social-link" href="https://instagram.com/akhshabeg1" target="_blank" rel="noopener" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg>
              </a>
              <a className="social-link" href="https://www.facebook.com/share/1BsHeDc5kf/?mibextid=wwXIfr" target="_blank" rel="noopener" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 3h-2a5 5 0 0 0-5 5v2H6v4h2v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
