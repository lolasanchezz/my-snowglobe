"use server";

import { refresh } from "next/cache";
import { allAttendees, currentAttendee } from "@/lib/attendees";
import { submissionsOpen } from "@/lib/event";
import { findProjectFor, saveProject } from "@/lib/projects";
import { QUESTIONS, type Answers } from "@/lib/questions";
import { getSession } from "@/lib/session";

export interface SubmitState {
	ok?: boolean;
	error?: string;
}

function cleanUrl(value: FormDataEntryValue | null): string | null {
	const text = String(value ?? "").trim();
	if (!text) return "";
	try {
		const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
		return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
	} catch {
		return null;
	}
}

export async function submitProject(_prev: SubmitState, form: FormData): Promise<SubmitState> {
	const session = await getSession();
	const me = session && currentAttendee(session);
	if (!me) return { error: "you need to be signed in as a snowglobe attendee to submit." };
	if (!submissionsOpen()) return { error: "submissions are closed!" };

	const name = String(form.get("name") ?? "").trim();
	const teamName = String(form.get("teamName") ?? "").trim();
	if (teamName.length > 60) return { error: "team names can be 60 characters max." };
	const description = String(form.get("description") ?? "").trim();
	const codeUrl = cleanUrl(form.get("codeUrl"));
	const demoUrl = cleanUrl(form.get("demoUrl"));
	if (!name || name.length > 100) return { error: "give your project a name (100 characters max)." };
	if (!description || description.length > 3000) return { error: "add a description (3000 characters max)." };
	if (codeUrl === null || demoUrl === null) return { error: "those links don't look right. use full https:// urls." };
	if (!codeUrl) return { error: "add a link to your code (github, etc)." };
	const hours = Number(String(form.get("hours") ?? "").trim());
	if (!Number.isFinite(hours) || hours <= 0 || hours > 100)
		return { error: "how many hours did you spend on this? (a number between 0 and 100)" };
	const answers = {} as Answers;
	for (const q of QUESTIONS) {
		const answer = String(form.get(q.key) ?? "").trim();
		// Optional: only if it applies to the project.
		if (answer.length > 3000) return { error: `keep “${q.label}” under 3000 characters.` };
		answers[q.key] = answer;
	}

	const attendees = new Map(allAttendees().map((a) => [a.email.toLowerCase(), a]));
	const teamEmails = new Set([me.email.toLowerCase()]);
	for (const email of form.getAll("team")) {
		const key = String(email).toLowerCase();
		if (attendees.has(key)) teamEmails.add(key);
	}
	if (teamEmails.size > 6) return { error: "teams can have at most 6 people." };
	// Everyone submits their own row; the team list is just who they worked with.

	try {
		const existing = await findProjectFor(me.email);
		await saveProject(
			{
				name,
				teamName,
				description,
				codeUrl,
				demoUrl,
				answers,
				hours: Math.round(hours * 10) / 10,
				team: [...teamEmails].map((email) => ({ email, name: attendees.get(email)?.name ?? email })),
			},
			me.email,
			existing?.id,
		);
	} catch (err) {
		console.error("project submission failed", err);
		return { error: `couldn't save that, sorry! try again, or ping an organizer.` };
	}

	refresh();
	return { ok: true };
}
