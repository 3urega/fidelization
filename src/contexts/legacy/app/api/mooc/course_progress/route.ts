import { NextResponse } from "next/server";

import { UserCourseProgressCompleter } from "../../../../contexts/mooc/user_course_progress/application/complete/UserCourseProgressCompleter";
import { CourseSuggestionPrimitives } from "../../../../contexts/mooc/user_course_suggestions/domain/CourseSuggestion";
import { DomainUserFinder } from "../../../../contexts/mooc/users/domain/DomainUserFinder";
import { container } from "../../../../contexts/shared/infrastructure/dependency-injection/diod.config";

const completer = container.get(UserCourseProgressCompleter);
const userFinder = container.get(DomainUserFinder);

export async function POST(request: Request): Promise<NextResponse> {
	const { courseId, userId, courseName } = (await request.json()) as {
		courseId: string;
		userId: string;
		courseName: string;
	};

	await completer.complete(courseId, userId, courseName);

	const user = await userFinder.find(userId);

	const primitives = user.toPrimitives();

	const suggestedCourses =
		primitives.suggestedCourses && primitives.suggestedCourses.trim()
			? (JSON.parse(primitives.suggestedCourses) as CourseSuggestionPrimitives[])
			: [];

	return NextResponse.json({
		name: primitives.name,
		suggestedCourses,
	});
}
