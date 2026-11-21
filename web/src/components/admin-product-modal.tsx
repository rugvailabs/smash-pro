"use client";

import { useState } from "react";
import { ProductForm } from "@/components/admin-product-form";
import { btnEmber } from "@/components/admin-ui";
import { Modal } from "@/components/modal";

/* ============================================================
   "+ Add product" trigger (top of the Products page, via AdminHead's
   actions slot) + the form inside the shared centred Modal.
   ProductForm is unchanged and self-contained (its own Panel/PanelHead
   "Add product" title serves as the modal's heading too); closes
   itself automatically after a successful add.
   ============================================================ */

export function AddProductButton({ brands }: { brands: { id: number; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className={btnEmber}>
        + Add product
      </button>
      <Modal open={open} onClose={close} label="Add product">
        <ProductForm brands={brands} onSuccess={close} />
      </Modal>
    </>
  );
}
