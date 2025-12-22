import { HTTPRouteHandler } from "@src/engine/types/Executors";
import { info } from "@src/engine/utils/Logger";
import { callbackHandler, doWebhookBehavior } from "../eventsub";
const TYPE_TWITCH_CHANNEL_MESSAGE = "webhook_callback_verification";
const TYPE_TWITCH_NOTIFICATION_MESSAGE = "notification";
const HEADER_TWITCH_MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type'.toLowerCase();
const HEADER_TWITCH_MESSAGE_TIMESTAMP = 'Twitch-Eventsub-Message-Timestamp'.toLowerCase();
const HEADER_TWITCH_MESSAGE_SIGNATURE = 'Twitch-Eventsub-Message-Signature'.toLowerCase();
const HMAC_PREFIX = 'sha256=';
export default {
	async get(req, res) {
		res.status(404).json({ err: true, code: 404, message: "Not found!" });
	},
	async post(req, res) {
		if (!req.headers[HEADER_TWITCH_MESSAGE_TYPE]) {
			res.status(400).json({ err: true, code: 400, message: "Bad Request!" });
			return;
		}
		if (req.headers[HEADER_TWITCH_MESSAGE_TYPE] === TYPE_TWITCH_NOTIFICATION_MESSAGE) {
			info("Twitch Notification Received");
			doWebhookBehavior(req, res);
		}
		else if (req.headers[HEADER_TWITCH_MESSAGE_TYPE] === TYPE_TWITCH_CHANNEL_MESSAGE) {
			info("Twitch Challenge Received");
			callbackHandler(req, res);
		}
		else {
			res.status(400).json({ err: true, code: 400, message: "Bad Request!" });
		}
	}
} satisfies HTTPRouteHandler;