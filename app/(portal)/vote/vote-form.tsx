"use client";

import { useActionState, useState } from "react";
import type { Project } from "@/lib/projects";
import { QUESTIONS } from "@/lib/questions";
import { vote, type VoteState } from "./actions";

export default function VoteForm({
	projects,
	initial,
	open,
	max,
}: {
	projects: Project[];
	initial: string[];
	open: boolean;
	max: number;
}) {
	const [state, action, pending] = useActionState<VoteState, FormData>(vote, {});
	const [picked, setPicked] = useState<Set<string>>(() => new Set(initial));
	const full = picked.size >= max;

	return (
		<form action={action} className="flex flex-col gap-4">
			<ul className="flex flex-col gap-3">
				{projects.map((p) => {
					const checked = picked.has(p.id);
					return (
						<li key={p.id} className={`border-2 border-globe-blue bg-white p-3 ${checked ? "outline-2 outline-globe-blue" : ""}`}>
							<div className="flex items-start gap-3">
								{open && (
									<input
										type="checkbox"
										name="project"
										value={p.id}
										id={`p-${p.id}`}
										checked={checked}
										disabled={pending || (!checked && full)}
										onChange={() =>
											setPicked((prev) => {
												const next = new Set(prev);
												if (next.has(p.id)) next.delete(p.id);
												else next.add(p.id);
												return next;
											})
										}
										className="mt-1.5 size-5 shrink-0 accent-globe-blue"
									/>
								)}
								<div className="min-w-0 flex-1">
									<label htmlFor={open ? `p-${p.id}` : undefined} className="text-[20px] leading-snug font-bold">
										{p.name}
									</label>
									<p className="text-[14px] text-faded">
										{p.teamName && <span className="text-foreground">{p.teamName} · </span>}
										{p.team.join(", ")}
									</p>
									<p className="mt-1 text-[15px] whitespace-pre-line">{p.description}</p>
									{QUESTIONS.some((q) => p.answers[q.key]) && (
										<details className="mt-1 text-[15px]">
											<summary className="cursor-pointer text-globe-blue">more about this project</summary>
											<dl className="mt-1 flex flex-col gap-2">
												{QUESTIONS.filter((q) => p.answers[q.key]).map((q) => (
													<div key={q.key}>
														<dt className="font-bold">{q.label}</dt>
														<dd className="whitespace-pre-line">{p.answers[q.key]}</dd>
													</div>
												))}
											</dl>
										</details>
									)}
									<p className="mt-1 flex gap-4 text-[15px]">
										{p.demoUrl && (
											<a href={p.demoUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-globe-blue">
												demo
											</a>
										)}
										{p.codeUrl && (
											<a href={p.codeUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-globe-blue">
												code
											</a>
										)}
									</p>
								</div>
							</div>
						</li>
					);
				})}
			</ul>
			{open && (
				<div className="sticky bottom-3 flex items-center gap-4 self-start bg-white/90 p-2">
					<button
						type="submit"
						disabled={pending || picked.size === 0}
						className="cursor-pointer bg-globe-blue px-4 py-2 text-white hover:bg-deep-ink disabled:cursor-default disabled:opacity-60"
					>
						{pending ? "saving…" : `vote (${picked.size}/${max})`}
					</button>
					<p role="status" className="text-[15px]">
						{state.error ? <span className="text-red-700">{state.error}</span> : state.ok ? "votes saved ❄" : null}
					</p>
				</div>
			)}
		</form>
	);
}
