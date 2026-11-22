// The tabs along the top of every signed-in screen. "vote" only shows once
// voting opens (see portal-nav.tsx).
export const NAV_LINKS = [
	{ label: "info", href: "/info" },
	{ label: "submit", href: "/submit" },
	{ label: "vote", href: "/vote" },
] as const;

export const HELP_URL = "https://hackclub.slack.com";
