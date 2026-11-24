import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/* ============================================================
   Upload storage (ADR-0013) — DigitalOcean Spaces, S3-compatible.
   Product photography is admin-gated; service-request media (ADR-0020,
   below) is intentionally public since a repair booking isn't signed
   in. Every OTHER upload surface in this app (registration docs,
   quotation attachments, delivery proofs) stays metadata-only per
   ADR-0005, unchanged.
   ============================================================ */

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`500:Missing environment variable ${name} — file upload storage is not configured`);
  return v;
}

function client(): S3Client {
  return new S3Client({
    endpoint: env("DO_SPACES_ENDPOINT"),
    region: env("DO_SPACES_REGION"),
    credentials: {
      accessKeyId: env("DO_SPACES_KEY"),
      secretAccessKey: env("DO_SPACES_SECRET"),
    },
    forcePathStyle: false,
  });
}

/** Public base URL for reading back an uploaded object — prefers the CDN
 *  endpoint when configured (faster for buyers/visitors), else the
 *  Space's own https endpoint. */
function publicBase(): string {
  const cdn = process.env.DO_SPACES_CDN_ENDPOINT;
  if (cdn) return cdn.replace(/\/$/, "");
  const bucket = env("DO_SPACES_BUCKET");
  const region = env("DO_SPACES_REGION");
  return `https://${bucket}.${region}.digitaloceanspaces.com`;
}

/** The set of hosts this app will accept as a trusted uploaded-image
 *  URL — used by assertImgPath so a client can never attach an
 *  arbitrary external image via this field. */
export function trustedImageHosts(): string[] {
  const hosts: string[] = [];
  try {
    hosts.push(new URL(publicBase()).host);
  } catch {
    /* storage not configured — no trusted upload host yet */
  }
  const cdn = process.env.DO_SPACES_CDN_ENDPOINT;
  if (cdn) {
    try { hosts.push(new URL(cdn).host); } catch { /* ignore malformed env value */ }
  }
  return hosts;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function sanitiseName(name: string): string {
  return name.replace(/[^a-z0-9._-]/gi, "-").slice(-80);
}

/** Uploads one product photo and returns its public URL. catSlug must
 *  already be a validated category (caller's responsibility — mirrors
 *  the same check listCatalogueImages does for the library picker). */
export async function uploadProductImage(input: {
  catSlug: string; filename: string; contentType: string; bytes: Buffer;
}): Promise<{ url: string }> {
  const ext = ALLOWED_TYPES[input.contentType];
  if (!ext) throw new Error("400:Only JPEG, PNG or WebP images are accepted");
  if (input.bytes.length === 0) throw new Error("400:The file is empty");
  if (input.bytes.length > MAX_BYTES) throw new Error("400:Image must be 5 MB or smaller");

  const key = `products/${input.catSlug}/${Date.now()}-${sanitiseName(input.filename)}`;
  await client().send(
    new PutObjectCommand({
      Bucket: env("DO_SPACES_BUCKET"),
      Key: key,
      Body: input.bytes,
      ContentType: input.contentType,
      ACL: "public-read",
    })
  );
  return { url: `${publicBase()}/${key}` };
}

/** Uploads one site-content image (hero slide / category banner — ADR-0021)
 *  — same bucket/limits as product photos, different key prefix. `folder`
 *  is admin-supplied free text (e.g. "hero", a category slug), sanitised,
 *  NOT validated against the categories table (unlike uploadProductImage)
 *  since hero images aren't scoped to one category. */
export async function uploadSiteImage(input: {
  folder: string; filename: string; contentType: string; bytes: Buffer;
}): Promise<{ url: string }> {
  const ext = ALLOWED_TYPES[input.contentType];
  if (!ext) throw new Error("400:Only JPEG, PNG or WebP images are accepted");
  if (input.bytes.length === 0) throw new Error("400:The file is empty");
  if (input.bytes.length > MAX_BYTES) throw new Error("400:Image must be 5 MB or smaller");

  const safeFolder = (input.folder || "general").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const key = `site/${safeFolder}/${Date.now()}-${sanitiseName(input.filename)}`;
  await client().send(
    new PutObjectCommand({
      Bucket: env("DO_SPACES_BUCKET"),
      Key: key,
      Body: input.bytes,
      ContentType: input.contentType,
      ACL: "public-read",
    })
  );
  return { url: `${publicBase()}/${key}` };
}

/* ============================================================
   Service request media (ADR-0020) — equipment Care/Repair bookings.
   Public upload (no admin gate): a visitor submitting a repair request
   isn't signed in. Separate key prefix/limits from product photography;
   same bucket/credentials.
   ============================================================ */

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_VOICE_BYTES = 15 * 1024 * 1024;
const SERVICE_PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const SERVICE_VOICE_TYPES: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

async function putServiceObject(folder: string, input: {
  filename: string; contentType: string; bytes: Buffer; allowed: Record<string, string>; maxBytes: number;
}): Promise<{ url: string }> {
  const ext = input.allowed[input.contentType];
  if (!ext) throw new Error("400:Unsupported file type");
  if (input.bytes.length === 0) throw new Error("400:The file is empty");
  if (input.bytes.length > input.maxBytes) throw new Error(`400:File must be ${Math.round(input.maxBytes / 1024 / 1024)} MB or smaller`);

  const key = `service-requests/${folder}/${Date.now()}-${sanitiseName(input.filename)}`;
  await client().send(
    new PutObjectCommand({
      Bucket: env("DO_SPACES_BUCKET"),
      Key: key,
      Body: input.bytes,
      ContentType: input.contentType,
      ACL: "public-read",
    })
  );
  return { url: `${publicBase()}/${key}` };
}

export function uploadServiceRequestPhoto(input: { filename: string; contentType: string; bytes: Buffer }) {
  return putServiceObject("photos", { ...input, allowed: SERVICE_PHOTO_TYPES, maxBytes: MAX_PHOTO_BYTES });
}

export function uploadServiceRequestVoiceNote(input: { filename: string; contentType: string; bytes: Buffer }) {
  return putServiceObject("voice", { ...input, allowed: SERVICE_VOICE_TYPES, maxBytes: MAX_VOICE_BYTES });
}
