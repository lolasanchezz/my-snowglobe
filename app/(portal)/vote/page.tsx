import type { Metadata } from "next";
import { currentAttendee } from "@/lib/attendees";
import { formatPacific, VOTES_PER_PERSON, votingClosesAt, votingOpensAt, votingState } from "@/lib/event";
import { listProjects, votesBy } from "@/lib/projects";
import { getSession } from "@/lib/session";
import VoteForm from "./vote-form";

export const metadata: Metadata = { title: "vote - the snowglobe" };

export default async function VotePage() {
	const session = await getSession();
	const me = session && currentAttendee(session);
	if (!me) {
		return <p className="text-[16px]">we can&apos;t find your attendee record. set DEV_ATTENDEE_EMAIL for local dev.</p>;
	}

	const state = votingState();
	const data = await Promise.all([listProjects(), votesBy(me.email)]).catch((err) => {
		console.error("couldn't load voting", err);
		return null;
	});
	if (!data) return <p className="text-[16px]">voting is having trouble loading. try again in a minute, or ask an organizer.</p>;
	const [all, mine] = data;
	const email = me.email.toLowerCase();
	const projects = all.filter((p) => !p.teamEmails.includes(email));

	const note = {
		"not-yet": `voting opens ${formatPacific(votingOpensAt())}. here's what's been submitted so far!`,
		open: `pick your ${VOTES_PER_PERSON} favorites (not your own!). you can change your votes until ${formatPacific(votingClosesAt())}.`,
		closed: "voting is closed. thanks for voting! ❄",
	}[state];

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h1 className="text-[clamp(2.25rem,8vw,3rem)] leading-tight">vote</h1>
				<p className="text-[15px] text-faded">{note}</p>
			</div>
			{projects.length === 0 ? (
				<p className="text-[16px] text-faded">no projects yet ❄</p>
			) : (
				<VoteForm projects={projects} initial={mine.projectIds} open={state === "open"} max={VOTES_PER_PERSON} />
			)}
		</div>
	);
}
