"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { platformFetch } from "../../../lib/platform/apiUrl";
import { platformRoutes } from "../../../lib/platform/routes";
import {
	getGoogleOAuthClientId,
	mapGoogleOAuthApiError,
} from "../../../lib/platform/googleOAuth";

type GoogleButtonText = "signin_with" | "signup_with" | "continue_with";

type PlatformGoogleSignInButtonProps = {
	redirectTo?: string;
	text?: GoogleButtonText;
};

type UserAuthResponse = {
	user?: { id: string };
	kind?: "user";
};

export function PlatformGoogleSignInButton({
	redirectTo = platformRoutes.home,
	text = "continue_with",
}: PlatformGoogleSignInButtonProps): ReactElement | null {
	const router = useRouter();
	const clientId = getGoogleOAuthClientId();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	if (!clientId) {
		return null;
	}

	async function handleSuccess(response: CredentialResponse): Promise<void> {
		setError(null);

		if (!response.credential) {
			setError("No se recibió credencial de Google");

			return;
		}

		setLoading(true);

		const apiResponse = await platformFetch("/api/auth/oauth/google", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify({ idToken: response.credential }),
		});

		setLoading(false);

		if (!apiResponse.ok) {
			const data = (await apiResponse.json()) as {
				error?: { description?: string; type?: string };
			};
			setError(
				mapGoogleOAuthApiError(
					data.error?.description ?? "Error al iniciar sesión con Google",
					data.error?.type,
				),
			);

			return;
		}

		const data = (await apiResponse.json()) as UserAuthResponse;
		if (data.kind !== "user" || !data.user?.id) {
			setError("Respuesta inválida del servidor");

			return;
		}

		router.push(redirectTo);
		router.refresh();
	}

	return (
		<div
			className="flex flex-col gap-2"
			data-platform-google-sign-in=""
			aria-busy={loading}
		>
			<div className={loading ? "pointer-events-none opacity-60" : undefined}>
				<GoogleLogin
					onSuccess={(response) => void handleSuccess(response)}
					onError={() => setError("No se pudo conectar con Google")}
					useOneTap={false}
					theme="outline"
					size="large"
					text={text}
					shape="rectangular"
					locale="es"
					width={320}
				/>
			</div>
			{error ? <p className="text-sm text-error">{error}</p> : null}
		</div>
	);
}
