import { getAppContext } from "@src/engine/utils/Composable";
import { debug, info, warn } from "@src/engine/utils/Logger";
import type { Request, Response } from "express";
const TWITCH_SUBSCRIBE_API_URL = "https://api.twitch.tv/helix/eventsub/subscriptions";
const TYPES_TWITCH_ALLOWED_MESSAGE = ["stream.online"];
const TYPE_TWITCH_STREAM_LIVE = "live";
export const callbackHandler = async (req: Request, res: Response) => {
	if (!req.body || !req.body.challenge)
		return res.status(400).json({ err: true, code: 400, message: "Bad Request!" });
	getAppContext().events.emit("modules:twitch:challenge_received", req.body.challenge);
	res.status(200).send(req.body.challenge);
};
export const doWebhookBehavior = async (req: Request, res: Response) => {
	if (!req.body || !req.body.subscription || !req.body.event)
		return res.status(400).json({ err: true, code: 400, message: "Bad Request!" });
	if (!req.body.subscription || !req.body.event)
		return res.status(400).json({ err: true, code: 400, message: "Bad Request!" });
	if (!req.body.subscription.type || !req.body.event.type)
		return res.status(400).json({ err: true, code: 400, message: "Bad Request!" });
	res.status(200).json({ error: false, code: 200, message: "Event Received!" });
	if (!TYPES_TWITCH_ALLOWED_MESSAGE.includes(req.body.subscription.type))
		return warn("Received a webhook event for an unknown event!");
	const broadcaster_uid = process.env.TWITCH_BROADCASTER_UID || "0";
	if (req.body.event.broadcaster_user_id !== broadcaster_uid)
		return warn("Received a webhook event for a different broadcaster!");
	if (req.body.event.type === TYPE_TWITCH_STREAM_LIVE) {
		getAppContext().events.emit("modules:twitch:stream_started", req.body.event);
	}
	else {
		info("Twitch Notification Received but not handled");
		debug(req.body);
	}
};
export const subscribeTo = async () => {
};
