import { mkdir, writeFile } from "fs/promises";
import path from "path";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export async function saveUpload(file: File, prefix: string) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${prefix}-${Date.now()}.${ext}`;
  await writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function saveMediaUpload(
  file: File,
  prefix: string
): Promise<{ url: string; type: "image" | "video" }> {
  const mime = file.type || "";
  const isImage = IMAGE_TYPES.has(mime);
  const isVideo = VIDEO_TYPES.has(mime);

  if (!isImage && !isVideo) {
    throw new Error("Only image (JPG, PNG, WebP, GIF) or video (MP4, WebM, MOV) files are allowed");
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 10 MB or smaller");
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new Error("Video must be 50 MB or smaller");
  }

  const url = await saveUpload(file, prefix);
  return { url, type: isImage ? "image" : "video" };
}
