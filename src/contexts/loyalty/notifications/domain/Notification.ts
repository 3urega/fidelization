export type NotificationPrimitives = {
	id: string;
	tenantId: string;
	title: string;
	message: string;
};

export class Notification {
	private constructor(
		public readonly id: string,
		public readonly tenantId: string,
		public readonly title: string,
		public readonly message: string,
	) {}

	static fromPrimitives(primitives: NotificationPrimitives): Notification {
		return new Notification(
			primitives.id,
			primitives.tenantId,
			primitives.title,
			primitives.message,
		);
	}

	toPrimitives(): NotificationPrimitives {
		return {
			id: this.id,
			tenantId: this.tenantId,
			title: this.title,
			message: this.message,
		};
	}
}
