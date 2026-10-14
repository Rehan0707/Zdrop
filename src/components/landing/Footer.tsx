import Link from "next/link";
import { ZDropLogo } from "@/components/ZDropLogo";
export function Footer() {
  return (
    <footer className="zd-footer">
      <div className="zd-container">
        <div className="zd-footer-top">
          <div>
            <Link href="/" aria-label="ZDrop home">
              <ZDropLogo />
            </Link>
            <p>A simpler way from document to print.</p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/#upload">Upload documents</Link>
            <Link href="/kiosk">Shop counter</Link>
            <Link href="/#faq">Questions</Link>
            <a
              href="https://github.com/SohamB-ai/Zdrop"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub ↗
            </a>
          </nav>
        </div>
        <div className="zd-footer-bottom">
          <span>© {new Date().getFullYear()} ZDrop</span>
          <span>Drop it. Print it. Done.</span>
        </div>
      </div>
    </footer>
  );
}
