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

/** Name for matching teammates' submissions: case, punctuation and spacing ignored. */
const nameKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Teammates who typed in different code links but the same project name. */
function sameTeamProject(a: Project, b: Project): boolean {
	if (!nameKey(a.name) || nameKey(a.name) !== nameKey(b.name)) return false;
	return (!!a.submittedBy && b.teamEmails.includes(a.submittedBy)) || (!!b.submittedBy && a.teamEmails.includes(b.submittedBy));
}

/**
 * Projects for voting: teammates' submissions are merged (same code link, or
 * same name with one submitter on the other's team), keeping the earliest
 * one's details and id, with everyone involved on the team.
 */
export async function listProjects(): Promise<Project[]> {
	const subs = await listSubmissions();
	// Union-find over submissions.
	const parent = subs.map((_, i) => i);
	const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
	const join = (a: number, b: number) => {
		parent[find(a)] = find(b);
	};
	const byCode = new Map<string, number>();
	subs.forEach((sub, i) => {
		const key = projectKey(sub);
		const seen = byCode.get(key);
		if (seen === undefined) byCode.set(key, i);
		else join(i, seen);
		for (let j = 0; j < i; j++) if (sameTeamProject(sub, subs[j]!)) join(i, j);
	});
	const groups = new Map<number, Project[]>();
	subs.forEach((sub, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), sub]));
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
	/** Guest vote: name typed in, not verified with Hack Club auth. */
	Guest?: boolean;
}

interface Voter {
	/** Lowercased email, or "guest:<id>" for guests (see voterKey). */
	email: string;
	name: string;
	guest?: boolean;
}

/** Shared "who voted" columns. Guests get a Guest tick and "(guest)" after their name. */
function voterFields(voter: Voter): VoteFields {
	if (voter.guest) {
		return { "Voter Email": voter.email, "Voter Name": `${voter.name} (guest)`, Guest: true, "Voted At": new Date().toISOString() };
	}
	return {
		"Voter Email": voter.email.toLowerCase(),
		"Voter Name": voter.name,
		Voter: userIds([voter.email]),
		"Voted At": new Date().toISOString(),
	};
}

// Columns added after launch. If one doesn't exist in Airtable yet, save the
// rest rather than losing the vote (Points is derived from Rank; guests still
// show up via the "(guest)" name and "guest:" email).
const OPTIONAL_VOTE_FIELDS = ["Points", "Guest"] as const;

async function createVotes(rows: VoteFields[]): Promise<void> {
	try {
		await createRecords<VoteFields>(TABLES.votes, rows);
	} catch (err) {
		const missing = OPTIONAL_VOTE_FIELDS.filter((f) => String(err).includes("UNKNOWN_FIELD_NAME") && String(err).includes(f));
		if (missing.length === 0) throw err;
		console.error(`Airtable votes table is missing ${missing.join(", ")}; saving without`);
		await createRecords<VoteFields>(
			TABLES.votes,
			rows.map((row) => {
				const rest = { ...row };
				for (const f of OPTIONAL_VOTE_FIELDS) delete rest[f];
				return rest;
			}),
		);
	}
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
export async function castRankedVotes(voter: Voter, projects: { id: string; name: string }[]): Promise<void> {
	const who = voterFields(voter);
	await createVotes(
		projects.map((p, i) => ({
			...who,
			Rank: i + 1,
			Points: pointsForRank(i + 1),
			Project: [p.id],
		})),
	);
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

// The top 5, picked by organizers (hardcoded). These are the merged projects'
// ids, i.e. the earliest submission record of each team.
const FINALIST_IDS = [
	"rec8SpgoH0KysQzJs", // Freeze Fit
	"reclw2s7PYvKcYAZF", // the Freeze Feds
	"recz8APkpGHggUUn0", // Snowfall Village
	"rec093gIq2qa69X3s", // Fridged
	"recA6qfviVA2RhedK", // Permafrost & Potions
];

/** The final-round projects, in FINALIST_IDS order. */
export async function finalists(): Promise<Project[]> {
	const byId = new Map((await listProjects()).map((p) => [p.id, p]));
	return FINALIST_IDS.flatMap((id) => byId.get(id) ?? []);
}

/** The project this person picked in the final round, if they've voted. */
export async function finalVoteBy(email: string): Promise<string | undefined> {
	const records = await listRecords<VoteFields>(
		TABLES.votes,
		`LOWER({Voter Email}) = ${formulaString(email.trim().toLowerCase())}`,
	);
	return records.find((r) => r.fields.Round === FINAL)?.fields.Project?.[0];
}

export async function castFinalVote(voter: Voter, projectId: string): Promise<void> {
	await createVotes([{ ...voterFields(voter), Round: FINAL, Project: [projectId] }]);
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
