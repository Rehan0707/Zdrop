import { useState, useEffect } from "react";
import { ArrowRight, ShieldCheck, Zap, Lock, Clock, Store } from "lucide-react";
import { FileMetadata, PrintPreferences, PrintPreferencesSchema, ShopProfile } from "@/lib/types";
import { DropZone } from "@/components/DropZone";
import { PrintPreferencesCard } from "@/components/PrintPreferencesCard";
import HolographicCard from "@/components/ui/holographic-card";
import { useAuth } from "@/lib/auth-context";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

interface HeroSectionProps {
  onGenerateCode: (files: FileMetadata[], preferences: PrintPreferences, shop?: { id: string; name: string }) => void;
  isGenerating?: boolean;
  uploadProgress?: number;
}

export function HeroSection({
  onGenerateCode,
  isGenerating = false,
  uploadProgress = 0,
}: HeroSectionProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [preferences, setPreferences] = useState<PrintPreferences>({
    copies: 1,
    colorMode: "BW",
    sides: "DOUBLE",
    pageRange: "ALL",
  });
  const [shops, setShops] = useState<ShopProfile[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>("");

  useEffect(() => {
    fetch("/api/shops")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.shops)) setShops(data.shops);
      })
      .catch(() => {});
  }, []);

  const validation = PrintPreferencesSchema.safeParse(preferences);
  const canSubmit = files.length > 0 && validation.success;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const chosenShop = shops.find((s) => s.id === selectedShopId);
    onGenerateCode(
      files,
      preferences,
      chosenShop ? { id: chosenShop.id, name: chosenShop.shopName } : undefined
    );
  };

  return (
    <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 overflow-hidden" id="upload">
      {/* Background Ambient Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-500/10 via-cyan-500/10 to-indigo-500/5 dark:from-cyan-500/10 dark:via-blue-500/10 dark:to-indigo-500/5 blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/5 blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left Column: High-Impact Hero Copy (Formula: [End result] + [Without fear]) */}
          <div className="lg:col-span-7 space-y-6 lg:pt-4">
            {/* Security Category Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/30 text-blue-700 dark:text-cyan-300 text-xs font-semibold shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Zero-Friction Counter Printing</span>
            </div>

            {/* Headline: [End result the user wants] + [Without the thing they fear] */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-[1.08] font-display">
              Print Any Document in 10 Seconds Flat:{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400">
                Without WhatsApp, USBs, or Leaving Files on Stranger PCs.
              </span>
            </h1>

            {/* Subhead (Clear, under 20 words per clause, benefit-rich) */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-sans">
              Drop your files on your phone, select your copies and duplex sides in two taps, and hand a 6-digit PIN across the counter. The operator spools it directly, and your files vanish forever the instant printing finishes.
            </p>

            {/* 3 Core Trust Pillars Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <HolographicCard
                intensity={16}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#121622]/70 backdrop-blur-md shadow-2xs"
              >
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs font-bold font-display">100% Anonymous</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Zero phone numbers, zero emails, zero accounts needed.</p>
              </HolographicCard>

              <HolographicCard
                intensity={16}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#121622]/70 backdrop-blur-md shadow-2xs"
              >
                <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold font-display">Dual-Trigger Purge</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Instant wipe on print + 15-minute server TTL failsafe.</p>
              </HolographicCard>

              <HolographicCard
                intensity={16}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#121622]/70 backdrop-blur-md shadow-2xs"
              >
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold font-display">Zero Queue Lag</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Preset preferences prevent verbal misprints at counter.</p>
              </HolographicCard>
            </div>

            {/* Quick Navigation Anchor Guide */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Explore ZDrop:</span>
              <a href="#problem" className="hover:text-blue-600 dark:hover:text-cyan-400 underline underline-offset-4 decoration-blue-500/40 dark:decoration-cyan-500/40 transition">
                The Security Risk ↓
              </a>
              <a href="#features" className="hover:text-blue-600 dark:hover:text-cyan-400 underline underline-offset-4 decoration-blue-500/40 dark:decoration-cyan-500/40 transition">
                6 Core Features ↓
              </a>
              <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-cyan-400 underline underline-offset-4 decoration-blue-500/40 dark:decoration-cyan-500/40 transition">
                4-Step Process ↓
              </a>
            </div>
          </div>

          {/* Right Column: Live, Interactive Drop & Preferences Widget */}
          <div className="lg:col-span-5">
            <HolographicCard
              intensity={28}
              className="relative rounded-3xl border border-slate-200/90 dark:border-white/15 bg-white dark:bg-gradient-to-b dark:from-[#141926]/95 dark:to-[#0E121B]/95 p-5 sm:p-7 shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-colors"
            >
              {/* Card Header Strip */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-display">
                    Interactive Print Terminal
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/5">
                  Max 3 Files · 25MB
                </span>
              </div>

              {!user ? (
                /* Unauthenticated Google Sign-In Gate */
                <div className="py-6 px-2 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                      Sign in with Google to Drop Files
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xs mx-auto font-sans leading-relaxed">
                      Sign in securely to upload your documents, configure print settings, and get your 6-digit counter OTP.
                    </p>
                  </div>

                  <div className="pt-2">
                    <GoogleSignInButton label="Continue with Google" />
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-2 text-left">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 font-display">🔒 Zero WhatsApp</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Keep phone number private</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 font-display">⚡ 6-Digit Counter OTP</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Operator opens job in 2s</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Authenticated Upload Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* User Verified Chip */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-600 dark:bg-cyan-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {(user.name?.[0] || user.email[0]).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name || user.email}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                      Verified
                    </span>
                  </div>

                  {/* Destination Print Shop (Optional) */}
                  {shops.length > 0 && (
                    <div className="space-y-1.5">
                      <label htmlFor="shop-select" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                        <span>Destination Print Shop</span>
                      </label>
                      <select
                        id="shop-select"
                        value={selectedShopId}
                        onChange={(e) => setSelectedShopId(e.target.value)}
                        className="w-full h-10 px-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-sans outline-none focus:border-blue-500 dark:focus:border-cyan-400 cursor-pointer"
                      >
                        <option value="">Any ZDrop Kiosk Counter (Default)</option>
                        {shops.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.shopName} ({s.campusAddress})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Step 1: Drop Files */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                        Step 1: Select Files
                      </label>
                      <span className="text-[11px] text-blue-600 dark:text-cyan-400 font-mono">PDF, DOCX, JPG, PNG</span>
                    </div>
                    <DropZone files={files} onFilesChange={setFiles} disabled={isGenerating} />
                  </div>

                  {/* Step 2: Preferences (Appears when file is added) */}
                  {files.length > 0 && (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono block">
                        Step 2: Print Settings
                      </label>
                      <PrintPreferencesCard
                        preferences={preferences}
                        onChange={setPreferences}
                        disabled={isGenerating}
                      />
                    </div>
                  )}

                  {!validation.success && (
                    <p role="alert" className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 p-2.5 rounded-xl">
                      {validation.error.issues[0].message}
                    </p>
                  )}

                  {/* Submit Action */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!canSubmit || isGenerating}
                      className="w-full h-13 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 dark:from-cyan-500 dark:via-sky-500 dark:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] cursor-pointer shadow-md dark:shadow-[0_0_24px_rgba(6,182,212,0.35)] text-sm font-display"
                    >
                      <span>
                        {isGenerating
                          ? `Encrypting & Uploading… ${uploadProgress}%`
                          : "Generate 6-Digit Access Code"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1.5 font-sans">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline" />
                      <span>Dual-Purge: Permanently deleted upon print or after 15 mins</span>
                    </p>
                  </div>
                </form>
              )}
            </HolographicCard>
          </div>
        </div>
      </div>
    </section>
  );
}
