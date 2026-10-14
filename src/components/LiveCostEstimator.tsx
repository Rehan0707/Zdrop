"use client";

import React, { useMemo } from "react";
import { FileMetadata, PrintPreferences, ShopPricing } from "@/lib/types";
import { calculatePrintCost } from "@/lib/pricing";
import { Receipt, Sparkles, Tag, ShieldCheck } from "lucide-react";

interface LiveCostEstimatorProps {
  files: FileMetadata[];
  preferences: PrintPreferences;
  shopPricing?: ShopPricing | null;
  shopName?: string;
}

export function LiveCostEstimator({
  files,
  preferences,
  shopPricing,
  shopName,
}: LiveCostEstimatorProps) {
  const estimate = useMemo(() => {
    return calculatePrintCost(files, preferences, shopPricing);
  }, [files, preferences, shopPricing]);

  const totalDetectedPages = useMemo(() => {
    return files.reduce(
      (acc, f) => acc + (f.pageCount && f.pageCount > 0 ? f.pageCount : 1),
      0
    );
  }, [files]);

  if (files.length === 0) return null;

  return (
    <div className="zd-cost-estimator-card">
      <div className="zd-cost-estimator-header">
        <div className="zd-cost-estimator-title flex items-center gap-2 flex-wrap">
          <Receipt size={16} />
          <span>Estimated Print Cost</span>
          <span className="zd-file-page-pill">
            {totalDetectedPages} {totalDetectedPages === 1 ? "page" : "pages"} detected
          </span>
        </div>
        {shopName ? (
          <span className="zd-cost-shop-pill">
            <Tag size={11} />
            {shopName} rates
          </span>
        ) : (
          <span className="zd-cost-shop-pill">
            <Tag size={11} />
            Campus default rates
          </span>
        )}
      </div>

      <div className="zd-cost-estimator-body">
        <div className="zd-cost-total-wrap">
          <span className="zd-cost-currency">{estimate.currencySymbol}</span>
          <span className="zd-cost-amount">{estimate.totalAmount.toFixed(2)}</span>
          <span className="zd-cost-label">Total Due at Counter</span>
        </div>

        <div className="zd-cost-formula-wrap">
          <p className="zd-cost-formula">{estimate.formula}</p>
          {estimate.discount > 0 && (
            <span className="zd-cost-discount-badge">
              <Sparkles size={12} />
              Saved {estimate.currencySymbol}
              {estimate.discount.toFixed(2)} with double-sided printing!
            </span>
          )}
        </div>
      </div>

      <div className="zd-cost-estimator-footer">
        <ShieldCheck size={13} />
        <span>Pre-calculated price locked into your 6-digit access code</span>
      </div>
    </div>
  );
}
