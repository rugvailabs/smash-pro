import "server-only";
import { NextResponse } from "next/server";
import { AuthError } from "@/server/auth";

/* Thin route-handler wrapper: JSON in/out, uniform error mapping.
   Error("401"/"403"/"404"/"409"/"email-taken"/"cart-empty") and AuthError
   become proper statuses — cross-role calls surface as 401/403 (PLT-001). */

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return json({ error: e.message }, e.status);
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "401") return json({ error: "Not signed in" }, 401);
    if (msg === "403") return json({ error: "Not permitted" }, 403);
    if (msg === "404") return json({ error: "Not found" }, 404);
    if (msg === "409") return json({ error: "Conflict" }, 409);
    if (msg === "email-taken") return json({ error: "An account with this email already exists" }, 409);
    if (msg === "cart-empty") return json({ error: "Your order is empty" }, 400);
    if (msg.startsWith("400:")) return json({ error: msg.slice(4) }, 400);
    console.error("[api]", e);
    return json({ error: "Something went wrong" }, 500);
  }
}
