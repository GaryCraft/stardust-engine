import I18nConfig from "@src/config/modules/i18n";
import Module, { getModule } from "@src/engine/modules";
import { getAppContext } from "@src/engine/utils/Composable";
import { debug, warn } from "@src/engine/utils/Logger";
import { getProcessPath } from "@src/engine/utils/Runtime";
import { EventEmitter } from "node:events";
import { readdir } from "fs/promises";
import i18next, { i18n, TFunction } from "i18next";
import Backend, { FsBackendOptions } from 'i18next-fs-backend';
import path from "path";
const ReboundEvents = [
	"initialized",
	"languageChanged",
	"loaded",
	"failedLoading",
	"missingKey",
] as const;
export class I18nModule extends EventEmitter {
	private i18n: i18n;
	private fixedTranslators: Map<string, TFunction> = new Map();
	constructor() {
		super();
		this.i18n = i18next.createInstance();
		for (const event of ReboundEvents) {
			this.i18n.on(event, (...args) => {
				this.emit(event, ...args);
			});
		}
	}
	async initialize(config: I18nConfig) {
		const langs = await readdir(path.join(getProcessPath(), "/lang"));
		const namespaces = await Promise.all(langs.map(async (lang) => {
			const ns = await readdir(path.join(getProcessPath(), `/lang/${lang}`));
			return ns.map(n => n.split(".")[0]);
		}));
		const allNamespaces = Array.from(new Set(namespaces.flat()));
		await this.i18n
			.use(Backend)
			.init<FsBackendOptions>({
				saveMissing: true,
				saveMissingPlurals: true,
				fallbackLng: config.baseLanguage,
				ns: allNamespaces,
				defaultNS: "default",
				backend: {
					loadPath: path.join(getProcessPath(), "/lang/{{lng}}/{{ns}}.json"),
					addPath: path.join(getProcessPath(), "/lang/{{lng}}/{{ns}}.missing.json"),
				}
			});
	}
	translateTo(key: string, lang: string, opts?: any) {
		let translator = this.fixedTranslators.get(lang);
		if (!translator) {
			translator = this.i18n.getFixedT(lang);
			this.fixedTranslators.set(lang, translator);
		}
		return translator(key, opts);
	}
	t(key: string, opts?: any) {
		return this.i18n.t(key, opts);
	}
}
export function tt(key: string, lang: string, opts?: any) {
	const module = getModule<I18nModule>("i18n");
	if (!module) {
		warn("i18n module not found");
		return key;
	}
	return module.translateTo(key, lang, opts);
}
export function t(key: string, opts?: any) {
	const module = getModule<I18nModule>("i18n");
	if (!module) {
		warn("i18n module not found");
		return key;
	}
	return module.t(key, opts);
}
