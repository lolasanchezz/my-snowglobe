"use server";

import { refresh } from "next/cache";
import { finalsOpen } from "@/lib/event";
import { castFinalVote, finalists, finalVoteBy } from "@/lib/projects";
import { getSession } from "@/lib/session";

export interface FinalState {
	ok?: boolean;
	error?: string;
}

export async function finalVote(_prev: FinalState, form: FormData): Promise<FinalState> {
	const session = await getSession();
	if (!session?.email) return { error: "you need to be signed in to vote." };
	const email = session.email.toLowerCase();
	if (!finalsOpen()) return { error: "the final vote isn't open yet." };

	const pick = String(form.get("project") ?? "");
	if (!pick) return { error: "pick your favorite first." };

	try {
		// One vote, and it's final.
		if (await finalVoteBy(email)) return { error: "you've already voted. it's locked in." };
		const project = (await finalists()).find((p) => p.id === pick);
		if (!project) return { error: "that project isn't in the top 5. reload and try again." };
		if (project.teamEmails.includes(email)) return { error: "no voting for your own project :)" };
		await castFinalVote({ email, name: session.name }, pick);
	} catch (err) {
		console.error("final vote failed", err);
		return { error: "couldn't save your vote, sorry! try again, or ping an organizer." };
	}

	refresh();
	return { ok: true };
}
