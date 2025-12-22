const EVENTSUB_WEBHOOK_HEADERS = {
	MESSAGE_ID: "Twitch-Eventsub-Message-Id",
	MESSAGE_RETRY: "Twitch-Eventsub-Message-Retry",
	MESSAGE_TYPE: "Twitch-Eventsub-Message-Type",
	MESSAGE_SIGNATURE: "Twitch-Eventsub-Message-Signature",
	MESSAGE_TIMESTAMP: "Twitch-Eventsub-Message-Timestamp",
	MESSAGE_SUBSCRIPTION_TYPE: "Twitch-Eventsub-Subscription-Type",
	MESSAGE_SUBSCRIPTION_VERSION: "Twitch-Eventsub-Subscription-Version",
} as const;
const EVENTSUB_WEBHOOK_MESSAGE_TYPES = {
	NOTIFICATION: "notification",
	REVOCATION: "revocation",
	CHALLENGE: "webhook_callback_verification",
} as const;
const EVENTSUB_WEBHOOK_MESSAGE_SIGNATURE_PREFIX = "sha256=";
const EVENTSUB_SUBSCRIPTION_TYPES = {
	AUTOMOD_MESSAGE_HOLD: {
		name: "automod.message.hold",
	},
	AUTOMOD_MESSAGE_UPDATE: {
		name: "automod.message.update",
	},
	AUTOMOD_SETTINGS_UPDATE: {
		name: "automod.settings.update",
	},
	AUTOMOD_TERMS_UPDATE: {
		name: "automod.terms.update",
	},
	CHANNEL_UPDATE: {
		name: "channel.update",
	},
	CHANNEL_FOLLOW: {
		name: "channel.follow",
	},
	CHANNEL_AD_BREAK_BEGIN: {
		name: "channel.ad_break.begin",
	},
	CHANNEL_CHAT_CLEAR: {
		name: "channel.chat.clear",
	},
	CHANNEL_CHAT_CLEAR_USER: {
		name: "channel.chat.clear_user_messages",
	},
	CHANNEL_CHAT_MESSAGE: {
		name: "channel.chat.message",
	},
	CHANNEL_CHAT_MESSAGE_DELETE: {
		name: "channel.chat.message.delete",
	},
	CHANNEL_CHAT_NOTIFICATION: {
		name: "channel.chat.notification",
	},
	CHANNEL_CHAT_SETTINGS_UPDATE: {
		name: "channel.chat_settings.update",
	},
	CHANNEL_CHAT_USER_MESSAGE_HOLD: {
		name: "channel.chat.user_message_hold",
	},
	CHANNEL_CHAT_USER_MESSAGE_UPDATE: {
		name: "channel.chat.user_message_update",
	},
	CHANNEL_SUBSCRIBE: {
		name: "channel.subscribe",
	},
	CHANNEL_SUBSCRIPTION_END: {
		name: "channel.subscription.end",
	},
	CHANNEL_SUBSCRIPTION_GIFT: {
		name: "channel.subscription.gift",
	},
	CHANNEL_SUBSCRIPTION_MESSAGE: {
		name: "channel.subscription.message",
	},
	CHANNEL_CHEER: {
		name: "channel.cheer",
	},
	CHANNEL_RAID: {
		name: "channel.raid",
	},
	CHANNEL_BAN: {
		name: "channel.ban",
	},
	CHANNEL_UNBAN: {
		name: "channel.unban",
	},
	CHANNEL_UNBAN_REQUEST_CREATE: {
		name: "channel.unban_request.create",
	},
	CHANNEL_UNBAN_REQUEST_RESOLVE: {
		name: "channel.unban_request.resolve",
	},
	CHANNEL_MODERATE: {
		name: "channel.moderate",
	},
	CHANNEL_MODERATOR_ADD: {
		name: "channel.moderator.add",
	},
	CHANNEL_MODERATOR_REMOVE: {
		name: "channel.moderator.remove",
	},
	CHANNEL_GUEST_STAR_SESSION_BEGIN: {
		name: "channel.guest_star_session.begin",
	},
	CHANNEL_GUEST_STAR_SESSION_END: {
		name: "channel.guest_star_session.end",
	},
	CHANNEL_GUEST_STAR_GUEST_UPDATE: {
		name: "channel.guest_star_guest.update",
	},
	CHANNEL_GUEST_STAR_SETTINGS_UPDATE: {
		name: "channel.guest_star_settings.update",
	},
	CHANNEL_POINTS_AUTOMATIC_REWARD_REDEMTION: {
		name: "channel.channel_points_automatic_reward_redemption.add",
	},
	CHANNEL_POINTS_CUSTOM_REWARD_ADD: {
		name: "channel.channel_points_custom_reward.add",
	},
	CHANNEL_POINTS_CUSTOM_REWARD_UPDATE: {
		name: "channel.channel_points_custom_reward.update",
	},
	CHANNEL_POINTS_CUSTOM_REWARD_REMOVE: {
		name: "channel.channel_points_custom_reward.remove",
	},
	CHANNEL_POINTS_CUSTOM_REWARD_REDEMPTION_ADD: {
		name: "channel.channel_points_custom_reward_redemption.add",
	},
	CHANNEL_POINTS_CUSTOM_REWARD_REDEMPTION_UPDATE: {
		name: "channel.channel_points_custom_reward_redemption.update",
	},
	CHANNEL_POLL_BEGIN: {
		name: "channel.poll.begin",
	},
	CHANNEL_POLL_PROGRESS: {
		name: "channel.poll.progress",
	},
	CHANNEL_POLL_END: {
		name: "channel.poll.end",
	},
	CHANNEL_PREDICTION_BEGIN: {
		name: "channel.prediction.begin",
	},
	CHANNEL_PREDICTION_PROGRESS: {
		name: "channel.prediction.progress",
	},
	CHANNEL_PREDICTION_LOCK: {
		name: "channel.prediction.lock",
	},
	CHANNEL_PREDICTION_END: {
		name: "channel.prediction.end",
	},
	CHANNEL_SUSPICIOUS_USER_MESSAGE: {
		name: "channel.suspicious_user.message",
	},
	CHANNEL_SUSPICIOUS_USER_UPDATE: {
		name: "channel.suspicious_user.update",
	},
	CHANNEL_VIP_ADD: {
		name: "channel.vip.add",
	},
	CHANNEL_VIP_REMOVE: {
		name: "channel.vip.remove",
	},
	GOAL_BEGIN: {
		name: "channel.goal.begin",
	},
	GOAL_PROGRESS: {
		name: "channel.goal.progress",
	},
	GOAL_END: {
		name: "channel.goal.end",
	},
	HYPE_TRAIN_BEGIN: {
		name: "channel.hype_train.begin",
	},
	HYPE_TRAIN_PROGRESS: {
		name: "channel.hype_train.progress",
	},
	HYPE_TRAIN_END: {
		name: "channel.hype_train.end",
	},
	SHIELD_MODE_BEGIN: {
		name: "channel.shield_mode.begin",
	},
	SHIELD_MODE_END: {
		name: "channel.shield_mode.end",
	},
	SHOUTOUT_CREATE: {
		name: "channel.shoutout.create",
	},
	SHOUTOUT_RECEIVED: {
		name: "channel.shoutout.receive",
	},
	CHARITY_DONATION: {
		name: "channel.charity_campaign.donate",
	},
	CHARITY_CAMPAIGN_START: {
		name: "channel.charity_campaign.start",
	},
	CHARITY_CAMPAIGN_PROGRESS: {
		name: "channel.charity_campaign.progress",
	},
	CHARITY_CAMPAIGN_STOP: {
		name: "channel.charity_campaign.stop",
	},
	CONDUIT_SHARD_DISABLED: {
		name: "conduit.shard.disabled",
	},
	DROP_ENTITLEMENT_GRANT: {
		name: "drop.entitlement.grant",
	},
	EXTENSION_BITS_TRANSACTION_CREATE: {
		name: "extension.bits_transaction.create",
	},
	STREAM_OFFLINE: {
		name: "stream.offline",
	},
	STREAM_ONLINE: {
		name: "stream.online",
	},
	USER_AUTH_GRANT: {
		name: "user.authorization.grant",
	},
	USER_AUTH_REVOKE: {
		name: "user.authorization.revoke",
	},
	USER_UPDATE: {
		name: "user.update",
	},
	USER_WHISPER_RECEIVED: {
		name: "user.whisper.message",
	},
} as const;
const EVENTSUB_SUBSCRIPTION_NAMES = Object.values(EVENTSUB_SUBSCRIPTION_TYPES).map((v) => v.name);
type EventSubscriptionName = typeof EVENTSUB_SUBSCRIPTION_NAMES[number];
interface BaseEventSubSubscriptionRequest<T extends EventSubscriptionName = EventSubscriptionName> {
	type: typeof EVENTSUB_SUBSCRIPTION_NAMES[number];
	version: string;
	condition: {};
	transport: {
		methods: string[];
		callback?: string;
		secret?: string;
	};
	session_id?: string;
	conduit_id?: string;
}
type EventSubSubscriptionRequest = BaseEventSubSubscriptionRequest & BaseEventSubSubscriptionRequest['type'] extends EventSubscriptionName ? BaseEventSubSubscriptionRequest['type'] : never;
