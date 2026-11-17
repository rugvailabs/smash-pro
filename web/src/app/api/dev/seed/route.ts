import { runSeed } from "@/server/seed";
import { handle, json } from "@/server/http";

/** Demo-environment reset: wipes and reseeds the sample dataset.
 *  Guarded by DEMO_MODE — never available otherwise. */
export async function POST() {
  return handle(async () => {
    if (process.env.DEMO_MODE !== "1") return json({ error: "Demo mode is disabled" }, 403);
    const out = await runSeed();
    return json({ ok: true, ...out });
  });
}
