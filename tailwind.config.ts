import type { Config } from "tailwindcss";

const config: Config = {
	content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		extend: {
			colors: {
				primary: "var(--color-primary)",
				secondary: "var(--color-secondary)",
				background: "var(--color-background)",
				foreground: "var(--color-foreground)",
				muted: "var(--color-muted)",
				border: "var(--color-border)",
				error: "var(--color-error)",
				"primary-foreground": "var(--color-primary-foreground)",
				"map-establishment": "var(--color-map-establishment)",
				"map-establishment-foreground": "var(--color-map-establishment-foreground)",
			},
			borderRadius: {
				theme: "var(--border-radius)",
			},
			fontFamily: {
				sans: ["var(--font-family)"],
			},
		},
	},
	plugins: [],
};

export default config;
