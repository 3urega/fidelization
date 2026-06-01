import { Primitives } from "@codelytv/primitives-type";

import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { CourseId } from "./CourseId";

export class Course extends AggregateRoot {
	constructor(
		readonly id: CourseId,
		readonly name: string,
		readonly summary: string,
		readonly categories: string[],
		readonly publishedAt: Date,
	) {
		super();
	}

	static fromPrimitives(primitives: Primitives<Course>): Course {
		const publishedAt =
			primitives.publishedAt instanceof Date
				? primitives.publishedAt
				: new Date(String(primitives.publishedAt));

		return new Course(
			new CourseId(primitives.id),
			primitives.name as string,
			primitives.summary as string,
			primitives.categories as string[],
			publishedAt,
		);
	}

	create(id: string, name: string, summary: string, categories: string[]): Course {
		const publishedAt = new Date();

		return Course.fromPrimitives({
			id,
			name,
			summary,
			categories,
			publishedAt,
		});
	}

	toPrimitives(): Primitives<Course> {
		return {
			id: this.id.value,
			name: this.name,
			summary: this.summary,
			categories: this.categories,
			publishedAt: this.publishedAt,
		};
	}
}
