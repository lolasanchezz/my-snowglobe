import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	turbopack: { root: __dirname },
	// Pages that were removed; send old links and bookmarks to /info.
	async redirects() {
		return ["/room", "/schedule", "/schedule/edit"].map((source) => ({
			source,
			destination: "/info",
			permanent: false,
		}));
	},
};

export default nextConfig;
