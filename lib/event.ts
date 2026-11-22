// Key times for the event. Defaults (Sunday Nov 22, PT):
// submissions due 4:00 pm, voting through demos until 6:00 pm. Each can be
// moved without a code change by setting the env var to an ISO timestamp.
function time(envVar: string, fallback: string): Date {
	const value = process.env[envVar];
	const date = new Date(value || fallback);
	return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
}

export function submissionsCloseAt(): Date {
	return time("SUBMISSIONS_CLOSE_AT", "2026-11-22T16:00:00-08:00");
}

export function votingOpensAt(): Date {
	return time("VOTING_OPENS_AT", "2026-11-22T16:00:00-08:00");
}

export function votingClosesAt(): Date {
	return time("VOTING_CLOSES_AT", "2026-11-22T18:00:00-08:00");
}

export function submissionsOpen(now = new Date()): boolean {
	return now < submissionsCloseAt();
}

export type VotingState = "not-yet" | "open" | "closed";

export function votingState(now = new Date()): VotingState {
	if (now < votingOpensAt()) return "not-yet";
	return now < votingClosesAt() ? "open" : "closed";
}

/** How many projects each attendee can vote for. */
export const VOTES_PER_PERSON = 3;

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
