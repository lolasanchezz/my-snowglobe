import { HELP_URL } from "@/lib/links";
import CopyBlock from "./copy-block";

// Adapted from Crescent's "What's a ship" guide
// (https://crescent.hackclub.com/guides/shipping), minus the AI section.

const HELP = HELP_URL;

const linkClass = "text-globe-blue underline underline-offset-2";

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
	return (
		<a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
			{children}
			<span className="sr-only"> (opens in a new tab)</span>
		</a>
	);
}

// "ok!" tick box. ScrollGate counts these and unlocks once they're all checked.
function Ok({ label, show }: { label: string; show: boolean }) {
	if (!show) return null;
	return (
		<label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[15px] text-globe-blue select-none">
			<input type="checkbox" name="ok" value={label} required aria-label={`ok: ${label}`} className="peer sr-only" />
			<span
				aria-hidden
				className="grid size-6 place-items-center border-2 border-globe-blue bg-white text-[14px] leading-none text-transparent transition-colors peer-checked:bg-globe-blue peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-royal"
			>
				✓
			</span>
			<span aria-hidden className="peer-checked:font-bold">
				ok!
			</span>
		</label>
	);
}

const MINIMUM: { title: string; body: React.ReactNode }[] = [
	{
		title: "a public GitHub repo",
		body: <>with all of your code in it, pushed by the end of the hackathon. more on this below.</>,
	},
	{
		title: "a README",
		body: <>that explains what the project is, who it&apos;s for and how to use it.</>,
	},
	{
		title: "a live demo anyone can open",
		body: <>a deployed site, a release, or a store listing. not a video, not your laptop.</>,
	},
	{
		title: "a description",
		body: <>at least 40 characters.</>,
	},
	{
		title: "a screenshot",
		body: <>a still image of your project, with no logos.</>,
	},
];

const GITHUB: { title: string; body: React.ReactNode }[] = [
	{
		title: "it's public",
		body: (
			<>
				open the repo link in a private window while logged out. if you see a 404, it&apos;s still private: go to
				settings → general → change visibility.
			</>
		),
	},
	{
		title: "everything is pushed",
		body: (
			<>
				the code you demo is the code on your main branch. nothing that only exists on someone&apos;s laptop or an
				unmerged branch.
			</>
		),
	},
	{
		title: "commit as you go",
		body: (
			<>
				small commits with real messages (&ldquo;add map view&rdquo;, not &ldquo;stuff&rdquo;) all weekend. your history
				should show the project being built here, not one giant &ldquo;final&rdquo; upload on sunday.
			</>
		),
	},
	{
		title: "everyone commits",
		body: <>each teammate pushes from their own GitHub account, so it&apos;s clear who built what.</>,
	},
	{
		title: "no secrets",
		body: (
			<>
				never commit API keys, passwords or <code className="text-[14px]">.env</code> files. add them to{" "}
				<code className="text-[14px]">.gitignore</code> and commit a <code className="text-[14px]">.env.example</code>{" "}
				with just the names. leaked a key? revoke it and make a new one: deleting the commit isn&apos;t enough.
			</>
		),
	},
	{
		title: "no junk",
		body: (
			<>
				<code className="text-[14px]">node_modules</code>, build folders, <code className="text-[14px]">.DS_Store</code>{" "}
				and venvs stay out (that&apos;s what <code className="text-[14px]">.gitignore</code> is for).
			</>
		),
	},
	{
		title: "fill in the about box",
		body: (
			<>
				on the repo page, click the ⚙ next to &ldquo;About&rdquo;: add a one-line description and your demo link as the
				website.
			</>
		),
	},
	{
		title: "submit the right link",
		body: (
			<>
				the repo&apos;s main page (<code className="text-[14px]">github.com/you/project</code>), not a file, a branch or
				your profile.
			</>
		),
	},
];

const README: React.ReactNode[] = [
	<>what it is and who it&apos;s for.</>,
	<>your live demo link, right at the top.</>,
	<>a screenshot or gif, so people get it in five seconds.</>,
	<>how to use it.</>,
	<>how to run it yourself: install steps, and which environment variables it needs (names, not values).</>,
	<>what you built it with.</>,
	<>your team, with GitHub handles.</>,
	<>any template, starter or tutorial you built on.</>,
];

