import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/* ============================================================
   Product photo upload storage (ADR-0013) — DigitalOcean Spaces,
   S3-compatible. Admin-gated upload only; never deletes, never lists.
   Scope: product photography only — every other upload surface in
   this app (registration docs, quotation attachments, delivery
   proofs) stays metadata-only per ADR-0005, unchanged.
   ============================================================ */

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`500:Missing environment variable ${name} — product photo upload is not configured`);
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
