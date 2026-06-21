export type PlatformEmailSendParams = {
	broadcastId: string;
	userId: string;
	to: string;
	subject: string;
	body: string;
};

export abstract class PlatformEmailSender {
	abstract send(params: PlatformEmailSendParams): Promise<void>;
}
