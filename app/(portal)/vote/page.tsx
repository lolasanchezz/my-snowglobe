import type { Metadata } from "next";
import Link from "next/link";
import { rankedVotingOpen } from "@/lib/event";
import { isAdminEmail } from "@/lib/admins";
import { listProjects, RANKED_PICKS, rankedResults, rankedVotesBy } from "@/lib/projects";
import { getSession } from "@/lib/session";
import RankForm from "./rank-form";

export const metadata: Metadata = { title: "vote - the snowglobe" };

export default async function RankPage() {
	const session = await getSession();
	if (!session?.email) {
		return <p className="text-[16px]">we can&apos;t find your email. sign out and back in to vote.</p>;
	}
	const email = session.email.toLowerCase();
	// Running totals are for organizers only, so they don't sway anyone's vote.
	const admin = !!session.admin || (await isAdminEmail(email));

	const data = await Promise.all([
		listProjects(),
		rankedVotesBy(email).catch(() => null),
		admin ? rankedResults().catch(() => []) : Promise.resolve([]),
	]).catch((err) => {
		console.error("couldn't load ranked voting", err);
		return null;
	});
	if (!data) return <p className="text-[16px]">projects are having trouble loading. try again in a minute.</p>;
	const [all, mine, results] = data;
	const names = new Map(all.map((p) => [p.id, p.name]));
	const projects = all.filter((p) => !p.teamEmails.includes(email));
	const open = rankedVotingOpen();

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h1 className="text-[clamp(2.25rem,8vw,3rem)] leading-tight">vote</h1>
				<p className="text-[15px] text-faded">
					rank your top {RANKED_PICKS} projects (not your own!): #1 gets {RANKED_PICKS} points, #2 gets {RANKED_PICKS - 1}, down to 1
					point for #{RANKED_PICKS}. once you submit, your picks are locked in.
				</p>
				{mine === null && (
					<p className="mt-1 text-[15px] text-red-700">
						voting is having trouble loading. try again in a minute, or ask an organizer.
					</p>
				)}
			</div>
			{mine && mine.projectIds.length > 0 ? (
				<section className="border-2 border-globe-blue bg-white p-4 shadow-[4px_4px_0_var(--color-globe-blue)]">
					<h2 className="text-[22px] leading-tight text-globe-blue">your picks (locked in)</h2>
					<ol className="mt-2 flex flex-col gap-2 text-[16px]">
						{mine.projectIds.map((id, i) => (
							<li key={id} className="flex items-center gap-2 border-2 border-globe-blue/40 p-2">
								<span className="w-8 shrink-0 text-[20px] font-bold text-globe-blue">#{i + 1}</span>
								<span className="min-w-0 flex-1 truncate font-bold">{names.get(id) ?? "(removed project)"}</span>
								<span className="shrink-0 text-[14px] text-faded">{RANKED_PICKS - i} pts</span>
							</li>
						))}
					</ol>
				</section>
			) : !open ? (
				<p className="text-[16px]">
					ranked voting is closed.{" "}
					<Link href="/final" className="text-globe-blue underline underline-offset-2">
						vote for your favorite of the top 5 →
					</Link>
				</p>
			) : projects.length === 0 ? (
				<p className="text-[16px] text-faded">no projects yet ❄</p>
			) : (
				<RankForm
					projects={projects.map(({ id, name, teamName, team, description }) => ({
						id,
						name,
						teamName,
						team,
						description,
					}))}
					max={RANKED_PICKS}
				/>
			)}
			{results.length > 0 && (
				<section className="border-2 border-globe-blue bg-white p-4">
					<h2 className="text-[22px] leading-tight text-globe-blue">points so far (organizers only)</h2>
					<ol className="mt-2 flex flex-col gap-1 text-[16px]">
						{results.map((r, i) => (
							<li key={r.projectId} className="flex gap-3">
								<span className="w-6 shrink-0 text-faded">{i + 1}.</span>
								<span className="min-w-0 flex-1 truncate">{names.get(r.projectId) ?? "(removed project)"}</span>
								<span className="shrink-0 font-bold">
									{r.points} pts
								</span>
							</li>
						))}
					</ol>
				</section>
			)}
		</div>
	);
}
