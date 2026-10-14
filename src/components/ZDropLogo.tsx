"use client";

import React from "react";
import Image from "next/image";

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
  const iconDimensions = {
    sm: { width: 26, height: 28, wrapper: "w-6.5 h-7" },
    md: { width: 34, height: 37, wrapper: "w-8.5 h-9" },
    lg: { width: 42, height: 46, wrapper: "w-10.5 h-11.5" },
    xl: { width: 50, height: 55, wrapper: "w-12.5 h-13.5" },
  }[size];

  const fullDimensions = {
    sm: { width: 95, height: 28, wrapper: "h-7 w-auto" },
    md: { width: 115, height: 34, wrapper: "h-8.5 w-auto" },
    lg: { width: 140, height: 42, wrapper: "h-10.5 w-auto" },
    xl: { width: 165, height: 50, wrapper: "h-12.5 w-auto" },
  }[size];

  const textStyles = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }[size];

  if (variant === "full") {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        {/* Light theme full logo */}
        <Image
          src="/zdrop-logo.png"
          alt="ZDrop"
          width={fullDimensions.width}
          height={fullDimensions.height}
          priority
          className={`dark:hidden ${fullDimensions.wrapper} object-contain`}
        />
        {/* Dark theme full logo */}
        <Image
          src="/zdrop-logo-dark.png"
          alt="ZDrop"
          width={fullDimensions.width}
          height={fullDimensions.height}
          priority
          className={`hidden dark:block ${fullDimensions.wrapper} object-contain`}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Cropped ZDrop Icon Mark with Dog-Ear Fold and Drop Arrow */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconDimensions.wrapper}`}>
        {/* Subtle Ambient Bloom */}
        <div className="absolute inset-0 rounded-lg bg-blue-500/20 dark:bg-blue-400/25 blur-md -z-10" />

        <Image
          src="/zdrop-icon-tight.png"
          alt="ZDrop Mark"
          width={iconDimensions.width}
          height={iconDimensions.height}
          priority
          className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(10,101,253,0.3)] dark:drop-shadow-[0_2px_12px_rgba(56,189,248,0.35)]"
        />
      </div>

      {showText && (
        <span className={`font-display font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center ${textStyles}`}>
          <span className="text-[#0a65fd]">Z</span>
          <span className="text-slate-900 dark:text-white">Drop</span>
        </span>
      )}
    </div>
  );
}
