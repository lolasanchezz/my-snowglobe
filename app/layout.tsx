import type { Metadata } from "next";
import { Libre_Baskerville } from "next/font/google";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
	variable: "--font-libre-baskerville",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const metadata: Metadata = {
	title: "the snowglobe - Hack Club",
	description: "Schedule, room and team info for Snowglobe attendees.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${libreBaskerville.variable} h-full antialiased`}>
			<body className="flex min-h-full flex-col bg-background font-serif text-foreground selection:bg-globe-blue/[0.18]">
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-globe-blue focus:px-4 focus:py-2 focus:text-white focus:shadow-md"
				>
					Skip to main content
				</a>
				{children}
			</body>
		</html>
	);
}
