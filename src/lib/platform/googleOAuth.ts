/** Server or build-time: whether Google Sign-In is configured for the platform app. */
export function isGoogleOAuthConfigured(): boolean {
	const publicId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
	const serverId = process.env.GOOGLE_CLIENT_ID?.trim();

	return Boolean(publicId || serverId);
}

/** Client-side Web client ID for GIS (must be NEXT_PUBLIC_*). */
export function getGoogleOAuthClientId(): string | undefined {
	const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

	return clientId === "" ? undefined : clientId;
}

export function mapGoogleOAuthApiError(description: string, type?: string): string {
	if (type === "InvalidGoogleToken") {
		return "No se pudo validar la sesión de Google. Inténtalo de nuevo.";
	}

	if (type === "OAuthAccountAlreadyLinked") {
		return "Este email ya está vinculado a otra cuenta de Google.";
	}

	if (type === "PlatformUserCannotUseUserLogin") {
		return "Esta cuenta no puede usar la app. Usa el panel de plataforma.";
	}

	return description;
}
