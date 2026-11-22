import { NextResponse } from "next/server";
import { encodeSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import { absoluteUrl } from "@/lib/urls";

export async function GET(request: Request) {
	const clientId = process.env.CLIENT_ID;

	// Local development without Hack Club auth credentials: sign in as a
	// placeholder attendee so the screens can be worked on.
	if (!clientId) {
		if (process.env.NODE_ENV === "production") {
			return NextResponse.json({ error: "CLIENT_ID is not configured" }, { status: 500 });
		}
		const res = NextResponse.redirect(absoluteUrl("/info", request));
		res.cookies.set(SESSION_COOKIE, encodeSession({ id: "dev", name: "dev admin", admin: true }), sessionCookieOptions);
		return res;
	}

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: absoluteUrl("/oauth/callback", request),
		response_type: "code",
		scope: "openid email name profile",
	});
	return NextResponse.redirect(`https://auth.hackclub.com/oauth/authorize?${params}`);
}
