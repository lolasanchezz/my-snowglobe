"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/links";
import ProfileMenu, { type Profile } from "./profile-menu";

const tabClass =
	"inline-flex h-6 items-center whitespace-nowrap bg-globe-blue px-2.5 text-[15px] leading-none text-white transition-colors hover:bg-deep-ink";

export default function PortalNav({ profile }: { profile: Profile }) {
	const pathname = usePathname();

	return (
		<nav aria-label="Main" className="plaid focus-light flex items-start gap-3 px-3 py-1 sm:px-4">
			{/* Spacer the same width as the profile chip keeps the tabs centred. */}
			<div aria-hidden className="hidden w-24 shrink-0 lg:block" />
			<ul className="mx-auto flex max-w-[49rem] min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-1.5 sm:px-6">
				{NAV_LINKS.map(({ label, href }) => {
					const internal = href.startsWith("/");
					const current = internal && pathname.startsWith(href);
					return (
						<li key={label}>
							{internal ? (
								<Link
									href={href}
									aria-current={current ? "page" : undefined}
									className={`${tabClass} ${current ? "underline decoration-1 underline-offset-[5px]" : ""}`}
								>
									{label}
								</Link>
							) : (
								<a href={href} target="_blank" rel="noopener noreferrer" className={tabClass}>
									{label}
									<span className="sr-only"> (opens in a new tab)</span>
								</a>
							)}
						</li>
					);
				})}
			</ul>
			<div className="flex w-24 shrink-0 justify-end">
				<ProfileMenu profile={profile} />
			</div>
		</nav>
	);
}
