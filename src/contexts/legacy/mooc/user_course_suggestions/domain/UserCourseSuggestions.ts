import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { CourseSuggestion, CourseSuggestionPrimitives } from "./CourseSuggestion";
import { UserCourseSuggestionsGenerated } from "./UserCourseSuggestionsGenerated";

export type UserCourseSuggestionsPrimitives = {
	userId: string;
	completedCourseIds: string[];
	suggestions: CourseSuggestionPrimitives[];
};

export class UserCourseSuggestions extends AggregateRoot {
	constructor(
		public readonly userId: string,
		public completedCourseIds: string[],
		public suggestions: CourseSuggestion[],
	) {
		super();
	}

	static fromPrimitives(primitives: UserCourseSuggestionsPrimitives): UserCourseSuggestions {
		return new UserCourseSuggestions(
			primitives.userId,
			Array.isArray(primitives.completedCourseIds) ? primitives.completedCourseIds : [],
			primitives.suggestions.map((s) => CourseSuggestion.fromPrimitives(s)),
		);
	}

	static create(userId: string): UserCourseSuggestions {
		return new UserCourseSuggestions(userId, [], []);
	}

	addCompletedCourse(courseId: string): void {
		this.completedCourseIds.push(courseId);
	}

	hasCompleted(courseId: string): boolean {
		return this.completedCourseIds.includes(courseId);
	}

	/** @deprecated Use completedCourseIds; kept for legacy generators (OpenAI/Mistral) */
	get completedCourses(): string[] {
		return [];
	}

	updateSuggestions(suggestions: CourseSuggestion[]): void {
		this.suggestions = suggestions;

		this.record(
			new UserCourseSuggestionsGenerated(
				this.userId,
				JSON.stringify(suggestions.map((suggestion) => suggestion.toPrimitives())),
			),
		);
	}

	toPrimitives(): UserCourseSuggestionsPrimitives {
		return {
			userId: this.userId,
			completedCourseIds: this.completedCourseIds,
			suggestions: this.suggestions.map((suggestion) => suggestion.toPrimitives()),
		};
	}
}
