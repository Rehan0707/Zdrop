import { z } from "zod";

export const AllowedMimeTypesEnum = z.enum([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

export type AllowedMimeType = z.infer<typeof AllowedMimeTypesEnum>;

export const PrintPreferencesSchema = z.object({
  copies: z.number().int().min(1).max(99).default(1),
  colorMode: z.enum(["AUTO", "BW", "COLOR"]).default("AUTO"),
  sides: z.enum(["SINGLE", "DOUBLE"]).default("DOUBLE"),
  pageRange: z.string().max(50).refine(v => v === "ALL" || (/^\s*\d+(?:\s*-\s*\d+)?(?:\s*,\s*\d+(?:\s*-\s*\d+)?)*\s*$/.test(v) && v.split(",").every(part => { const [a, b] = part.trim().split(/\s*-\s*/).map(Number); return a > 0 && (b === undefined || b >= a); })), "Enter valid pages, such as 1-5, 8.").default("ALL"),
  customerNotes: z.string().max(120).optional(),
});

export type PrintPreferences = z.infer<typeof PrintPreferencesSchema>;

export const FileMetadataSchema = z.object({
  fileId: z.string(),
  name: z.string().min(1).max(120),
  size: z.number().int().max(25 * 1024 * 1024), // 25 MB max
  type: z.string(),
  pageCount: z.number().int().optional(),
  /** 1-based page numbers identified as color by on-device page analysis. */
  colorPages: z.array(z.number().int().positive().max(2000)).max(2000).optional(),
  previewUrl: z.string().optional(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema> & { file?: File };

export type SessionStatus =
  | "PENDING_UPLOAD"
  | "ACTIVE"
  | "ACCESSED"
  | "PRINTED"
  | "DELETED"
  | "EXPIRED";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: "user" | "shop_owner";
  shopId?: string;
  createdAt?: number;
}

export interface ShopPricing {
  bwRate: number;              // Rate per page for B&W (e.g. 2 for ₹2)
  colorRate: number;           // Rate per page for Color (e.g. 10 for ₹10)
  duplexDiscount: number;      // Discount per sheet if printed double-sided (default 0)
  currencySymbol: string;      // e.g. "₹", "$", "€", "£"
  upiId?: string;              // Shop UPI VPA for digital payments (e.g. "printshop@upi")
}

export const ShopPricingSchema = z.object({
  bwRate: z.number().finite().min(0.1).max(1000),
  colorRate: z.number().finite().min(0.1).max(1000),
  duplexDiscount: z.number().finite().min(0).max(100),
  currencySymbol: z.string().trim().min(1).max(4),
  upiId: z.string().trim().max(100).refine(value => !value || /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(value), 'Enter a valid UPI address.').optional(),
}).strict();

export interface CostEstimate {
  totalPages: number;
  copies: number;
  colorPages: number;
  bwPages: number;
  ratePerPage: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  currencySymbol: string;
  formula: string;
}

export interface ShopProfile {
  id: string;
  ownerId: string;
  ownerEmail: string;
  shopName: string;
  ownerName: string;
  phone: string;
  campusAddress: string; // Legacy API key for the shop address or service area.
  shopCode: string;
  createdAt: number;
  isActive: boolean;
  pricing?: ShopPricing;
}

export type PublicShop = Pick<ShopProfile, "id" | "shopName" | "campusAddress" | "shopCode" | "pricing">;

export type PaymentStatus = "UNPAID" | "PENDING_CONFIRMATION" | "PAID_ONLINE" | "PAID_COUNTER";
export type PaymentMethod = "UPI" | "CASH" | "COUNTER";

export interface SessionData {
  id: string;
  accessCode: string;
  status: SessionStatus;
  createdAt: number;
  expiresAt: number;
  accessedAt?: number;
  /** A browser print attempt was started; this does not verify physical printing. */
  printStartedAt?: number;
  printClosedAt?: number;
  printMode?: "browser" | "managed";
  /** Station submission is not proof of physical printing. */
  printSubmission?: "SPOOLED" | "CANCELLED" | "FAILED";
  deletedAt?: number;
  deletionSource?: "OPERATOR_PRINT" | "STUDENT_REVOKE" | "TTL_PURGE";
  preferences: PrintPreferences;
  files: FileMetadata[];
  totalSizeBytes: number;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  shopId?: string;
  shopName?: string;
  /** Rates and payment destination captured by the server when the job is created. */
  shopPricing?: ShopPricing;
  operatorId?: string;
  costEstimate?: CostEstimate;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentTimestamp?: number;
}
