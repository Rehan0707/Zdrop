"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LogOut, Printer, Store, UserRound } from "lucide-react";
import { ZDropLogo } from "./ZDropLogo";
import { ThemeToggle } from "./ThemeToggle";
import { ShopAuthModal } from "./ShopAuthModal";
import { useAuth } from "@/lib/auth-context";
interface NavbarProps {
  currentRole?: "student" | "kiosk";
  showSections?: boolean;
}
export function Navbar({
  currentRole = "student",
  showSections = true,
}: NavbarProps) {
  const { user, shop, logout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [error, setError] = useState("");
  const account = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!accountOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!account.current?.contains(event.target as Node))
        setAccountOpen(false);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        account.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", keyboard);
    };
  }, [accountOpen]);
  return (
    <header className="zd-header">
      <a className="zd-skip" href="#main-content">
        Skip to content
      </a>
      <nav className="zd-container zd-nav" aria-label="Primary navigation">
        <Link href="/" className="zd-brand" aria-label="ZDrop home">
          <ZDropLogo />
        </Link>
        {currentRole === "student" && showSections && (
          <div className="zd-nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#faq">Good to know</a>
          </div>
        )}
        <div className="zd-nav-actions">
          <div className="zd-nav-roles" aria-label="Choose your workspace">
            <Link
              href="/"
              aria-current={currentRole === "student" ? "page" : undefined}
            >
              Send files <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/kiosk"
              aria-current={currentRole === "kiosk" ? "page" : undefined}
            >
              <Printer size={15} />
              Print shop
            </Link>
          </div>
          <ThemeToggle />
          <div className="zd-account" ref={account}>
            <button
              type="button"
              className="zd-icon-button"
              aria-label={user ? "Your account" : "Account and shop access"}
              aria-expanded={accountOpen}
              aria-controls="account-options"
              onClick={() => setAccountOpen(!accountOpen)}
            >
              <UserRound size={18} />
            </button>
            {accountOpen && (
              <div id="account-options" className="zd-account-menu">
                {user ? (
                  <>
                    <strong>{user.name || user.email}</strong>
                    <small>{user.email}</small>
                    {shop && <small>{shop.shopName}</small>}
                  </>
                ) : (
                  <p>Sign in from your print job to upload files.</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShopOpen(true);
                    setAccountOpen(false);
                  }}
                >
                  <Store size={16} />
                  {shop ? "Shop account" : "Shop sign in / register"}
                </button>
                {user && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await logout();
                        setAccountOpen(false);
                      } catch {
                        setError("Could not sign out. Please try again.");
                      }
                    }}
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                )}
                {error && <p role="alert">{error}</p>}
              </div>
            )}
          </div>
        </div>
      </nav>
      <ShopAuthModal isOpen={shopOpen} onClose={() => setShopOpen(false)} />
    </header>
  );
}
