import attendees from "./attendees.json";
import type { Session } from "./session";

// Snowglobe registrations pulled from Attend (attend.hackclub.com/admin/snowglobe).
// Only these people can sign in; they're matched on the email their
// Hack Club auth account uses.
export interface Attendee {
	name: string;
	email: string;
	status: "invited" | "in_progress" | "awaiting_guardian" | "complete";
	/** Attend participant_event id, or "manual-…" for people added by hand */
	attendId: string;
	/** Record id in the Snowglobe base's Users table, when they have one. */
	userId?: string;
}

const byEmail = new Map((attendees as Attendee[]).map((a) => [a.email.trim().toLowerCase(), a]));

export function findAttendee(email: string | undefined): Attendee | undefined {
	return email ? byEmail.get(email.trim().toLowerCase()) : undefined;
}

export function isAllowed(session: Session): boolean {
	// The local placeholder login only works while Hack Club auth isn't
	// configured; once CLIENT_ID is set, everyone signs in for real.
	if (session.id === "dev") return devLoginEnabled();
	if (session.admin) return true;
	// Guests only get the voting pages (see the portal layout and pages).
	if (session.guest) return true;
	return findAttendee(session.email) !== undefined;
}

export function devLoginEnabled(): boolean {
	return !process.env.CLIENT_ID && process.env.NODE_ENV !== "production";
}

export function allAttendees(): Attendee[] {
	return [...byEmail.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The attendee record for whoever is signed in. The local dev login has no
 * email, so it acts as DEV_ATTENDEE_EMAIL (any address from attendees.json).
 */
export function currentAttendee(session: Session): Attendee | undefined {
	if (session.id === "dev" && devLoginEnabled()) {
		return findAttendee(process.env.DEV_ATTENDEE_EMAIL);
	}
	return findAttendee(session.email);
}
