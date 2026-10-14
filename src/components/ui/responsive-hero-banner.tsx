"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Play, Menu, X, Printer } from "lucide-react";
import { useLenis } from "lenis/react";
import { ZDropLogo } from "@/components/ZDropLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoleToggleSwitch } from "@/components/RoleToggleSwitch";
import { useAuth } from "@/lib/auth-context";
import { ShopAuthModal } from "@/components/ShopAuthModal";

interface NavLink {
  label: string;
  href: string;
  isActive?: boolean;
}

interface Partner {
  logoUrl: string;
  href: string;
  name?: string;
}

interface ResponsiveHeroBannerProps {
  logoUrl?: string;
  backgroundImageUrl?: string;
  customBackground?: React.ReactNode;
  navLinks?: NavLink[];
  ctaButtonText?: string;
  ctaButtonHref?: string;
  badgeText?: string;
  badgeLabel?: string;
  title?: string;
  titleLine2?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  partnersTitle?: string;
  partners?: Partner[];
  children?: React.ReactNode;
}

const ResponsiveHeroBanner: React.FC<ResponsiveHeroBannerProps> = ({
  logoUrl,
  backgroundImageUrl,
  customBackground,
  navLinks = [
    { label: "Home", href: "#" },
    { label: "Why ZDrop", href: "#why-zdrop" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
    { label: "Drop Files", href: "#upload" },
  ],
  ctaButtonText = "Print Shop",
  ctaButtonHref = "/kiosk",
  badgeLabel = "Zero-Trace",
  badgeText = "Instant Campus Document Printing",
  title = "Drop it. Print it. Done.",
  titleLine2 = "Zero WhatsApp. Zero USBs.",
  description = "Print campus documents in 10 seconds flat. Drop files on your phone, select print options in two taps, and hand a 6-digit PIN across the counter. No WhatsApp downloads, no flash drives, zero file leaks.",
  primaryButtonText = "Drop Files Below",
  primaryButtonHref = "#upload",
  secondaryButtonText = "Print Shop",
  secondaryButtonHref = "/kiosk",
  partnersTitle = "Trusted across university xerox counters and campus copy centers",
  partners = [
    {
      name: "Library Copy Center",
      logoUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=200&auto=format&fit=crop",
      href: "#",
    },
    {
      name: "Campus Print Hub",
      logoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=200&auto=format&fit=crop",
      href: "#",
    },
    {
      name: "Student Union Xerox",
      logoUrl: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=200&auto=format&fit=crop",
      href: "#",
    },
    {
      name: "Engineering Lab Printers",
      logoUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=200&auto=format&fit=crop",
      href: "#",
    },
    {
      name: "Autonomous Xerox Hub",
      logoUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=200&auto=format&fit=crop",
      href: "#",
    },
  ],
  children,
}) => {
  const { user, logout, loginWithGoogle } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [shopModalTab, setShopModalTab] = useState<"login" | "register">("login");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#");
  const lenis = useLenis();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scrollspy to automatically reflect current section in navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      if (window.scrollY < 200) {
        setActiveHref("#");
        return;
      }
      const sections = ["upload", "why-zdrop", "how-it-works", "faq"];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveHref(`#${id}`);
            return;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#") && href !== "") return;
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveHref(href);

    if (href === "#" || href === "#top" || href === "") {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      window.history.pushState(null, "", window.location.pathname);
      return;
    }

    const targetEl = document.querySelector(href);
    if (targetEl) {
      if (lenis) {
        lenis.scrollTo(targetEl as HTMLElement, { offset: -80, duration: 1.2 });
      } else {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
      window.history.pushState(null, "", href);
    }
  };

  return (
    <>
      {/* Fixed Sticky Header Navbar */}
      <header className="fixed top-0 inset-x-0 z-[100] bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/10 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <a
              href="#"
              onClick={(e) => handleNavClick(e, "#")}
              className="inline-flex items-center gap-2 select-none"
              aria-label="Back to top"
            >
              {logoUrl ? (
                <span
                  className="inline-flex items-center justify-center bg-center w-[100px] h-[40px] bg-cover rounded"
                  style={{ backgroundImage: `url(${logoUrl})` }}
                />
              ) : (
                <ZDropLogo size="md" showText={true} />
              )}
            </a>

            <div className="hidden md:flex items-center gap-2">
              <nav className="flex items-center gap-1 rounded-full bg-zinc-100/80 dark:bg-white/5 px-2 py-1 ring-1 ring-zinc-200/80 dark:ring-white/10 backdrop-blur">
                {navLinks.map((link, index) => {
                  const isCurrent = activeHref === link.href || (link.href === "#" && activeHref === "#");
                  return (
                    <a
                      key={index}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className={`px-3 py-1.5 text-xs font-semibold font-sans transition-all duration-200 rounded-full cursor-pointer ${
                        isCurrent
                          ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 shadow-[0_0_12px_rgba(34,197,94,0.2)]"
                          : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/10"
                      }`}
                    >
                      {link.label}
                    </a>
                  );
                })}
                <RoleToggleSwitch activeRole="upload" size="sm" className="ml-1" />
              </nav>

              {/* User Profile / Google Sign-In */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="inline-flex items-center gap-2 py-1 px-2.5 rounded-full bg-zinc-100 dark:bg-white/10 ring-1 ring-zinc-200 dark:ring-white/15 text-xs font-semibold text-zinc-800 dark:text-zinc-100 cursor-pointer"
                  >
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center text-[10px] font-bold font-mono">
                        {(user.name?.[0] || user.email[0]).toUpperCase()}
                      </span>
                    )}
                    <span>{user.name?.split(" ")[0] || "Account"}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-2 z-50 text-left">
                      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{user.name || "User"}</p>
                        <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {user.role === "shop_owner" ? "🏪 Shop Owner" : "👤 Google User"}
                        </span>
                      </div>
                      <div className="py-1">
                        {user.role === "shop_owner" ? (
                          <Link
                            href="/kiosk"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Open Print Kiosk</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              setShopModalTab("register");
                              setShopModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-left cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Register Print Shop</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-left cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.43 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12c0 2.02.45 3.84 1.24 5.42l4.04-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.57 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Sign In</span>
                </button>
              )}

              {/* Theme Toggle Button */}
              <ThemeToggle />
            </div>

            <div className="flex md:hidden items-center gap-2">
              {user ? (
                <button
                  type="button"
                  onClick={async () => await logout()}
                  className="text-xs text-rose-500 font-semibold"
                >
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="text-xs font-semibold px-2 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-full"
                >
                  Sign In
                </button>
              )}
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-white/10 ring-1 ring-zinc-200 dark:ring-white/15 backdrop-blur text-zinc-700 dark:text-white/90 cursor-pointer"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Mobile drawer dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-2 mb-4 p-4 rounded-2xl bg-white/95 dark:bg-[#121214]/95 border border-zinc-200 dark:border-white/10 backdrop-blur-2xl shadow-2xl space-y-2 animate-fade-slide-in-1">
              {navLinks.map((link, idx) => {
                const isCurrent = activeHref === link.href;
                return (
                  <a
                    key={idx}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                      isCurrent
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-semibold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
              <div className="pt-2 pb-1">
                <RoleToggleSwitch activeRole="upload" className="w-full justify-center" />
              </div>
              <Link
                href={ctaButtonHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 text-sm font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/10 rounded-xl"
              >
                <span className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-500" />
                  <span>{ctaButtonText}</span>
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="w-full min-h-screen overflow-hidden relative bg-transparent">
        {/* Background layer */}
        {customBackground ? (
          customBackground
        ) : backgroundImageUrl ? (
          <>
            <img
              src={backgroundImageUrl}
              alt=""
              className="w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0 opacity-10 dark:opacity-25 filter contrast-125 brightness-90 pointer-events-none"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5 dark:ring-black/30 bg-gradient-to-b from-zinc-50/80 via-zinc-50/90 to-zinc-50 dark:from-[#09090b]/80 dark:via-[#09090b]/90 dark:to-[#09090b]" />
          </>
        ) : null}

        {/* Main hero fold */}
        <div className="z-10 relative pt-16 sm:pt-20">
        <div className="sm:pt-20 md:pt-24 lg:pt-28 max-w-7xl mx-auto pt-16 px-4 sm:px-6 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill Badge */}
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-emerald-50 dark:bg-white/10 px-3 py-1.5 ring-1 ring-emerald-500/20 dark:ring-white/15 backdrop-blur animate-fade-slide-in-1">
              <span className="inline-flex items-center text-xs font-bold text-zinc-950 bg-emerald-400 rounded-full py-0.5 px-2.5 font-sans">
                {badgeLabel}
              </span>
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200 font-sans">
                {badgeText}
              </span>
            </div>

            {/* Display Headline */}
            <h1 className="text-3xl min-[360px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08] text-zinc-900 dark:text-white font-extrabold tracking-tight sm:tracking-tighter font-heading animate-fade-slide-in-2">
              {title}
              <br className="hidden sm:block" />
              <span className="text-emerald-600 dark:text-emerald-400 italic block sm:inline mt-1 sm:mt-0 font-garamond font-bold tracking-normal">
                {" "}{titleLine2}
              </span>
            </h1>

            {/* Description Copy */}
            <p className="text-sm min-[360px]:text-base sm:text-lg animate-fade-slide-in-3 text-zinc-600 dark:text-zinc-300 max-w-2xl mt-5 sm:mt-6 mx-auto font-sans leading-relaxed">
              {description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:gap-4 mt-7 sm:mt-8 gap-3 items-stretch sm:items-center justify-center w-full max-w-md sm:max-w-none mx-auto animate-fade-slide-in-4">
              <a
                href={primaryButtonHref}
                onClick={(e) => handleNavClick(e, primaryButtonHref)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold text-zinc-950 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 rounded-full py-3.5 px-6 font-heading transition-all active:scale-95 shadow-[0_0_24px_rgba(34,197,94,0.35)] cursor-pointer touch-manipulation min-h-[48px]"
              >
                <span>{primaryButtonText}</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href={secondaryButtonHref}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-zinc-100 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/15 px-6 py-3.5 text-sm font-semibold text-zinc-900 dark:text-white font-heading transition-all active:scale-95 shadow-xs dark:shadow-none touch-manipulation min-h-[48px]"
              >
                <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{secondaryButtonText}</span>
              </Link>
            </div>
          </div>

          {/* Optional Children Slot (e.g. Interactive Print Terminal) */}
          {children && (
            <div className="mt-8 sm:mt-12 max-w-3xl mx-auto animate-fade-slide-in-4" id="upload">
              {/* Send files vs Print shop Toggle Switch right above Terminal */}
              <div className="flex justify-center mb-6">
                <RoleToggleSwitch activeRole="upload" />
              </div>
              {children}
            </div>
          )}

          {/* Partners / Campus Trust Agencies */}
          <div className="mx-auto mt-20 max-w-5xl">
            <p className="animate-fade-slide-in-1 text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center font-mono">
              {partnersTitle}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 animate-fade-slide-in-2 text-zinc-500 dark:text-zinc-400 mt-6 items-center justify-items-center gap-4">
              {partners.map((partner, index) => (
                <a
                  key={index}
                  href={partner.href}
                  title={partner.name || "Campus Print Partner"}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-full border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 hover:border-emerald-500/30 text-xs text-zinc-700 dark:text-zinc-300 font-sans transition-all shadow-2xs dark:shadow-none"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="truncate max-w-[120px]">{partner.name || `Partner ${index + 1}`}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

      <ShopAuthModal
        isOpen={shopModalOpen}
        onClose={() => setShopModalOpen(false)}
        defaultTab={shopModalTab}
      />
    </>
  );
};

export default ResponsiveHeroBanner;
