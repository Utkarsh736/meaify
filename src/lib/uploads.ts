import { createHash, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface StoredUpload {
  /** Public path served by /api/uploads/[name]. */
  imageUrl: string;
  bytes: number;
  mimeType: string;
  sha256: string;
}

export function decodeImagePayload(imageBase64: string, mimeType: string): {
  buffer: Buffer;
  mimeType: string;
} {
  let raw = imageBase64.trim();
  let mime = mimeType;
  const dataUrl = raw.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (dataUrl) {
    mime = dataUrl[1];
    raw = dataUrl[2];
  }
  if (!ALLOWED.has(mime)) {
    throw new UploadError(`unsupported image type ${mime}`);
  }
  const buffer = Buffer.from(raw, "base64");
  if (!buffer.length) throw new UploadError("empty image");
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new UploadError(`image exceeds ${MAX_UPLOAD_BYTES} bytes`);
  }
  return { buffer, mimeType: mime };
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

function uploadsDir(): string {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "data", "uploads");
}

export async function storeUpload(imageBase64: string, mimeType: string): Promise<StoredUpload> {
  const decoded = decodeImagePayload(imageBase64, mimeType);
  const ext = decoded.mimeType === "image/png" ? "png" : decoded.mimeType === "image/webp" ? "webp" : "jpg";
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const dir = uploadsDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), decoded.buffer);
  return {
    imageUrl: `/api/uploads/${name}`,
    bytes: decoded.buffer.length,
    mimeType: decoded.mimeType,
    sha256: createHash("sha256").update(decoded.buffer).digest("hex"),
  };
}

export function resolveUploadPath(name: string): string | null {
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.includes("..")) return null;
  return path.join(uploadsDir(), name);
}
