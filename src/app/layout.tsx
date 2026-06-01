import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { StarterNav } from "./_components/StarterNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Next.js + Capacitor Starter",
	description: "Starter point: DDD, identity, billing, Android shell",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}): React.ReactElement {
	return (
		<html lang="es">
			<body className={inter.className}>
				<StarterNav />
				{children}
			</body>
		</html>
	);
}