const GODOT_STEPS: React.ReactNode[] = [
	<>
		in Godot, go to <b>Editor → Manage Export Templates</b> and click <b>Download and Install</b> (one-time).
	</>,
	<>
		go to <b>Project → Export…</b>, click <b>Add…</b> and pick <b>Web</b>.
	</>,
	<>
		click <b>Export Project</b>, pick an empty folder outside your repo, and name the file{" "}
		<code className="text-[14px]">index.html</code>.
	</>,
	<>
		zip the <em>contents</em> of that folder, so <code className="text-[14px]">index.html</code> sits at the top of the
		zip, not inside another folder.
	</>,
	<>
		on <Ext href="https://itch.io/game/new">itch.io</Ext>, log in and click <b>Upload new project</b>. set{" "}
		<b>Kind of project</b> to <b>HTML</b>.
	</>,
	<>
		upload the zip and tick <b>This file will be played in the browser</b>.
	</>,
	<>
		under <b>Embed options</b>, set the viewport to your game&apos;s size (Godot&apos;s default is 1152 × 648) and turn
		on the <b>fullscreen button</b>. if you turned on <b>Thread Support</b> in the export (or you&apos;re on Godot
		4.0–4.2), also tick <b>SharedArrayBuffer support</b>.
	</>,
	<>
		set <b>Visibility</b> to <b>Public</b> (not draft or restricted) and save.
	</>,
	<>
		your demo link is <code className="text-[14px]">your-name.itch.io/your-game</code>. open it while logged out to
		check it plays. your source code still goes in your GitHub repo.
	</>,
];

// Copy-paste starter for README.md.
const README_TEMPLATE = `# project name

one sentence: what it is and who it's for.

**live demo:** https://…
**built by:** name (@github-handle), name (@github-handle)

![screenshot of the project](screenshot.png)

## how do you use it?

…

## how we built it

languages, frameworks, libraries and APIs we used. any template, starter or tutorial we built on.

## run it yourself

1. clone the repo
2. install dependencies: \`…\`
3. copy \`.env.example\` to \`.env\` and fill in: \`…\`
4. start it: \`…\`

## what was hard, and how we fixed it

…

## what's next

…
`;

const DEMOS: { kind: string; body: React.ReactNode }[] = [
	{
		kind: "websites",
		body: (
			<>
				a live deployed link on <Ext href="https://vercel.com">Vercel</Ext> or{" "}
				<Ext href="https://pages.github.com">GitHub Pages</Ext> (both free). other hosts, like Netlify, aren&apos;t
				allowed.
			</>
		),
	},
	{
		kind: "Godot games",
		body: <>export to the web and upload it to itch.io. steps below.</>,
	},
	{
		kind: "desktop apps",
		body: <>a GitHub release page with a built binary, like an .exe, .dmg or a Linux executable.</>,
	},
	{
		kind: "extensions",
		body: (
			<>
				a Chrome or Firefox Web Store link is best. no store license? a GitHub release with a ZIP and install
				instructions is fine.
			</>
		),
	},
];

function Section({ title, checkable, children }: { title: string; checkable: boolean; children: React.ReactNode }) {
	return (
		<section className="mt-10">
			<h3 className="text-[26px] leading-tight text-globe-blue">{title}</h3>
			<div className="mt-3 flex flex-col gap-3 leading-relaxed">{children}</div>
			{checkable && (
				<div className="mt-4 flex justify-end">
					<Ok label={title} show />
				</div>
			)}
		</section>
	);
}

