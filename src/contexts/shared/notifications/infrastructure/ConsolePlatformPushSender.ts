import { Service } from "diod";

import { PlatformPushSender, type PlatformPushSendParams } from "../domain/PlatformPushSender";

@Service()
export class ConsolePlatformPushSender extends PlatformPushSender {
	async send(params: PlatformPushSendParams): Promise<void> {
		console.info("[platform-push-stub]", {
			broadcastId: params.broadcastId,
			userId: params.userId,
			to: params.to,
			subject: params.subject,
			bodyLength: params.body.length,
		});
	}
}
