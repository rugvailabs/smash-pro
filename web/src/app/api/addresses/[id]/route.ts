import { deleteAddress, setDefaultAddress, updateAddress } from "@/server/buyer";
import { handle, json } from "@/server/http";

/* PATCH /api/addresses/[id]  — {label, detail} to edit, or {setDefault:true}
   DELETE /api/addresses/[id] — remove (a promoted default is chosen if needed)
   Both are strictly org-scoped server-side (404 if not owned). */

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const n = Number(id);
    if (!Number.isInteger(n) || n < 1) return json({ error: "Invalid address id" }, 400);
    const body = (await req.json()) as { label?: string; detail?: string; setDefault?: boolean };
    if (body.setDefault === true) {
      await setDefaultAddress(n);
      return json({ ok: true });
    }
    await updateAddress(n, { label: body.label ?? "", detail: body.detail ?? "" });
    return json({ ok: true });
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const n = Number(id);
    if (!Number.isInteger(n) || n < 1) return json({ error: "Invalid address id" }, 400);
    await deleteAddress(n);
    return json({ ok: true });
  });
}
