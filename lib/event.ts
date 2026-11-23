// Submission deadline: Sunday Nov 22, 5:00 pm PT by default. Move it without a
// code change by setting SUBMISSIONS_CLOSE_AT to an ISO timestamp.
function time(envVar: string, fallback: string): Date {
	const value = process.env[envVar];
	const date = new Date(value || fallback);
	return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
}

export function submissionsCloseAt(): Date {
	return time("SUBMISSIONS_CLOSE_AT", "2026-11-22T17:00:00-08:00");
}

export function submissionsOpen(now = new Date()): boolean {
	return now < submissionsCloseAt();
}

/**
 * When the final round opens (pick one favorite from the top 5). Set
 * FINALS_OPEN_AT to an ISO timestamp: at that moment ranked voting closes, so
 * the top 5 stops changing, and the final vote opens. Unset, both stay open.
 */
export function finalsOpenAt(): Date | null {
	const value = process.env.FINALS_OPEN_AT;
	const date = value ? new Date(value) : null;
	return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function finalsOpen(now = new Date()): boolean {
	const at = finalsOpenAt();
	return !at || now >= at;
}

export function rankedVotingOpen(now = new Date()): boolean {
	const at = finalsOpenAt();
	return !at || now < at;
}

export function formatPacific(date: Date): string {
	return date
		.toLocaleString("en-US", {
			timeZone: "America/Los_Angeles",
			weekday: "long",
			hour: "numeric",
			minute: "2-digit",
		})
		.toLowerCase();
}
