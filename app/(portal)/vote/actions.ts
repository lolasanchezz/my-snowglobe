"use server";

import { refresh } from "next/cache";
import { currentAttendee } from "@/lib/attendees";
import { VOTES_PER_PERSON, votingState } from "@/lib/event";
import { castVotes, listProjects } from "@/lib/projects";
import { getSession } from "@/lib/session";

export interface VoteState {
	ok?: boolean;
	error?: string;
}

export async function vote(_prev: VoteState, form: FormData): Promise<VoteState> {
	const session = await getSession();
	const me = session && currentAttendee(session);
	if (!me) return { error: "you need to be signed in as a snowglobe attendee to vote." };
	if (votingState() !== "open") return { error: "voting isn't open right now." };

	const picked = [...new Set(form.getAll("project").map(String))];
	if (picked.length === 0) return { error: "pick at least one project." };
	if (picked.length > VOTES_PER_PERSON) return { error: `you only get ${VOTES_PER_PERSON} votes!` };

	try {
		const projects = new Map((await listProjects()).map((p) => [p.id, p]));
		for (const id of picked) {
			const project = projects.get(id);
			if (!project) return { error: "one of those projects doesn't exist anymore. reload and try again." };
			if (project.teamEmails.includes(me.email.toLowerCase())) return { error: "no voting for your own project :)" };
		}
		await castVotes({ email: me.email, name: me.name }, picked);
	} catch (err) {
		console.error("voting failed", err);
		return { error: "couldn't save your votes, sorry! try again, or ping an organizer." };
	}

	refresh();
	return { ok: true };
}
