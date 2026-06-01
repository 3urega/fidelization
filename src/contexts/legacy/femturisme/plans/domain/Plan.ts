import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { PlanId } from "./PlanId";

export type PlanPrimitives = {
	id: string;
	title: string;
	description: string;
	location: string | null;
	url: string | null;
	tags: string[];
	childrenFriendly: boolean | null;
	vehicleRequired: boolean | null;
	overnightPossible: boolean | null;
};

export class Plan extends AggregateRoot {
	constructor(
		readonly id: PlanId,
		readonly title: string,
		readonly description: string,
		readonly location: string | null,
		readonly url: string | null,
		readonly tags: string[],
		readonly childrenFriendly: boolean | null,
		readonly vehicleRequired: boolean | null,
		readonly overnightPossible: boolean | null,
	) {
		super();
	}

	static fromPrimitives(primitives: PlanPrimitives): Plan {
		return new Plan(
			new PlanId(primitives.id),
			primitives.title,
			primitives.description,
			primitives.location,
			primitives.url,
			primitives.tags,
			primitives.childrenFriendly,
			primitives.vehicleRequired,
			primitives.overnightPossible,
		);
	}

	toPrimitives(): PlanPrimitives {
		return {
			id: this.id.value,
			title: this.title,
			description: this.description,
			location: this.location,
			url: this.url,
			tags: this.tags,
			childrenFriendly: this.childrenFriendly,
			vehicleRequired: this.vehicleRequired,
			overnightPossible: this.overnightPossible,
		};
	}
}
