import type { Metadata } from "next";
import { isAdminEmail } from "@/lib/admins";
import { finalsOpen, finalsOpenAt, formatPacific } from "@/lib/event";
import { FINALISTS, finalists, finalResults, finalVoteBy } from "@/lib/projects";
import { getSession } from "@/lib/session";
import FinalForm from "./final-form";

export const metadata: Metadata = { title: "final vote - the snowglobe" };

export default async function FinalPage() {
	const session = await getSession();
	if (!session?.email) {
		return <p className="text-[16px]">we can&apos;t find your email. sign out and back in to vote.</p>;
	}
	const email = session.email.toLowerCase();
	const admin = !!session.admin || (await isAdminEmail(email));
	const open = finalsOpen();
	const openAt = finalsOpenAt();

	const heading = (
		<div>
			<h1 className="text-[clamp(2.25rem,8vw,3rem)] leading-tight">final vote</h1>
			<p className="text-[15px] text-faded">
				these are the top {FINALISTS} projects from everyone&apos;s ranked votes. pick your one favorite!
			</p>
		</div>
	);

	if (!open && !admin) {
		return (
			<div className="flex flex-col gap-4">
				{heading}
				<p className="text-[16px]">
					the final vote opens {openAt ? formatPacific(openAt) : "soon"}. get your ranked votes in first!
				</p>
			</div>
		);
	}

	const data = await Promise.all([
		finalists(),
		finalVoteBy(email),
		admin ? finalResults() : Promise.resolve(new Map<string, number>()),
	]).catch((err) => {
		console.error("couldn't load final vote", err);
		return null;
	});
	if (!data) {
		return (
			<div className="flex flex-col gap-4">
				{heading}
				<p className="text-[16px]">the final vote is having trouble loading. try again in a minute, or ask an organizer.</p>
			</div>
		);
	}
	const [top, mine, results] = data;
	const voted = top.find((p) => p.id === mine);

	return (
		<div className="flex flex-col gap-4">
			{heading}
			{!open && (
				<p className="text-[15px] text-faded">
					admin preview: opens {openAt ? formatPacific(openAt) : "soon"}. the top {FINALISTS} can still change until then.
				</p>
			)}
			{top.length === 0 ? (
				<p className="text-[16px] text-faded">no ranked votes yet, so there&apos;s no top {FINALISTS} ❄</p>
			) : mine ? (
				<section className="border-2 border-globe-blue bg-white p-4 shadow-[4px_4px_0_var(--color-globe-blue)]">
					<h2 className="text-[22px] leading-tight text-globe-blue">your vote (locked in)</h2>
					<p className="mt-1 text-[18px] font-bold">{voted?.name ?? "a project that's no longer in the top 5"}</p>
				</section>
			) : open ? (
				<FinalForm
					finalists={top.map((p) => ({
						id: p.id,
						name: p.name,
						teamName: p.teamName,
						team: p.team,
						description: p.description,
						demoUrl: p.demoUrl,
						codeUrl: p.codeUrl,
						mine: p.teamEmails.includes(email),
					}))}
				/>
			) : (
				<ol className="flex flex-col gap-1 text-[16px]">
					{top.map((p, i) => (
						<li key={p.id}>
							{i + 1}. {p.name}
						</li>
					))}
				</ol>
			)}
			{admin && top.length > 0 && (
				<section className="border-2 border-globe-blue bg-white p-4">
					<h2 className="text-[22px] leading-tight text-globe-blue">final votes so far (organizers only)</h2>
					<ol className="mt-2 flex flex-col gap-1 text-[16px]">
						{[...top]
							.sort((a, b) => (results.get(b.id) ?? 0) - (results.get(a.id) ?? 0))
							.map((p) => (
								<li key={p.id} className="flex gap-3">
									<span className="min-w-0 flex-1 truncate">{p.name}</span>
									<span className="shrink-0 font-bold">{results.get(p.id) ?? 0} votes</span>
								</li>
							))}
					</ol>
				</section>
			)}
		</div>
	);
}
