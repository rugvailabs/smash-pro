import { Container } from "@/components/container";

/* ============================================================
   Loading skeletons (library §14) — layout-true placeholders so
   routes never flash blank. Pure presentation; respects
   prefers-reduced-motion via the global animation kill-switch.
   ============================================================ */

export function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`bone ${className}`} />;
}

/** Catalogue / search: toolbar + product-card grid. */
export function GridSkeleton() {
  return (
    <main aria-busy="true" aria-label="Loading">
      <Container className="pb-16 pt-6">
        <Bone className="mb-5 h-8 w-44" />
        <div className="mb-5 flex gap-2.5"><Bone className="h-9 w-28" /><Bone className="h-9 w-28" /><Bone className="h-9 w-36" /></div>
        <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-[2px] border border-n200 bg-chalk">
              <Bone className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 p-4"><Bone className="h-3 w-16" /><Bone className="h-4 w-4/5" /><Bone className="h-4 w-2/5" /></div>
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}

/** Product detail: gallery + info columns. */
export function DetailSkeleton() {
  return (
    <Container as="main" className="pb-16 pt-6" aria-busy="true" aria-label="Loading">
      <Bone className="mb-5 h-4 w-64" />
      <div className="grid gap-9 lg:grid-cols-[6fr_5fr]">
        <Bone className="aspect-[4/3] w-full" />
        <div className="space-y-3">
          <Bone className="h-3 w-40" /><Bone className="h-8 w-4/5" /><Bone className="h-4 w-56" />
          <Bone className="h-24 w-full" /><Bone className="h-11 w-44" />
        </div>
      </div>
    </Container>
  );
}

/** Workspace detail pages: page head + content panels.
 *  Returns a div so callers can place it inside their own <main>. */
export function PanelSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Bone className="mb-2 h-4 w-56" />
      <Bone className="mb-5 h-8 w-72" />
      <div className="grid items-start gap-7 lg:grid-cols-[7fr_5fr]">
        <div className="space-y-3"><Bone className="h-40 w-full" /><Bone className="h-56 w-full" /></div>
        <div className="space-y-3"><Bone className="h-28 w-full" /><Bone className="h-20 w-full" /></div>
      </div>
    </div>
  );
}
