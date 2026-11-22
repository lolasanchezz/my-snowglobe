"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookieOptions } from "@/lib/session";
import { SHIPPING_ACK_COOKIE } from "@/lib/shipping-ack";

export async function markShippingRead() {
	const store = await cookies();
	store.set(SHIPPING_ACK_COOKIE, "1", sessionCookieOptions);
	redirect("/submit");
}
