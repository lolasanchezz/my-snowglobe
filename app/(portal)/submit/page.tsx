import type { Metadata } from "next";
import { allAttendees, currentAttendee } from "@/lib/attendees";
import { formatPacific, submissionsCloseAt, submissionsOpen } from "@/lib/event";
import { findProjectFor } from "@/lib/projects";
import { getSession } from "@/lib/session";
import { requireReadShipping } from "@/lib/shipping-ack";
import SubmitForm from "./submit-form";

export const metadata: Metadata = { title: "submit - the snowglobe" };

export default async function SubmitPage() {
	await requireReadShipping();
	const session = await getSession();
	const me = session && currentAttendee(session);
	if (!me) {
		return (
			<p className="text-[16px]">we can&apos;t find your attendee record. set DEV_ATTENDEE_EMAIL for local dev.</p>
		);
	}

	const project = await findProjectFor(me.email).catch((err) => {
		console.error("couldn't load project", err);
		return null;
	});
	if (project === null) {
		return (
			<p className="text-[16px]">submissions are having trouble loading. try again in a minute, or ask an organizer.</p>
		);
	}

	const open = submissionsOpen();
	const others = allAttendees()
		.filter((a) => a.email !== me.email)
		.map(({ name, email }) => ({ name, email }));

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h1 className="text-[clamp(2.25rem,8vw,3rem)] leading-tight">
					{project?.name ? "your project" : "submit your project"}
				</h1>
				<p className="text-[15px] text-faded">
					{open ? `due ${formatPacific(submissionsCloseAt())}.` : "submissions are closed."}
				</p>
			</div>
			<div className="border-2 border-globe-blue bg-white p-4 text-[16px] shadow-[4px_4px_0_var(--color-globe-blue)]">
				<p className="text-[20px] leading-tight text-globe-blue">everyone submits!</p>
				<p className="mt-1">
					working on a team? every person on the team fills out this form themselves. use the same project name and
					links as your teammates, add them below, and put in the hours <em>you</em> spent.
				</p>
			</div>
			<SubmitForm project={project} me={{ name: me.name, email: me.email }} others={others} disabled={!open} />
		</div>
	);
}
