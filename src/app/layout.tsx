import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "./_components/theme/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
	title: "Fidelización",
	description: "Plataforma SaaS de fidelización para cafés y hostelería",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}): React.ReactElement {
	return (
		<html lang="es" className={inter.variable}>
			<body className="min-h-screen font-sans antialiased">
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
