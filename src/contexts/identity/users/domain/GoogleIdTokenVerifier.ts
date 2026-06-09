import { GoogleIdTokenClaims } from "./GoogleIdTokenClaims";

export abstract class GoogleIdTokenVerifier {
	abstract verify(idToken: string): Promise<GoogleIdTokenClaims>;
}
