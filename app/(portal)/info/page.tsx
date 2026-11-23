import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { hasReadShipping } from "@/lib/shipping-ack";
import ScrollGate from "./scroll-gate";
import ShippingExplainer from "./shipping-explainer";

export const metadata: Metadata = { title: "info - the snowglobe" };

// Everyone lands here. Until they've ticked every "ok!" box, the explainer
// gates the submit page; after that it's just a reference.
export default async function InfoPage() {
	if ((await getSession())?.guest) redirect("/vote");
	if (!(await hasReadShipping())) {
		return (
			<ScrollGate>
				<ShippingExplainer checkable />
			</ScrollGate>
		);
	}
	return <ShippingExplainer />;
}
