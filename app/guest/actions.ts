"use server";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { encodeSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

// Guest voting: no Hack Club auth, just a name. Their votes are flagged as
// guest votes in Airtable so organizers can tell them apart.
export async function startGuestSession(form: FormData) {
	const name = String(form.get("name") ?? "")
		.replace(/\s+/g, " ")
		.trim();
	if (name.length < 2 || name.length > 60) redirect("/guest?error=name");

	const store = await cookies();
	store.set(SESSION_COOKIE, encodeSession({ id: `guest-${randomUUID()}`, name, guest: true }), sessionCookieOptions);
	redirect("/vote");
}
