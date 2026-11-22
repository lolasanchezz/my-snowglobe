import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAllowed } from "@/lib/attendees";
import { CONTACT } from "@/lib/info";
import Snowfall from "./snowfall";

// Figma: "Frame 1" (node 1:2) — the sign-in screen.
const ERRORS: Record<string, string> = {
	"not-registered": `we couldn't find you on the snowglobe attendee list. sign in with the email you registered with on Attend, or email ${CONTACT.email}.`,
	login: "something went wrong signing in. try again?",
};

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string | string[] }> }) {
	const session = await getSession();
	if (session && isAllowed(session)) redirect("/info");
	const { error } = await searchParams;
	const message = typeof error === "string" ? ERRORS[error] : undefined;

	return (
		<main id="main-content" className="plaid relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden px-4">
			<Snowfall />
			<div className="screen-enter relative flex flex-col items-center text-center text-globe-blue">
				<Image
					src="/imgs/snowglobe2.png"
					alt="A snowglobe on a wooden Hack Club base"
					width={418}
					height={449}
					priority
					className="globe-float h-auto w-[clamp(170px,min(34vh,50vw),300px)]"
				/>
				<h1 className="text-halo mt-2 text-[40px] leading-tight sm:text-[48px]">the snowglobe</h1>
				<a
					href="/auth/hackclub"
					className="text-halo mt-1 text-[15px] underline-offset-4 hover:underline sm:text-[17px]"
				>
					[ sign in w/ Hack Club auth ]
				</a>
				{message && (
					<p role="alert" className="text-halo mt-3 max-w-xs text-[13px] sm:max-w-sm">
						{message}
					</p>
				)}
			</div>
		</main>
	);
}
