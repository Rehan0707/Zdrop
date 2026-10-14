"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

export interface HolographicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  glowClassName?: string;
  intensity?: number;
}

export const HolographicCard: React.FC<HolographicCardProps> = ({
  children,
  className,
  glowClassName,
  intensity = 10,
  onMouseMove,
  onMouseLeave,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const divisor = intensity > 0 ? intensity : 10;
    const rotateX = (y - centerY) / divisor;
    const rotateY = (centerX - x) / divisor;

    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
    card.style.setProperty("--bg-x", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--bg-y", `${(y / rect.height) * 100}%`);
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    card.style.setProperty("--x", `50%`);
    card.style.setProperty("--y", `50%`);
    card.style.setProperty("--bg-x", "50%");
    card.style.setProperty("--bg-y", "50%");

    onMouseLeave?.(e);
  };

  return (
    <div
      className={cn("component-card holographic-card", className)}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children ? (
        children
      ) : (
        <div className="holo-content text-center">
          <h3
            className="component-title"
            style={{
              fontWeight: 700,
              fontSize: "1.25rem",
              color: "#ffffff",
              letterSpacing: "-0.025em",
            }}
          >
            Holographic Card
          </h3>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
            Move your mouse over me!
          </p>
        </div>
      )}
      <div className={cn("holo-glow", glowClassName)}></div>
    </div>
  );
};

export default HolographicCard;
