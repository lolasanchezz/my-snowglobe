"use client";

import { useActionState, useState } from "react";
import type { Project } from "@/lib/projects";
import { QUESTIONS } from "@/lib/questions";
import { submitProject, type SubmitState } from "./actions";

type Person = { name: string; email: string };

export const fieldClass =
	"w-full border-2 border-globe-blue bg-white px-3 py-2 text-[16px] text-foreground disabled:opacity-60";

export default function SubmitForm({
	project,
	me,
	others,
	disabled,
}: {
	project?: Project;
	me: Person;
	others: Person[];
	disabled: boolean;
}) {
	const [state, action, pending] = useActionState<SubmitState, FormData>(submitProject, {});
	const [team, setTeam] = useState<Set<string>>(
		() => new Set(project?.teamEmails.filter((e) => e !== me.email.toLowerCase()) ?? []),
	);
	const [search, setSearch] = useState("");
	const matches = search.trim()
		? others.filter((p) => !team.has(p.email) && p.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 6)
		: [];
	const byEmail = new Map(others.map((p) => [p.email, p]));

	const toggle = (email: string) =>
		setTeam((prev) => {
			const next = new Set(prev);
			if (next.has(email)) next.delete(email);
			else next.add(email);
			return next;
		});

	return (
		<form action={action} className="flex flex-col gap-4 text-[16px]">
			<fieldset disabled={disabled || pending} className="flex flex-col gap-4">
				<div className="flex flex-col gap-1">
					<span className="font-bold">who did you work with?</span>
					<span className="text-[14px] text-faded">
						add your teammates. they each still need to submit their own form.
					</span>
					<ul className="flex flex-wrap gap-2">
						<li className="bg-globe-blue px-2 py-0.5 text-white">{me.name} (you)</li>
						{[...team].map((email) => (
							<li key={email}>
								<input type="hidden" name="team" value={email} />
								<button
									type="button"
									onClick={() => toggle(email)}
									className="cursor-pointer bg-globe-blue px-2 py-0.5 text-white hover:bg-deep-ink"
									aria-label={`remove ${byEmail.get(email)?.name ?? email} from team`}
								>
									{byEmail.get(email)?.name ?? email} ✕
								</button>
							</li>
						))}
					</ul>
					<input
						type="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="add a teammate by name…"
						aria-label="add a teammate by name"
						className={`${fieldClass} mt-1`}
					/>
					{matches.length > 0 && (
						<ul className="border-2 border-t-0 border-globe-blue bg-white">
							{matches.map((p) => (
								<li key={p.email}>
									<button
										type="button"
										onClick={() => {
											toggle(p.email);
											setSearch("");
										}}
										className="w-full cursor-pointer px-3 py-1.5 text-left hover:bg-globe-blue hover:text-white"
									>
										{p.name}
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				<label className="flex flex-col gap-1">
					<span className="font-bold">
						team name <span className="font-normal text-faded">(optional)</span>
					</span>
					<input name="teamName" maxLength={60} defaultValue={project?.teamName} className={fieldClass} />
				</label>
				<label className="flex flex-col gap-1">
					<span className="font-bold">project name</span>
					<input name="name" required maxLength={100} defaultValue={project?.name} className={fieldClass} />
				</label>
				<label className="flex flex-col gap-1">
					<span className="font-bold">what did you make?</span>
					<textarea
						name="description"
						required
						maxLength={3000}
						rows={5}
						defaultValue={project?.description}
						className={fieldClass}
					/>
				</label>
				<label className="flex flex-col gap-1">
					<span className="font-bold">hours you spent on this project</span>
					<input
						name="hours"
						type="number"
						required
						min={0.5}
						max={100}
						step={0.5}
						inputMode="decimal"
						placeholder="e.g. 12"
						defaultValue={project?.hours}
						className={`${fieldClass} max-w-40`}
					/>
				</label>
				<label className="flex flex-col gap-1">
					<span className="font-bold">code link</span>
					<input
						name="codeUrl"
						type="url"
						required
						placeholder="https://github.com/…"
						defaultValue={project?.codeUrl}
						className={fieldClass}
					/>
				</label>
				<label className="flex flex-col gap-1">
					<span className="font-bold">
						demo link{" "}
						<span className="font-normal text-faded">(live, not a video: deployed site, itch.io page or release)</span>{" "}
						<a href="/info#deploy" target="_blank" className="font-normal text-globe-blue underline underline-offset-2">
							how to deploy
						</a>
					</span>
					<input
						name="demoUrl"
						required
						type="url"
						placeholder="https://…"
						defaultValue={project?.demoUrl}
						className={fieldClass}
					/>
				</label>

				<section className="mt-2 flex flex-col gap-4 border-t-2 border-dashed border-globe-blue/40 pt-4">
					<div>
						<h2 className="text-[22px] leading-tight text-globe-blue">additional optional questions</h2>
						<p className="text-[15px] text-foreground">only answer these if they apply to you!</p>
					</div>
					{QUESTIONS.map((q) => (
						<label key={q.key} className="flex flex-col gap-1">
							<span className="font-bold">{q.label}</span>
							<textarea
								name={q.key}
								maxLength={3000}
								rows={4}
								defaultValue={project?.answers[q.key]}
								className={fieldClass}
							/>
						</label>
					))}
				</section>

				<div className="flex items-center gap-4">
					<button
						type="submit"
						className="cursor-pointer bg-globe-blue px-4 py-2 text-white hover:bg-deep-ink disabled:cursor-default disabled:opacity-60"
					>
						{pending ? "saving…" : project?.name ? "update submission" : "submit!"}
					</button>
					<p role="status" className="text-[15px]">
						{state.error ? <span className="text-red-700">{state.error}</span> : state.ok ? "saved ❄" : null}
					</p>
				</div>
			</fieldset>
		</form>
	);
}
