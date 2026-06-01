export abstract class DomainError extends Error {
	abstract type: string;
	abstract message: string;

	toPrimitives(): {
		type: string;
		description: string;
		data: Record<string, unknown>;
	} {
		const props = Object.entries(this).filter(([key]) => key !== "type" && key !== "message");

		return {
			type: this.type,
			description: this.message,
			data: props.reduce<Record<string, unknown>>((acc, [key, value]) => {
				return {
					...acc,
					[key]: value as unknown,
				};
			}, {}),
		};
	}
}
