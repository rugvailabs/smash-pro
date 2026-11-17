import { exportCsv } from "@/server/admin";
import { AuthError } from "@/server/auth";

/* CSV export — admin-gated (requireAdmin inside exportCsv throws AuthError →
   401/403). Returns text/csv as a download attachment. No external deps. */

export async function GET(_req: Request, ctx: { params: Promise<{ kind: string }> }) {
  const { kind } = await ctx.params;
  try {
    const { filename, csv } = await exportCsv(kind);
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return new Response(e.message, { status: e.status });
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "404") return new Response("Unknown export", { status: 404 });
    console.error("[export]", e);
    return new Response("Export failed", { status: 500 });
  }
}
