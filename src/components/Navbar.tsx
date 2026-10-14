"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  Sparkles,
  Workflow,
  CircleHelp,
  Monitor,
  UploadCloud,
  Github,
  Store,
  LogIn,
  LogOut,
} from "lucide-react";
import { ZDropLogo } from "./ZDropLogo";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { ShopAuthModal } from "./ShopAuthModal";

interface NavbarProps {
  currentRole?: "student" | "kiosk";
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isExternal?: boolean;
  highlight?: boolean;
}

export function Navbar({ currentRole = "student" }: NavbarProps) {
  const { user, shop, logout, loginWithGoogle } = useAuth();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const sectionLinks: NavItemConfig[] = [
    {
      id: "problem",
      label: "The Risk",
      icon: ShieldAlert,
      href: "#problem",
    },
    {
      id: "features",
      label: "Features",
      icon: Sparkles,
      href: "#features",
    },
    {
      id: "how-it-works",
      label: "How It Works",
      icon: Workflow,
      href: "#how-it-works",
    },
    {
      id: "faq",
      label: "FAQs",
      icon: CircleHelp,
      href: "#faq",
    },
  ];

  const actionLinks: NavItemConfig[] = [
    {
      id: "kiosk",
      label: "Operator Kiosk",
      icon: Monitor,
      href: "/kiosk",
    },
    {
      id: "upload",
      label: "Drop & Print",
      icon: UploadCloud,
      href: "#upload",
      highlight: true,
    },
    {
      id: "github",
      label: "GitHub",
      icon: Github,
      href: "https://github.com/SohamB-ai/Zdrop",
      isExternal: true,
    },
  ];

  const kioskLinks: NavItemConfig[] = [
    {
      id: "back-to-upload",
      label: "Back to Upload",
      icon: UploadCloud,
      href: "/",
      highlight: true,
    },
  ];

  const renderNavButton = (item: NavItemConfig) => {
    const isHovered = hoveredKey === item.id;
    const Icon = item.icon;

    const baseClass = item.highlight
      ? `relative h-11 rounded-full px-3.5 flex items-center justify-center transition-all duration-200 select-none active:scale-95 cursor-pointer ${
          isHovered
            ? "bg-blue-500 dark:bg-cyan-400 text-white shadow-md dark:shadow-[0_0_20px_rgba(6,182,212,0.45)]"
            : "bg-blue-600 dark:bg-cyan-500 text-white shadow-sm dark:shadow-[0_0_14px_rgba(6,182,212,0.3)]"
        }`
      : `relative h-11 rounded-full px-3 flex items-center justify-center transition-all duration-200 select-none active:scale-95 cursor-pointer ${
          isHovered
            ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-cyan-300 shadow-xs"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        }`;

    const content = (
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 450, damping: 28 }}
        className="flex items-center"
      >
        <Icon className="w-5 h-5 shrink-0" />
        <AnimatePresence>
          {isHovered && (
            <motion.span
              layout
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              className="text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    );

    if (item.isExternal) {
      return (
        <motion.a
          key={item.id}
          layout
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setHoveredKey(item.id)}
          onMouseLeave={() => setHoveredKey(null)}
          onFocus={() => setHoveredKey(item.id)}
          onBlur={() => setHoveredKey(null)}
          aria-label={item.label}
          title={item.label}
          className={baseClass}
        >
          {content}
        </motion.a>
      );
    }

    if (item.href.startsWith("#")) {
      return (
        <motion.a
          key={item.id}
          layout
          href={item.href}
          onMouseEnter={() => setHoveredKey(item.id)}
          onMouseLeave={() => setHoveredKey(null)}
          onFocus={() => setHoveredKey(item.id)}
          onBlur={() => setHoveredKey(null)}
          aria-label={item.label}
          title={item.label}
          className={baseClass}
        >
          {content}
        </motion.a>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        onMouseEnter={() => setHoveredKey(item.id)}
        onMouseLeave={() => setHoveredKey(null)}
        onFocus={() => setHoveredKey(item.id)}
        onBlur={() => setHoveredKey(null)}
        aria-label={item.label}
        title={item.label}
        className={baseClass}
      >
        {content}
      </Link>
    );
  };

  return (
    <header className="fixed top-3.5 sm:top-5 inset-x-0 z-50 flex justify-center pointer-events-none px-3 sm:px-4">
      {/* Floating Pill Bubble Navbar Container */}
      <motion.nav
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        aria-label="Primary Navigation"
        className="pointer-events-auto relative flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 rounded-full border border-slate-200/90 dark:border-white/12 bg-white/85 dark:bg-[#0B0F19]/85 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.65),0_2px_14px_rgba(6,182,212,0.15)] transition-colors duration-200 max-w-[calc(100vw-1.5rem)] overflow-visible"
      >
        {/* Brand with Logo */}
        <Link
          href="/"
          className="flex items-center pl-1 sm:pl-2 pr-1 select-none group shrink-0"
          aria-label="ZDrop Home"
        >
          <ZDropLogo size="md" />
        </Link>

        {/* Section Navigation Icons (Desktop) */}
        {currentRole === "student" && (
          <>
            <div className="h-6 w-px bg-slate-200/90 dark:bg-white/10 mx-1 sm:mx-2 hidden md:block shrink-0" />
            <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
              {sectionLinks.map(renderNavButton)}
            </div>
          </>
        )}

        {/* Action Controls Divider */}
        <div className="h-6 w-px bg-slate-200/90 dark:bg-white/10 mx-1 sm:mx-2 shrink-0" />

        {/* Action Controls Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {currentRole === "student"
            ? actionLinks.map(renderNavButton)
            : kioskLinks.map(renderNavButton)}

          {/* Shop Owner Portal Button */}
          <motion.button
            type="button"
            layout
            onClick={() => setIsShopModalOpen(true)}
            onMouseEnter={() => setHoveredKey("shop")}
            onMouseLeave={() => setHoveredKey(null)}
            className={`relative h-11 rounded-full px-3 flex items-center justify-center transition-all duration-200 select-none active:scale-95 cursor-pointer ${
              hoveredKey === "shop"
                ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-cyan-300 shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            }`}
            aria-label="Print Shop Portal"
            title={shop ? `Shop: ${shop.shopName}` : "Print Shop Owner Portal"}
          >
            <motion.div layout className="flex items-center">
              <Store className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {hoveredKey === "shop" && (
                  <motion.span
                    layout
                    initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                    animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
                    exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                    className="text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden"
                  >
                    {shop ? shop.shopName : "Shop Portal"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.button>

          {/* Customer Auth Button / Avatar */}
          {user ? (
            <div className="relative">
              <motion.button
                type="button"
                layout
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                onMouseEnter={() => setHoveredKey("user")}
                onMouseLeave={() => setHoveredKey(null)}
                className="relative h-11 rounded-full px-2.5 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition cursor-pointer"
                aria-label="User Account"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-cyan-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(user.name?.[0] || user.email[0]).toUpperCase()}
                  </div>
                )}
                <AnimatePresence>
                  {hoveredKey === "user" && (
                    <motion.span
                      layout
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap overflow-hidden pr-1"
                    >
                      {user.name || user.email.split("@")[0]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-13 w-48 py-2 px-1 rounded-2xl bg-white dark:bg-[#141926] border border-slate-200 dark:border-white/15 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/10">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name || user.email}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full mt-1 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2 transition cursor-pointer font-semibold"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <motion.button
              type="button"
              layout
              onClick={() => loginWithGoogle()}
              onMouseEnter={() => setHoveredKey("login")}
              onMouseLeave={() => setHoveredKey(null)}
              className={`relative h-11 rounded-full px-3 flex items-center justify-center transition-all duration-200 select-none active:scale-95 cursor-pointer ${
                hoveredKey === "login"
                  ? "bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-cyan-300 shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
              aria-label="Sign in with Google"
            >
              <motion.div layout className="flex items-center">
                <LogIn className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {hoveredKey === "login" && (
                    <motion.span
                      layout
                      initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                      animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
                      exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                      className="text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden"
                    >
                      Sign In
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.button>
          )}

          {/* Theme Toggle (With Smooth Hover Extension) */}
          <ThemeToggle
            isHovered={hoveredKey === "theme"}
            onHoverStart={() => setHoveredKey("theme")}
            onHoverEnd={() => setHoveredKey(null)}
          />
        </div>
      </motion.nav>

      {/* Shop Owner Sign-in / Registration Modal */}
      <ShopAuthModal
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
      />
    </header>
  );
}
