"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export interface Profile {
	name: string;
	email?: string;
	admin: boolean;
	attendee: boolean;
	guest?: boolean;
}

function initials(name: string) {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((w) => w[0]!.toUpperCase())
			.join("") || "❄"
	);
}

// Avatar button in the top right that opens a small profile card.
export default function ProfileMenu({ profile }: { profile: Profile }) {
	const ref = useRef<HTMLDetailsElement>(null);
	const pathname = usePathname();

	// Close on navigation, outside click and Escape.
	useEffect(() => {
		ref.current?.removeAttribute("open");
	}, [pathname]);
	useEffect(() => {
		const close = (e: Event) => {
			const el = ref.current;
			if (!el?.open) return;
			if (e instanceof KeyboardEvent ? e.key === "Escape" : !el.contains(e.target as Node)) {
				el.removeAttribute("open");
				if (e instanceof KeyboardEvent) el.querySelector("summary")?.focus();
			}
		};
		document.addEventListener("click", close);
		document.addEventListener("keydown", close);
		return () => {
			document.removeEventListener("click", close);
			document.removeEventListener("keydown", close);
		};
	}, []);

	const first = profile.name.split(/\s+/)[0] ?? profile.name;

	return (
		<details ref={ref} className="relative">
			<summary
				aria-label={`profile: ${profile.name}`}
				className="flex h-6 cursor-pointer list-none items-center gap-1.5 bg-globe-blue pr-2 pl-0.5 text-[15px] leading-none text-white transition-colors hover:bg-deep-ink [&::-webkit-details-marker]:hidden"
			>
				<span aria-hidden className="grid size-5 place-items-center rounded-full bg-white text-[10px] font-bold text-globe-blue">
					{initials(profile.name)}
				</span>
				<span className="max-w-[5rem] truncate lowercase">{first}</span>
				<span aria-hidden className="text-[10px]">▾</span>
			</summary>
			<div className="absolute right-0 z-20 mt-1 w-64 max-w-[calc(100vw-2rem)] border-2 border-globe-blue bg-white p-3 text-[14px] text-foreground shadow-[4px_4px_0_var(--color-globe-blue)]">
				<div className="flex items-center gap-2">
					<span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-globe-blue text-[15px] text-white">
						{initials(profile.name)}
					</span>
					<div className="min-w-0">
						<p className="truncate font-bold">{profile.name}</p>
						{profile.email && <p className="truncate text-[12px] text-faded">{profile.email}</p>}
					</div>
				</div>
				<p className="mt-2 flex flex-wrap gap-1 text-[12px]">
					{profile.attendee && <span className="bg-globe-blue px-1.5 text-white">attendee</span>}
					{profile.admin && <span className="bg-deep-ink px-1.5 text-white">admin</span>}
					{profile.guest && <span className="bg-faded px-1.5 text-white">guest</span>}
				</p>
				<ul className="mt-3 flex flex-col gap-1 border-t border-globe-blue/30 pt-2">
					{profile.attendee && (
						<>
							<li>
								<Link href="/submit" className="text-globe-blue hover:underline">my project</Link>
							</li>
						</>
					)}
					<li>
						<a href="/auth/logout" className="text-globe-blue hover:underline">sign out</a>
					</li>
				</ul>
			</div>
		</details>
	);
}
