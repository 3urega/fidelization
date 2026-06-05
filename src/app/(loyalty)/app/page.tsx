import { redirect } from "next/navigation";

/** Middleware redirects /app → /app/welcome or /app/card; this is a fallback. */
export default function LoyaltyAppIndexPage(): never {
	redirect("/app/welcome");
}
