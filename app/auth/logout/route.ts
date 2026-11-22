import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { absoluteUrl } from "@/lib/urls";

export async function GET(request: Request) {
	const error = new URL(request.url).searchParams.get("error");
	const res = NextResponse.redirect(absoluteUrl(error ? `/?error=${encodeURIComponent(error)}` : "/", request));
	res.cookies.delete(SESSION_COOKIE);
	return res;
}
