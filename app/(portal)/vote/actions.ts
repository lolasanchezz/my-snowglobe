"use server";

import { refresh } from "next/cache";
import { rankedVotingOpen } from "@/lib/event";
import { castRankedVotes, listProjects, RANKED_PICKS, rankedVotesBy } from "@/lib/projects";
import { getSession } from "@/lib/session";

export interface RankState {
	ok?: boolean;
	error?: string;
}

export async function rankVote(_prev: RankState, form: FormData): Promise<RankState> {
	const session = await getSession();
	if (!session?.email) return { error: "you need to be signed in to vote." };
	const email = session.email.toLowerCase();
	if (!rankedVotingOpen()) return { error: "ranked voting is closed. head to the final vote!" };

	// Form order is rank order (#1 first).
	const picked = [...new Set(form.getAll("project").map(String))];
	if (picked.length > RANKED_PICKS) return { error: `you can only rank ${RANKED_PICKS} projects.` };

	try {
		// Picks are final: once saved, they can't be changed.
		if ((await rankedVotesBy(session.email!)).recordIds.length > 0)
			return { error: "you've already submitted your picks. they're locked in." };
		// No voting for your own project.
		const all = (await listProjects()).filter((p) => !p.teamEmails.includes(email));
		const needed = Math.min(RANKED_PICKS, all.length);
		if (picked.length < needed) return { error: `rank ${needed} projects before submitting.` };
		const projects = new Map(all.map((p) => [p.id, p]));
		const ranked = [];
		for (const id of picked) {
			const project = projects.get(id);
			if (!project) return { error: "one of those projects isn't available (or it's yours). reload and try again." };
			ranked.push({ id, name: project.name });
		}
		await castRankedVotes({ email: session.email!, name: session.name }, ranked);
	} catch (err) {
		console.error("ranked voting failed", err);
		return { error: "couldn't save your picks, sorry! try again, or ping an organizer." };
	}

	refresh();
	return { ok: true };
}
