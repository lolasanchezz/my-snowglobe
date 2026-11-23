"use client";

import { useActionState, useState } from "react";
import { finalVote, type FinalState } from "./actions";

type Finalist = {
	id: string;
	name: string;
	teamName: string;
	team: string[];
	description: string;
	demoUrl: string;
	codeUrl: string;
	mine: boolean;
};

export default function FinalForm({ finalists }: { finalists: Finalist[] }) {
	const [state, action, pending] = useActionState<FinalState, FormData>(finalVote, {});
	const [pick, setPick] = useState<string>("");

	return (
		<form action={action} className="flex flex-col gap-4 text-[16px]">
			<ul className="flex flex-col gap-3">
				{finalists.map((p) => {
					const checked = pick === p.id;
					return (
						<li
							key={p.id}
							className={`border-2 border-globe-blue bg-white p-3 ${checked ? "outline-2 outline-globe-blue" : ""} ${p.mine ? "opacity-60" : ""}`}
						>
							<label className={`flex items-start gap-3 ${p.mine ? "" : "cursor-pointer"}`}>
								<input
									type="radio"
									name="project"
									value={p.id}
									checked={checked}
									disabled={pending || p.mine || state.ok}
									onChange={() => setPick(p.id)}
									className="mt-1.5 size-5 shrink-0 accent-globe-blue"
								/>
								<span className="min-w-0 flex-1">
									<span className="block text-[20px] leading-snug font-bold">
										{p.name} {p.mine && <span className="text-[14px] font-normal text-faded">(yours)</span>}
									</span>
									<span className="block text-[14px] text-faded">
										{p.teamName && <span className="text-foreground">{p.teamName} · </span>}
										{p.team.join(", ")}
									</span>
									<span className="mt-1 block text-[15px] whitespace-pre-line">{p.description}</span>
								</span>
							</label>
							<p className="mt-1 flex gap-4 pl-8 text-[15px]">
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
						</li>
					);
				})}
			</ul>
			<div className="sticky bottom-3 flex items-center gap-4 self-start bg-white/90 p-2">
				<button
					type="submit"
					disabled={pending || !pick || state.ok}
					className="cursor-pointer bg-globe-blue px-4 py-2 text-white hover:bg-deep-ink disabled:cursor-default disabled:opacity-60"
				>
					{pending ? "saving…" : state.ok ? "voted" : "vote (final)"}
				</button>
				<p role="status" className="text-[15px]">
					{state.error ? (
						<span className="text-red-700">{state.error}</span>
					) : state.ok ? (
						"vote locked in ❄"
					) : (
						"you only get one, and you can’t change it."
					)}
				</p>
			</div>
		</form>
	);
}
