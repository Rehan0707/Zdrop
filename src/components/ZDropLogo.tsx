import { ArrowDown } from "lucide-react";
interface ZDropLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  variant?: "mark" | "full";
}
export function ZDropLogo({
  size = "md",
  showText = true,
  className = "",
  variant = "mark",
}: ZDropLogoProps) {
  return (
    <span className={`zd-logo zd-logo--${size} ${className}`}>
      <span className="zd-logo-mark" aria-hidden="true">
        <ArrowDown size={21} strokeWidth={2.4} />
      </span>
      {(showText || variant === "full") && (
        <span className="zd-logo-word">ZDrop.</span>
      )}
    </span>
  );
}
