"use client";

import { useActionState, useState } from "react";
import { fieldClass } from "../submit/submit-form";
import { rankVote, type RankState } from "./actions";

type Item = { id: string; name: string; teamName: string; team: string[]; description: string };

const smallButton =
	"cursor-pointer bg-globe-blue px-2 py-0.5 text-[14px] text-white hover:bg-deep-ink disabled:cursor-default disabled:opacity-40";

export default function RankForm({ projects, max }: { projects: Item[]; max: number }) {
	const [state, action, pending] = useActionState<RankState, FormData>(rankVote, {});
	const [ranked, setRanked] = useState<string[]>([]);
	const [search, setSearch] = useState("");
	const byId = new Map(projects.map((p) => [p.id, p]));
	const full = ranked.length >= max;
	const needed = Math.min(max, projects.length);

	const q = search.trim().toLowerCase();
	const results = projects.filter(
		(p) =>
			!q ||
			[p.name, p.teamName, p.description, ...p.team].some((text) => text.toLowerCase().includes(q)),
	);

	const move = (index: number, by: number) =>
		setRanked((prev) => {
			const next = [...prev];
			const target = index + by;
			if (target < 0 || target >= next.length) return prev;
			[next[index], next[target]] = [next[target]!, next[index]!];
			return next;
		});

	return (
		<form action={action} className="flex flex-col gap-6 text-[16px]">
			<section className="border-2 border-globe-blue bg-white p-4 shadow-[4px_4px_0_var(--color-globe-blue)]">
				<h2 className="text-[22px] leading-tight text-globe-blue">
					your ranking ({ranked.length}/{max})
				</h2>
				{ranked.length === 0 ? (
					<p className="mt-1 text-faded">nothing yet. add projects from the list below.</p>
				) : (
					<ol className="mt-2 flex flex-col gap-2">
						{ranked.map((id, i) => (
							<li key={id} className="flex items-center gap-2 border-2 border-globe-blue/40 p-2">
								<input type="hidden" name="project" value={id} />
								<span className="w-8 shrink-0 text-[20px] font-bold text-globe-blue">#{i + 1}</span>
								<span className="min-w-0 flex-1 truncate font-bold">{byId.get(id)?.name ?? id}</span>
								<span className="shrink-0 text-[14px] text-faded">{max - i} pts</span>
								<button
									type="button"
									onClick={() => move(i, -1)}
									disabled={pending || i === 0}
									aria-label={`move ${byId.get(id)?.name} up`}
									className={smallButton}
								>
									↑
								</button>
								<button
									type="button"
									onClick={() => move(i, 1)}
									disabled={pending || i === ranked.length - 1}
									aria-label={`move ${byId.get(id)?.name} down`}
									className={smallButton}
								>
									↓
								</button>
								<button
									type="button"
									onClick={() => setRanked((prev) => prev.filter((x) => x !== id))}
									disabled={pending}
									aria-label={`remove ${byId.get(id)?.name}`}
									className={smallButton}
								>
									✕
								</button>
							</li>
						))}
					</ol>
				)}
				<div className="mt-3 flex items-center gap-4">
					<button
						type="submit"
						disabled={pending || ranked.length < needed || state.ok}
						className="cursor-pointer bg-globe-blue px-4 py-2 text-white hover:bg-deep-ink disabled:cursor-default disabled:opacity-60"
					>
						{pending ? "saving…" : state.ok ? "submitted" : "submit picks (final)"}
					</button>
					<p role="status" className="text-[15px]">
						{state.error ? <span className="text-red-700">{state.error}</span> : state.ok ? "picks locked in ❄" : `you can’t change them after this.`}
					</p>
				</div>
			</section>

			<section className="flex flex-col gap-2">
				<input
					type="search"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="search projects, teams, people…"
					aria-label="search projects"
					className={fieldClass}
				/>
				<p className="text-[14px] text-faded">
					{results.length} of {projects.length} projects
				</p>
				<ul className="flex flex-col gap-2">
					{results.map((p) => {
						const rank = ranked.indexOf(p.id);
						return (
							<li key={p.id} className="flex items-start gap-3 border-2 border-globe-blue bg-white p-3">
								<div className="min-w-0 flex-1">
									<p className="text-[18px] leading-snug font-bold">{p.name}</p>
									<p className="text-[14px] text-faded">
										{p.teamName && <span className="text-foreground">{p.teamName} · </span>}
										{p.team.join(", ")}
									</p>
									<p className="mt-1 line-clamp-2 text-[15px]">{p.description}</p>
								</div>
								{rank >= 0 ? (
									<span className="shrink-0 bg-deep-ink px-2 py-1 text-[14px] text-white">#{rank + 1}</span>
								) : (
									<button
										type="button"
										onClick={() => setRanked((prev) => [...prev, p.id])}
										disabled={pending || full}
										className={`${smallButton} shrink-0 px-3 py-1`}
									>
										{full ? "full" : "add"}
									</button>
								)}
							</li>
						);
					})}
				</ul>
			</section>
		</form>
	);
}
