"use client";

import { useState } from "react";

// A block of text with a "copy" button, for the README template.
export default function CopyBlock({ text, label }: { text: string; label: string }) {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard blocked: the text is still selectable by hand.
		}
	};

	return (
		<div className="border-2 border-globe-blue bg-white">
			<div className="flex items-center justify-between border-b-2 border-globe-blue bg-globe-blue px-3 py-1 text-[14px] text-white">
				<span>{label}</span>
				<button
					type="button"
					onClick={copy}
					className="bg-white px-2 text-globe-blue hover:bg-deep-ink hover:text-white"
				>
					{copied ? "copied!" : "copy"}
				</button>
			</div>
			<pre className="max-h-80 overflow-auto p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">{text}</pre>
		</div>
	);
}
