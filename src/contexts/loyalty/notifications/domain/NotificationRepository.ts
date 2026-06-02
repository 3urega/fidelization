import { Notification } from "./Notification";

export abstract class NotificationRepository {
	abstract save(notification: Notification): Promise<void>;

	abstract searchById(tenantId: string, id: string): Promise<Notification | null>;
}
