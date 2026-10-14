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
  colorMode: z.enum(["BW", "COLOR"]).default("BW"),
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

export interface ShopProfile {
  id: string;
  ownerId: string;
  ownerEmail: string;
  shopName: string;
  ownerName: string;
  phone: string;
  campusAddress: string;
  shopCode: string;
  createdAt: number;
  isActive: boolean;
}

export interface SessionData {
  id: string;
  accessCode: string;
  status: SessionStatus;
  createdAt: number;
  expiresAt: number;
  accessedAt?: number;
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
  operatorId?: string;
}
