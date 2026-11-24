import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type ContainerProps<T extends ElementType> = {
  as?: T;
  maxW?: string;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

/* Gutter schedule measured directly off decathlon.in's own ".container" /
   ".fluid-container" / ".pdp-container" classes (same padding-inline
   schedule on all three — verified via their compiled CSS and confirmed
   live: header, hero banner and category grid all sit at the identical
   inset): 20px below 600px, 40px from 600px, 64px from 1200px — flat from
   there up, no further step at larger desktop widths. Every section —
   including hero/banner imagery — uses this one schedule; Decathlon never
   gives banners a different (e.g. half) inset than body content. */
const GUTTER = "px-5 min-[600px]:px-10 min-[1200px]:px-16";

/* Shared responsive page container — single source of truth for every
   page's horizontal margins; each call site keeps its own deliberate
   max-width via maxW. */
export function Container<T extends ElementType = "div">({
  as,
  maxW = "max-w-[1600px]",
  className = "",
  children,
  ...rest
}: ContainerProps<T>) {
  const Tag = (as || "div") as ElementType;
  return (
    <Tag className={`mx-auto w-full ${maxW} ${GUTTER} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
