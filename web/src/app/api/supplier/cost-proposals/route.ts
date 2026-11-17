import { submitCostProposal } from "@/server/supplier";
import { handle, json } from "@/server/http";

/** POST /api/supplier/cost-proposals — submit a cost-change proposal for the
 *  Smash Pro sourcing team to review. */
export async function POST(req: Request) {
  return handle(async () => {
    const body = (await req.json()) as { title?: string; detail?: string };
    if (!body.title?.trim()) return json({ error: "A title is required" }, 400);
    if (!body.detail?.trim()) return json({ error: "A description of the change is required" }, 400);
    const out = await submitCostProposal({ title: body.title, detail: body.detail });
    return json(out);
  });
}
