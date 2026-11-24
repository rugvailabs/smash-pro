/** Equipment Care/Repair service catalogue (ADR-0020). Pure data — no
 *  pricing, since quotation happens after admin inspects the submitted
 *  photos/description; nothing here implies a price. */

export type ServiceSport = "cricket" | "badminton";
export type ServiceKind = "care" | "repair";

export const SERVICE_SPORTS: { slug: ServiceSport; label: string }[] = [
  { slug: "cricket", label: "Cricket" },
  { slug: "badminton", label: "Badminton" },
];

export interface ServiceItem {
  slug: string;
  label: string;
}

export const SERVICE_CATALOG: Record<ServiceSport, Record<ServiceKind, ServiceItem[]>> = {
  cricket: {
    care: [
      { slug: "bat-knocking", label: "Bat Knocking" },
      { slug: "bat-oiling", label: "Bat Oiling" },
      { slug: "toe-guard", label: "Toe Guard" },
      { slug: "scuff-sheet", label: "Scuff Sheet" },
      { slug: "edge-taping", label: "Edge Taping" },
    ],
    repair: [
      { slug: "bat-crack-repair", label: "Bat Crack Repair" },
      { slug: "handle-repair", label: "Handle Repair" },
      { slug: "toe-repair", label: "Toe Repair" },
      { slug: "gloves-repair", label: "Cricket Gloves Repair" },
      { slug: "other-damage", label: "Other Damage" },
    ],
  },
  badminton: {
    care: [
      { slug: "restringing", label: "Restringing" },
      { slug: "grip-replacement", label: "Grip Replacement" },
      { slug: "grommet-check", label: "Grommet Check & Cleaning" },
    ],
    repair: [
      { slug: "frame-crack-repair", label: "Frame Crack Repair" },
      { slug: "shaft-repair", label: "Shaft Repair" },
      { slug: "joint-repair", label: "T-Joint / Head Joint Repair" },
      { slug: "other-damage", label: "Other Damage" },
    ],
  },
};

export function serviceLabel(sport: ServiceSport, kind: ServiceKind, slug: string): string {
  return SERVICE_CATALOG[sport]?.[kind]?.find((s) => s.slug === slug)?.label ?? slug;
}
