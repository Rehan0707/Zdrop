import React from "react";

interface ZDropLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  variant?: "mark" | "full";
  asSticker?: boolean;
}

const SIZES = {
  sm: { width: 28, height: 31, fontSize: "20px" },
  md: { width: 34, height: 38, fontSize: "24px" },
  lg: { width: 44, height: 49, fontSize: "30px" },
  xl: { width: 62, height: 69, fontSize: "38px" },
};

export function ZDropStickerMark({
  width = 34,
  height = 38,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <span
      className={`zd-logo-sticker-wrap ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width,
        height,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 197 218"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="zd-logo-sticker-svg"
        style={{
          overflow: "visible",
          transition: "transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <defs>
          {/* Tactile Vinyl Sticker Shadow */}
          <filter id="zd-sticker-glow" x="-30%" y="-25%" width="160%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.18" />
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.12" />
          </filter>

          {/* Vinyl Gloss Highlight */}
          <linearGradient id="zd-sticker-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Brand Green Gradient */}
          <linearGradient id="zd-brand-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#05c862" />
            <stop offset="100%" stopColor="#00ba57" />
          </linearGradient>
        </defs>

        <g filter="url(#zd-sticker-glow)">
          {/* 1. Die-Cut White Vinyl Sticker Border Backing */}
          <path
            d="M 147,14 L 149,14 L 182,48 L 183,50 L 181,52 L 150,52 L 146,48 L 145,45 L 145,16 L 147,14 Z"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M 36,16 L 132,16 L 132,58 L 133,59 L 144,59 L 147,61 L 168,61 L 150,79 L 126,99 L 102,117 L 74,136 L 75,138 L 153,138 L 155,142 L 155,159 L 154,160 L 155,167 L 156,168 L 173,168 L 174,172 L 144,203 L 142,204 L 138,201 L 113,174 L 22,174 L 15,169 L 14,166 L 14,147 L 17,139 L 21,134 L 70,90 L 73,86 L 106,55 L 103,53 L 29,53 L 27,52 L 23,48 L 23,25 L 27,20 L 36,16 Z"
            fill="#ffffff"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 2. Top-Right Folded Corner (Dog-Ear Flap) */}
          <path
            d="M 147,14 L 149,14 L 182,48 L 183,50 L 181,52 L 150,52 L 146,48 L 145,45 L 145,16 L 147,14 Z"
            fill="url(#zd-brand-green)"
            stroke="#00ba57"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* 3. Main 'Z' Body With Counter Arrow */}
          <path
            d="M 36,16 L 132,16 L 132,58 L 133,59 L 144,59 L 147,61 L 168,61 L 150,79 L 126,99 L 102,117 L 74,136 L 75,138 L 153,138 L 155,142 L 155,159 L 154,160 L 155,167 L 156,168 L 173,168 L 174,172 L 144,203 L 142,204 L 138,201 L 113,174 L 22,174 L 15,169 L 14,166 L 14,147 L 17,139 L 21,134 L 70,90 L 73,86 L 106,55 L 103,53 L 29,53 L 27,52 L 23,48 L 23,25 L 27,20 L 36,16 Z"
            fill="url(#zd-brand-green)"
            stroke="#00ba57"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* 4. Glossy Vinyl Sticker Sheen Highlight */}
          <path
            d="M 36,16 L 132,16 L 132,58 L 133,59 L 144,59 L 147,61 L 168,61 L 150,79 L 126,99 L 102,117 L 74,136 L 75,138 L 153,138 L 155,142 L 155,159 L 154,160 L 155,167 L 156,168 L 173,168 L 174,172 L 144,203 L 142,204 L 138,201 L 113,174 L 22,174 L 15,169 L 14,166 L 14,147 L 17,139 L 21,134 L 70,90 L 73,86 L 106,55 L 103,53 L 29,53 L 27,52 L 23,48 L 23,25 L 27,20 L 36,16 Z"
            fill="url(#zd-sticker-sheen)"
            pointerEvents="none"
          />
        </g>
      </svg>
    </span>
  );
}

export function ZDropLogo({
  size = "md",
  showText = true,
  className = "",
  variant = "mark",
}: ZDropLogoProps) {
  const currentSize = SIZES[size] || SIZES.md;

  return (
    <span className={`zd-logo zd-logo--${size} ${className}`}>
      <ZDropStickerMark width={currentSize.width} height={currentSize.height} />
      {(showText || variant === "full") && (
        <span className="zd-logo-word">
          ZDrop<span className="zd-logo-dot" style={{ color: "#00ba57" }}>.</span>
        </span>
      )}
    </span>
  );
}
