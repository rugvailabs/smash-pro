import { getSession } from "@/server/auth";
import { handle, json } from "@/server/http";

/** Session → UI role mapping (visitor | pending | buyer | supplier | admin).
 *  Admin sessions resolve to the admin role so the chrome switches to the
 *  Operations Console (B5 / ADR-0007) — no buyer cart or catalogue nav. */
export async function GET() {
  return handle(async () => {
    const s = await getSession();
    if (!s) return json({ role: "visitor" });
    if (s.role === "admin") return json({ role: "admin", email: s.email, admin: true });
    const role = s.orgStatus === "active" ? s.role : "pending";
    return json({ role, email: s.email, orgName: s.orgName, orgKind: s.role });
  });
}
