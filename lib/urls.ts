// The site's public origin: APP_URL when set (needed behind proxies, and
// must match the OAuth app's redirect URI), otherwise the request's own.
export function absoluteUrl(path: string, request: Request): string {
	const origin = process.env.APP_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;
	return `${origin}${path}`;
}
