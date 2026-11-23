import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAllowed } from "@/lib/attendees";
import { getSession } from "@/lib/session";
import Snowfall from "../snowfall";
import { startGuestSession } from "./actions";

export const metadata: Metadata = { title: "guest vote - the snowglobe" };

export default async function GuestPage({ searchParams }: { searchParams: Promise<{ error?: string | string[] }> }) {
	const session = await getSession();
	if (session && isAllowed(session)) redirect("/vote");
	const { error } = await searchParams;

	return (
		<main id="main-content" className="plaid relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden px-4">
			<Snowfall />
			<div className="screen-enter relative flex w-full max-w-sm flex-col items-center text-center text-globe-blue">
				<h1 className="text-halo text-[40px] leading-tight sm:text-[48px]">guest vote</h1>
				<p className="text-halo mt-1 text-[15px]">no Hack Club account? type your name to vote.</p>
				<form action={startGuestSession} className="mt-4 flex w-full flex-col gap-2">
					<label htmlFor="guest-name" className="sr-only">
						your name
					</label>
					<input
						id="guest-name"
						name="name"
						required
						minLength={2}
						maxLength={60}
						autoComplete="name"
						placeholder="your full name"
						className="border-2 border-globe-blue bg-white px-3 py-2 text-[16px] text-foreground"
					/>
					<button
						type="submit"
						className="bg-globe-blue px-3 py-2 text-[16px] text-white transition-colors hover:bg-deep-ink"
					>
						continue to voting
					</button>
				</form>
				{error && (
					<p role="alert" className="text-halo mt-3 text-[13px]">
						enter your name (2–60 characters).
					</p>
				)}
				<Link href="/" className="text-halo mt-4 text-[14px] underline-offset-4 hover:underline">
					← sign in w/ Hack Club auth instead
				</Link>
			</div>
		</main>
	);
}
