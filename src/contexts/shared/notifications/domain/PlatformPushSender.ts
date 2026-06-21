export type PlatformPushSendParams = {
	broadcastId: string;
	userId: string;
	to: string;
	subject: string;
	body: string;
};

export abstract class PlatformPushSender {
	abstract send(params: PlatformPushSendParams): Promise<void>;
}
