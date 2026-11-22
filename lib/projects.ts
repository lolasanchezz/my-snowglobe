// Project submissions and votes, stored in the Snowglobe Airtable base.
import type { Answers } from "./questions";
import { findAttendee } from "./attendees";
import { createRecords, deleteRecords, formulaString, listRecords, TABLES, updateRecord } from "./airtable";

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

interface VoteFields {
	"Voter Email"?: string;
	"Voter Name"?: string;
	Voter?: string[];
	Project?: string[];
	"Voted At"?: string;
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
 * the earliest one's details and id, with everyone involved on the team (so
 * nobody can vote for a project they worked on).
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

/** Project ids this person currently has votes on. */
export async function votesBy(email: string): Promise<{ recordIds: string[]; projectIds: string[] }> {
	const records = await listRecords<VoteFields>(
		TABLES.votes,
		`LOWER({Voter Email}) = ${formulaString(email.trim().toLowerCase())}`,
	);
	return {
		recordIds: records.map((r) => r.id),
		projectIds: records.flatMap((r) => r.fields.Project ?? []),
	};
}

/** Replace this person's votes with a new set. */
export async function castVotes(voter: { email: string; name: string }, projectIds: string[]): Promise<void> {
	const { recordIds } = await votesBy(voter.email);
	const now = new Date().toISOString();
	await createRecords<VoteFields>(
		TABLES.votes,
		projectIds.map((id) => ({
			"Voter Email": voter.email.toLowerCase(),
			"Voter Name": voter.name,
			Voter: userIds([voter.email]),
			Project: [id],
			"Voted At": now,
		})),
	);
	// Create first, then remove the old ones, so a failure never leaves
	// someone with no votes recorded.
	if (recordIds.length) await deleteRecords(TABLES.votes, recordIds);
}