export default function ShippingExplainer({
	headingLevel = 1,
	checkable = false,
}: {
	headingLevel?: 1 | 2;
	/** Show the "ok!" boxes (only while the page is gating the portal). */
	checkable?: boolean;
}) {
	const H = headingLevel === 1 ? "h1" : "h2";

	return (
		<article className="border-2 border-globe-blue bg-white px-5 py-7 text-[16px] shadow-[6px_6px_0_var(--color-globe-blue)] sm:px-10 sm:py-10">
			<H className="text-[clamp(2.25rem,8vw,3rem)] leading-[1.05] text-globe-blue">what&apos;s a shipped project?</H>
			<p className="mt-3 max-w-prose text-[18px] leading-relaxed">
				a project is something you build. a <em>shipped</em> project is something you build and present to the world.
				shipping is when your project becomes real to someone else, so it needs to be ready for people to see.
			</p>
			{checkable && (
				<p className="mt-3 text-[15px] text-globe-blue">tick &ldquo;ok!&rdquo; on each one as you read it.</p>
			)}

			<p className="mt-8 text-[15px] tracking-wide text-globe-blue">at minimum, a shipped project has:</p>
			<ol className="mt-2 flex flex-col">
				{MINIMUM.map((r, i) => (
					<li key={r.title} className="flex gap-4 border-t border-dashed border-globe-blue/40 py-4 last:border-b">
						<span
							aria-hidden
							className="mt-0.5 grid size-7 shrink-0 place-items-center bg-globe-blue text-[15px] leading-none text-white"
						>
							{i + 1}
						</span>
						<div className="flex-1">
							<h3 className="text-[20px] leading-tight text-globe-blue">{r.title}</h3>
							<p className="mt-1 leading-relaxed">{r.body}</p>
							{checkable && (
								<div className="mt-2 flex justify-end">
									<Ok label={r.title} show />
								</div>
							)}
						</div>
					</li>
				))}
			</ol>

			<Section title="your GitHub repo" checkable={checkable}>
				<p>reviewers will read your repo, so treat it as part of the project.</p>
				<ul className="flex flex-col">
					{GITHUB.map((g) => (
						<li
							key={g.title}
							className="grid gap-x-6 gap-y-1 border-t border-dashed border-globe-blue/40 py-3 last:border-b sm:grid-cols-[11rem_1fr]"
						>
							<span className="text-globe-blue">{g.title}</span>
							<span>{g.body}</span>
						</li>
					))}
				</ul>
			</Section>

			<Section title="your README" checkable={checkable}>
				<p>
					every repo needs a detailed README, written by hand. think of it as a note to other developers: a polished
					README makes a big difference. it should cover:
				</p>
				<ul className="flex list-disc flex-col gap-1 pl-5">
					{README.map((item, i) => (
						<li key={i}>{item}</li>
					))}
				</ul>
				<p>start from this template: copy it into your README.md and answer every question.</p>
				<CopyBlock label="README.md template" text={README_TEMPLATE} />
				<div className="bg-globe-blue/[0.06] p-5">
					<p className="text-globe-blue">ideas:</p>
					<ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
						<li>add images. on GitHub you can paste them straight into the Markdown editor.</li>
						<li>write it like a devlog: the problems you hit and how you fixed them.</li>
						<li>use GitHub&apos;s Markdown formatting, which supports a small subset of HTML.</li>
					</ul>
				</div>
			</Section>

			<Section title="your demo" checkable={checkable}>
				<p>
					your demo is how everyone, reviewers included, checks out your project. it should be live, not a video: a
					pre-recorded video doesn&apos;t replace a demo people can actually use.
				</p>
				<dl className="flex flex-col">
					{DEMOS.map((d) => (
						<div
							key={d.kind}
							className="grid gap-x-6 gap-y-1 border-t border-dashed border-globe-blue/40 py-3 last:border-b sm:grid-cols-[9rem_1fr]"
						>
							<dt className="text-globe-blue">{d.kind}</dt>
							<dd>{d.body}</dd>
						</div>
					))}
				</dl>
				<div className="bg-globe-blue/[0.06] p-5">
					<p className="text-globe-blue">deploying a Godot game to itch.io:</p>
					<ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5">
						{GODOT_STEPS.map((step, i) => (
							<li key={i}>{step}</li>
						))}
					</ol>
				</div>
				<p>
					building something else? <Ext href={HELP}>ask in Slack</Ext> or grab an organizer.
				</p>
			</Section>
		</article>
	);
}
