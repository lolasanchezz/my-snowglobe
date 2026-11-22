import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "session";

export interface Session {
	/** Hack Club auth identity id */
	id: string;
	name: string;
	email?: string;
	/** Snowglobe admin. Checked once at sign-in. */
	admin?: boolean;
}

function secret(): string {
	const value = process.env.SESSION_SECRET;
	if (value) return value;
	if (process.env.NODE_ENV !== "production") return "dev-only-session-secret";
	throw new Error("SESSION_SECRET must be set to sign the session cookie");
}

function sign(payload: string): string {
	return createHmac("sha256", secret()).update(payload).digest("base64url");
}

// The cookie is the session: a base64url JSON payload plus an HMAC over it,
// so it can't be edited or forged without SESSION_SECRET.
export function encodeSession(session: Session): string {
	const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
	return `${payload}.${sign(payload)}`;
}

export function decodeSession(value: string | undefined): Session | null {
	if (!value) return null;
	const dot = value.lastIndexOf(".");
	if (dot === -1) return null;
	const payload = value.slice(0, dot);
	const expected = Buffer.from(sign(payload));
	const provided = Buffer.from(value.slice(dot + 1));
	if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
	try {
		const session = JSON.parse(Buffer.from(payload, "base64url").toString());
		return typeof session?.id === "string" ? (session as Session) : null;
	} catch {
		return null;
	}
}

export async function getSession(): Promise<Session | null> {
	const store = await cookies();
	return decodeSession(store.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax" as const,
	path: "/",
	maxAge: 60 * 60 * 24 * 30, // 30 days
};
