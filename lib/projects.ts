// Project submissions and ranked votes, stored in the Snowglobe Airtable base.
import type { Answers } from "./questions";
import { findAttendee } from "./attendees";
import { createRecords, formulaString, listRecords, TABLES, updateRecord } from "./airtable";

// One row per person: everyone on a team submits their own form (with their
// own hours). For voting, rows that share a code link are merged into one
// project (see listProjects).
interface SubmissionFields {
	Name?: string;
	"Team Name"?: string;
	Description?: string;
	"Code URL"?: string;
	"Demo URL"?: string;
	/** Linked Users records. Team / Team Emails are the text fallback. */
	Members?: string[];
	Team?: string;
	"Team Emails"?: string;
	"Submitted By"?: string;
	"Submitted At"?: string;
	"Community Problem"?: string;
	"Data Used"?: string;
	"Data To Action"?: string;
	Hours?: number;
}

export interface Project {
	/** Airtable record id. For a merged project, the earliest submission's. */
	id: string;
	/** Email of the person who submitted this row. */
	submittedBy: string;
	createdTime: string;
	/** Project name; empty until the team submits. */
	name: string;
	teamName: string;
	description: string;
	codeUrl: string;
	demoUrl: string;
	team: string[];
	teamEmails: string[];
	answers: Answers;
	/** Hours spent on the project; undefined if not reported. */
	hours?: number;
}

export interface ProjectInput {
	name: string;
	teamName: string;
	description: string;
	codeUrl: string;
	demoUrl: string;
	answers: Answers;
	hours: number;
	team: { name: string; email: string }[];
}

/** Users record ids for these emails (attendees without a Users row are skipped). */
function userIds(emails: string[]): string[] {
	return emails.flatMap((e) => findAttendee(e)?.userId ?? []);
}

const lines = (value: string | undefined) =>
	(value ?? "")
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

function toProject(record: { id: string; createdTime: string; fields: SubmissionFields }): Project {
	const f = record.fields;
	return {
		id: record.id,
		submittedBy: (f["Submitted By"] ?? "").toLowerCase(),
		createdTime: record.createdTime,
		name: f.Name ?? "",
		teamName: f["Team Name"] ?? "",
		description: f.Description ?? "",
		codeUrl: f["Code URL"] ?? "",
		demoUrl: f["Demo URL"] ?? "",
		team: lines(f.Team),
		teamEmails: lines(f["Team Emails"]).map((e) => e.toLowerCase()),
		answers: {
			communityProblem: f["Community Problem"] ?? "",
			dataUsed: f["Data Used"] ?? "",
			dataToAction: f["Data To Action"] ?? "",
		},
		hours: f.Hours,
	};
}

/** Every individual submission. */
export async function listSubmissions(): Promise<Project[]> {
	const records = await listRecords<SubmissionFields>(TABLES.submissions, "AND({Submitted By} != '', {Name} != '')");
	return records.map(toProject);
}

/** Normalized code link, used to spot teammates' submissions of the same project. */
function projectKey(p: Project): string {
	const url = p.codeUrl
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, "")
		.replace(/^www\./, "")
		.replace(/\.git$/, "")
		.replace(/\/+$/, "");
	return url || `record:${p.id}`;
}

/**
 * Projects for voting: submissions with the same code link are merged, keeping
 * the earliest one's details and id, with everyone involved on the team.
 */
export async function listProjects(): Promise<Project[]> {
	const groups = new Map<string, Project[]>();
	for (const sub of await listSubmissions()) {
		const key = projectKey(sub);
		groups.set(key, [...(groups.get(key) ?? []), sub]);
	}
	return [...groups.values()]
		.map((subs) => {
			subs.sort((a, b) => a.createdTime.localeCompare(b.createdTime));
			const emails = [...new Set(subs.flatMap((s) => [s.submittedBy, ...s.teamEmails]).filter(Boolean))];
			const names = [...new Set(subs.flatMap((s) => s.team))];
			return { ...subs[0]!, team: names, teamEmails: emails };
		})
		.sort((a, b) => a.name.localeCompare(b.name));
}

/** This person's own submission, if they've submitted. */
export async function findProjectFor(email: string): Promise<Project | undefined> {
	const needle = email.trim().toLowerCase();
	const records = await listRecords<SubmissionFields>(
		TABLES.submissions,
		`LOWER({Submitted By}) = ${formulaString(needle)}`,
	);
	return records.map(toProject)[0];
}

export async function saveProject(input: ProjectInput, submittedBy: string, existingId?: string): Promise<Project> {
	const fields: SubmissionFields = {
		Name: input.name,
		"Team Name": input.teamName,
		Description: input.description,
		"Code URL": input.codeUrl,
		"Demo URL": input.demoUrl,
		Members: userIds(input.team.map((m) => m.email)),
		Team: input.team.map((m) => m.name).join("\n"),
		"Team Emails": input.team.map((m) => m.email.toLowerCase()).join("\n"),
		"Submitted By": submittedBy,
		"Submitted At": new Date().toISOString(),
		"Community Problem": input.answers.communityProblem,
		"Data Used": input.answers.dataUsed,
		"Data To Action": input.answers.dataToAction,
		Hours: input.hours,
	};
	const write = (f: SubmissionFields) =>
		existingId
			? updateRecord<SubmissionFields>(TABLES.submissions, existingId, f)
			: createRecords<SubmissionFields>(TABLES.submissions, [f]).then((r) => r[0]!);
	try {
		return toProject(await write(fields));
	} catch (err) {
		// The Hours column may not exist in Airtable yet; save everything else.
		if (!String(err).includes("UNKNOWN_FIELD_NAME")) throw err;
		console.error("Airtable has no Hours field yet; saving without it");
		const rest = { ...fields };
		delete rest.Hours;
		return toProject(await write(rest));
	}
}

