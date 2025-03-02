import { HandlerFunction } from "@garycraft/orizuru";
import type { ApplicationContext } from "@src/engine/types/Engine";

const fn: HandlerFunction<ApplicationContext, "Auth"> = async (context, req) => {
	return {
		success: true,
		message: "Authenticated",
		err: false,
		body: {
			player: req.body.args.player,
			identifier: req.body.id,
			name: req.body.args.player.name ?? "Unknown",
		},
		code: 200
	};
}

export default fn;