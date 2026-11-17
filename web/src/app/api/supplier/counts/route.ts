import { workspaceCountsForSession } from "@/server/supplier";
import { handle, json } from "@/server/http";

/** Workspace nav badge counts — session-scoped; null for non-suppliers. */
export async function GET() {
  return handle(async () => json(await workspaceCountsForSession()));
}
