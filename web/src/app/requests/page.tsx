import { RequireBuyer } from "@/components/require-buyer";
import { RequestsView } from "@/components/requests-view";
import { PageHead } from "@/components/buyer-ui";
import { getRequests } from "@/lib/buyer-api";

/* Product requests — list + new-request visual prototype (D12 pending). */

export default async function RequestsPage() {
  const requests = await getRequests();
  return (
    <RequireBuyer>
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-7 md:px-10">
        <PageHead
          title="Product requests"
          sub="Not in the catalogue? Request it — our team reviews every request for sourcing."
        />
        <RequestsView requests={requests} />
      </main>
    </RequireBuyer>
  );
}
