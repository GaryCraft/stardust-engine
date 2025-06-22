import { info } from "../utils/Logger";
import { declareTypings } from "../utils/TypingsGen";

export default async function() {
	declareTypings();
	info("Ready");
}