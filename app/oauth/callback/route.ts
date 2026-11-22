import { NextRequest, NextResponse } from "next/server";
import { encodeSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { absoluteUrl } from "@/lib/urls";
import { findAttendee } from "@/lib/attendees";
import { isAdminEmail } from "@/lib/admins";

interface Identity {
	id?: string;
	first_name?: string;
	last_name?: string;
	primary_email?: string;
}

export async function GET(request: NextRequest) {
	const code = request.nextUrl.searchParams.get("code");
	if (!code) return NextResponse.redirect(absoluteUrl("/", request));

	try {
		const tokenRes = await fetch("https://auth.hackclub.com/oauth/token", {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify({
				client_id: process.env.CLIENT_ID,
				client_secret: process.env.CLIENT_SECRET,
				code,
				redirect_uri: absoluteUrl("/oauth/callback", request),
				grant_type: "authorization_code",
			}),
		});
		// Never log the body: on success it holds the user's tokens.
		if (!tokenRes.ok) throw new Error(`token exchange failed: ${tokenRes.status}`);
		const { access_token } = (await tokenRes.json()) as { access_token?: string };

		const meRes = await fetch("https://auth.hackclub.com/api/v1/me", {
			headers: { Authorization: `Bearer ${access_token}` },
		});
		if (!meRes.ok) throw new Error(`/me failed: ${meRes.status}`);
		const { identity } = (await meRes.json()) as { identity?: Identity };
		if (!identity?.id) throw new Error("no identity in /me response");

		// Only people registered for Snowglobe on Attend (and admins) get in.
		const attendee = findAttendee(identity.primary_email);
		const admin = await isAdminEmail(identity.primary_email);
		if (!attendee && !admin) return NextResponse.redirect(absoluteUrl("/?error=not-registered", request));

		const name = [identity.first_name, identity.last_name].filter(Boolean).join(" ") || attendee?.name || "there";
		const res = NextResponse.redirect(absoluteUrl("/info", request));
		res.cookies.set(
			SESSION_COOKIE,
			encodeSession({ id: identity.id, name, email: identity.primary_email, admin }),
			sessionCookieOptions,
		);
		return res;
	} catch (err) {
		console.error("Hack Club auth login failed", err);
		return NextResponse.redirect(absoluteUrl("/?error=login", request));
	}
}
