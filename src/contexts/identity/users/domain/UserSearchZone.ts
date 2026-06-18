import { Coordinates } from "../../../shared/geocoding/domain/Coordinates";
import { InvalidUserSearchZone } from "./InvalidUserSearchZone";

export type UserSearchZonePrimitives = {
	label: string;
	latitude: number;
	longitude: number;
	updatedAt: string;
};

const MAX_LABEL_LENGTH = 200;

function assertValidLabel(label: string): string {
	const trimmed = label.trim();

	if (!trimmed) {
		throw new InvalidUserSearchZone("label is required");
	}

	if (trimmed.length > MAX_LABEL_LENGTH) {
		throw new InvalidUserSearchZone(`label must be at most ${MAX_LABEL_LENGTH} characters`);
	}

	return trimmed;
}

export class UserSearchZone {
	private constructor(
		public readonly label: string,
		public readonly coordinates: Coordinates,
		public readonly updatedAt: Date,
	) {}

	static create(label: string, latitude: number, longitude: number, updatedAt = new Date()): UserSearchZone {
		return new UserSearchZone(
			assertValidLabel(label),
			Coordinates.fromPrimitives({ latitude, longitude }),
			updatedAt,
		);
	}

	static fromPrimitives(primitives: UserSearchZonePrimitives): UserSearchZone {
		return new UserSearchZone(
			assertValidLabel(primitives.label),
			Coordinates.fromPrimitives({
				latitude: primitives.latitude,
				longitude: primitives.longitude,
			}),
			new Date(primitives.updatedAt),
		);
	}

	toPrimitives(): UserSearchZonePrimitives {
		const coords = this.coordinates.toPrimitives();

		return {
			label: this.label,
			latitude: coords.latitude,
			longitude: coords.longitude,
			updatedAt: this.updatedAt.toISOString(),
		};
	}
}
