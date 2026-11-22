import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { currentAttendee, isAllowed } from "@/lib/attendees";
import { votingState } from "@/lib/event";
import PortalNav from "./portal-nav";

// Shared frame for the signed-in screens (Figma "schedule" frames 1:17 and
// 13:8): plaid strip with the blue tabs on top, snowflake wallpaper below.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
	const session = await getSession();
	if (!session) redirect("/");
	// Covers cookies issued before the Attend list was enforced.
	if (!isAllowed(session)) redirect("/auth/logout?error=not-registered");

	const attendee = currentAttendee(session);
	const profile = {
		name: attendee?.name ?? session.name,
		email: attendee?.email ?? session.email,
		admin: !!session.admin,
		attendee: !!attendee,
	};

	return (
		<div className="snowflake-wallpaper flex min-h-dvh flex-1 flex-col">
			<PortalNav profile={profile} showVote={votingState() !== "not-yet"} />
			<main id="main-content" className="screen-enter mx-auto w-full max-w-[49rem] flex-1 px-5 pt-3 pb-16 sm:px-8">
				{children}
			</main>
		</div>
	);
}
