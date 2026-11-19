/* ============================================================
   First-order benefits banner — full-width promo band below the
   nav, Court Ink colours (Ink/Ember replacing any competitor's
   palette). Per owner instruction: the QR graphic and the three
   codes are explicit PLACEHOLDERS — not a real QR (nothing to
   scan to), not live discount codes. Labelled as illustrative,
   consistent with every other sample/fixture callout in this
   project, so nobody mistakes it for a real, running promotion.
   ============================================================ */

const GRID = 17;
/** Deterministic (not Math.random) so server/client markup always match —
 *  still reads as an irregular QR-style pattern. */
function cellOn(i: number, j: number): boolean {
  return ((i * 31 + j * 17 + i * i * 3) % 7) < 3;
}
const FINDER_SIZE = 5;
function inFinder(i: number, j: number): boolean {
  const corners = [
    [0, 0],
    [0, GRID - FINDER_SIZE],
    [GRID - FINDER_SIZE, 0],
  ];
  return corners.some(([ci, cj]) => i >= ci && i < ci + FINDER_SIZE && j >= cj && j < cj + FINDER_SIZE);
}

function QrPlaceholder() {
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      if (inFinder(i, j)) continue;
      if (!cellOn(i, j)) continue;
      cells.push(<rect key={`${i}-${j}`} x={j} y={i} width={1} height={1} fill="var(--color-ink)" />);
    }
  }
  const finder = (x: number, y: number) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width={FINDER_SIZE} height={FINDER_SIZE} fill="var(--color-ink)" />
      <rect x={x + 1} y={y + 1} width={FINDER_SIZE - 2} height={FINDER_SIZE - 2} fill="white" />
      <rect x={x + 1.7} y={y + 1.7} width={FINDER_SIZE - 3.4} height={FINDER_SIZE - 3.4} fill="var(--color-ink)" />
    </g>
  );
  return (
    <svg viewBox={`0 0 ${GRID} ${GRID}`} className="h-[88px] w-[88px] shrink-0 md:h-[108px] md:w-[108px]" role="img" aria-label="Sample QR placeholder graphic">
      <rect x={0} y={0} width={GRID} height={GRID} fill="white" />
      {cells}
      {finder(0, 0)}
      {finder(GRID - FINDER_SIZE, 0)}
      {finder(0, GRID - FINDER_SIZE)}
    </svg>
  );
}

const SAMPLE_CODES = [
  { code: "SP100", off: "₹100", min: "₹1,499" },
  { code: "SP200", off: "₹200", min: "₹2,499" },
  { code: "SP300", off: "₹300", min: "₹3,499" },
];

export function FirstOrderBanner() {
  return (
    <section className="border-b border-n200 bg-paper">
      <div className="mx-auto max-w-[1280px] px-4 py-5 md:px-10">
        <div className="flex flex-wrap items-center gap-6 rounded-[2px] border border-n200 bg-chalk px-5 py-5 md:gap-8 md:px-7">
          <QrPlaceholder />
          <div className="min-w-[180px]">
            <div className="font-display text-[19px] font-bold leading-tight text-ink md:text-[22px]">
              Get your first-order benefits.
            </div>
            <p className="mt-1 text-[13px] text-n600">Sample codes shown — not a live offer.</p>
          </div>
          <div className="ml-auto flex flex-1 flex-wrap justify-end gap-3">
            {SAMPLE_CODES.map((c) => (
              <div key={c.code} className="flex min-w-[150px] flex-col items-center gap-1 rounded-[2px] bg-ink px-4 py-3 text-center">
                <span className="font-mono text-[10px] uppercase tracking-[.08em] text-white/60">Up to</span>
                <span className="stretch-xp font-display text-[22px] font-bold leading-none text-chalk">{c.off} OFF</span>
                <span className="text-[11px] text-white/70">On purchase above {c.min}</span>
                <span className="mt-1 rounded-[2px] bg-ember-deep px-2 py-1 font-mono text-[11px] font-bold tracking-wide text-white">
                  CODE: {c.code}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-n400">
          preview only · qr graphic and codes are placeholders, not a functioning promotion
        </p>
      </div>
    </section>
  );
}
