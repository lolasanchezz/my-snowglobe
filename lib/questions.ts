// The judging questions on the submission form. Each maps to an Airtable
// field on Snowglobe-Event-Submission (see projects.ts). Safe to import from
// client components.
/** Answers to the judging questions (see QUESTIONS). */
export interface Answers {
	communityProblem: string;
	dataUsed: string;
	dataToAction: string;
}

export const QUESTIONS: { key: keyof Answers; label: string }[] = [
	{ key: "communityProblem", label: "What community problem are you solving, and who benefits?" },
	{
		key: "dataUsed",
		label: "What data makes the idea possible? Did you create, collect, combine, synthesize or use open data?",
	},
	{
		key: "dataToAction",
		label: "How does your application turn that data into something useful while keeping people informed and in control?",
	},
];
