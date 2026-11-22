"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { markShippingRead } from "./shipping-actions";

function ContinueButton({ checked, total }: { checked: number; total: number }) {
	const { pending } = useFormStatus();
	const ready = total > 0 && checked >= total;
	const progress = total ? checked / total : 0;
	return (
		<button
			type="submit"
			disabled={!ready || pending}
			className={`relative min-w-56 overflow-hidden border-2 border-globe-blue px-6 pt-2.5 pb-3 text-[17px] shadow-[4px_4px_0_var(--color-globe-blue)] transition-[transform,box-shadow,background-color,color] enabled:hover:translate-x-[2px] enabled:hover:translate-y-[2px] enabled:hover:shadow-[2px_2px_0_var(--color-globe-blue)] disabled:cursor-default ${
				ready ? "bg-globe-blue text-white" : "bg-white text-globe-blue"
			}`}
		>
			{pending ? "one sec…" : ready ? "got it, let's go →" : `check everything off (${checked}/${total})`}
			{/* Progress bar along the bottom edge, fills as boxes get ticked. */}
			{!ready && (
				<span
					aria-hidden
					className="absolute bottom-0 left-0 h-1 bg-globe-blue transition-[width] duration-150"
					style={{ width: `${Math.round(progress * 100)}%` }}
				/>
			)}
		</button>
	);
}

// Wraps the explainer in a form. Every "ok!" box inside has to be ticked
// before the sticky continue button unlocks the rest of the portal.
export default function ScrollGate({ children }: { children: React.ReactNode }) {
	const form = useRef<HTMLFormElement>(null);
	const [counts, setCounts] = useState({ checked: 0, total: 0 });

	const recount = () => {
		const boxes = form.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="ok"]');
		if (!boxes) return;
		setCounts({ checked: [...boxes].filter((b) => b.checked).length, total: boxes.length });
	};

	useEffect(recount, []);

	return (
		<form ref={form} action={markShippingRead} onChange={recount}>
			{children}
			<div className="sticky bottom-0 -mx-5 mt-4 flex justify-center bg-gradient-to-t from-white via-white/90 to-transparent px-5 pt-10 pb-6 sm:-mx-8">
				<ContinueButton {...counts} />
			</div>
		</form>
	);
}
