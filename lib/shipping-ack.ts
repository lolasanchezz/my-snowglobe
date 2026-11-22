// Everyone lands on /info and has to tick through "what's a shipped
// project?" before /submit opens. Finishing it sets this cookie.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SHIPPING_ACK_COOKIE = "snowglobe_read_shipping";

export async function hasReadShipping(): Promise<boolean> {
	const store = await cookies();
	return store.get(SHIPPING_ACK_COOKIE)?.value === "1";
}

/** Bounce to /info until the explainer has been read. */
export async function requireReadShipping(): Promise<void> {
	if (!(await hasReadShipping())) redirect("/info");
}
