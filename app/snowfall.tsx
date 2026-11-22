// Falling snowflakes for the sign-in screen. Every value is derived from the
// index (never Math.random) so the server and the client render the same
// flakes — same approach as snowglobe's hero.
const COLUMNS = 18;

const flakes = Array.from({ length: COLUMNS * 2 }, (_, i) => {
	const column = i % COLUMNS;
	const secondStream = i >= COLUMNS;
	const duration = 11 + (column % 5) * 1.6;
	const stagger = (((column * 7) % COLUMNS) / COLUMNS) * duration;
	return {
		left: `${2 + column * (96 / (COLUMNS - 1))}%`,
		size: 12 + ((column * 7) % 5) * 4,
		duration,
		delay: stagger + (secondStream ? duration / 2 : 0),
		drift: `${((column % 4) - 1.5) * 2.5}rem`,
		opacity: 0.45 + ((column * 3) % 4) * 0.1,
	};
});

export default function Snowfall() {
	return (
		<div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
			{flakes.map((flake, i) => (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					key={i}
					src="/imgs/snowflake.png"
					alt=""
					width={flake.size}
					height={flake.size}
					className="snowflake"
					style={
						{
							left: flake.left,
							"--snow-duration": `${flake.duration}s`,
							"--snow-delay": `-${flake.delay}s`,
							"--snow-drift": flake.drift,
							"--snow-opacity": flake.opacity,
						} as React.CSSProperties
					}
				/>
			))}
		</div>
	);
}
