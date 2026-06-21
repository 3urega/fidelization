import { Service } from "diod";

import { PlatformEmailSender, type PlatformEmailSendParams } from "../domain/PlatformEmailSender";

@Service()
export class ConsolePlatformEmailSender extends PlatformEmailSender {
	async send(params: PlatformEmailSendParams): Promise<void> {
		console.info("[platform-email]", {
			broadcastId: params.broadcastId,
			userId: params.userId,
			to: params.to,
			subject: params.subject,
			bodyLength: params.body.length,
		});
	}
}