// Ranked votes (Snowglobe-Event-Votes): everyone ranks their top 5. One row
// per pick, Rank 1 = favorite. Rows without a Rank are from the old
// pick-3 voting and are ignored.
interface VoteFields {
	Rank?: number;
	Points?: number;
	Project?: string[];
	"Voter Email"?: string;
	"Voter Name"?: string;
	/** Linked Users record. */
	Voter?: string[];
	"Voted At"?: string;
	/** "final" for a final-round vote; empty for ranked picks. */
	Round?: string;
}

export const RANKED_PICKS = 5;

/** #1 gets 5 points, #2 gets 4, … #5 gets 1. */
export function pointsForRank(rank: number): number {
	return Math.max(0, RANKED_PICKS + 1 - rank);
}

/** This person's picks, as project ids in rank order. */
export async function rankedVotesBy(email: string): Promise<{ recordIds: string[]; projectIds: string[] }> {
	const records = await listRecords<VoteFields>(
		TABLES.votes,
		`LOWER({Voter Email}) = ${formulaString(email.trim().toLowerCase())}`,
	);
	const ranked = records.filter((r) => r.fields.Rank && !r.fields.Round).sort((a, b) => a.fields.Rank! - b.fields.Rank!);
	return {
		recordIds: ranked.map((r) => r.id),
		projectIds: ranked.flatMap((r) => r.fields.Project?.slice(0, 1) ?? []),
	};
}

/** Save this person's ranked picks (final: they can't be changed). `projects` is in rank order. */
export async function castRankedVotes(
	voter: { email: string; name: string },
	projects: { id: string; name: string }[],
): Promise<void> {
	const now = new Date().toISOString();
	const rows: VoteFields[] = projects.map((p, i) => ({
		Rank: i + 1,
		Points: pointsForRank(i + 1),
		Project: [p.id],
		"Voter Email": voter.email.toLowerCase(),
		"Voter Name": voter.name,
		Voter: userIds([voter.email]),
		"Voted At": now,
	}));
	try {
		await createRecords<VoteFields>(TABLES.votes, rows);
	} catch (err) {
		// The Points column may not exist yet; points are derived from Rank anyway.
		if (!String(err).includes("UNKNOWN_FIELD_NAME") || !String(err).includes("Points")) throw err;
		await createRecords<VoteFields>(
			TABLES.votes,
			rows.map((row) => {
				const rest = { ...row };
				delete rest.Points;
				return rest;
			}),
		);
	}
}

/** Point totals across everyone's ranked picks, highest first. */
export async function rankedResults(): Promise<{ projectId: string; points: number; picks: number }[]> {
	const records = await listRecords<VoteFields>(TABLES.votes);
	const totals = new Map<string, { points: number; picks: number }>();
	for (const r of records) {
		const id = r.fields.Project?.[0];
		if (!id || !r.fields.Rank || r.fields.Round) continue;
		const t = totals.get(id) ?? { points: 0, picks: 0 };
		t.points += pointsForRank(r.fields.Rank);
		t.picks += 1;
		totals.set(id, t);
	}
	return [...totals.entries()]
		.map(([projectId, t]) => ({ projectId, ...t }))
		.sort((a, b) => b.points - a.points);
}

// Final round: everyone picks one favorite from the top 5 by ranked points.
// Stored in the same table with Round = "final" and no Rank.
const FINAL = "final";
export const FINALISTS = 5;

/** The top projects by ranked points (ties broken by how many people picked them). */
export async function finalists(): Promise<Project[]> {
	const [projects, results] = await Promise.all([listProjects(), rankedResults()]);
	const byId = new Map(projects.map((p) => [p.id, p]));
	return results
		.sort((a, b) => b.points - a.points || b.picks - a.picks)
		.flatMap((r) => byId.get(r.projectId) ?? [])
		.slice(0, FINALISTS);
}

/** The project this person picked in the final round, if they've voted. */
export async function finalVoteBy(email: string): Promise<string | undefined> {
	const records = await listRecords<VoteFields>(
		TABLES.votes,
		`LOWER({Voter Email}) = ${formulaString(email.trim().toLowerCase())}`,
	);
	return records.find((r) => r.fields.Round === FINAL)?.fields.Project?.[0];
}

export async function castFinalVote(voter: { email: string; name: string }, projectId: string): Promise<void> {
	await createRecords<VoteFields>(TABLES.votes, [
		{
			Round: FINAL,
			Project: [projectId],
			"Voter Email": voter.email.toLowerCase(),
			"Voter Name": voter.name,
			Voter: userIds([voter.email]),
			"Voted At": new Date().toISOString(),
		},
	]);
}

/** Final-round vote counts per project id. */
export async function finalResults(): Promise<Map<string, number>> {
	const counts = new Map<string, number>();
	for (const r of await listRecords<VoteFields>(TABLES.votes)) {
		const id = r.fields.Project?.[0];
		if (r.fields.Round !== FINAL || !id) continue;
		counts.set(id, (counts.get(id) ?? 0) + 1);
	}
	return counts;
}
