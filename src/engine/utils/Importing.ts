// Use namespace import to be robust across CJS/ESM/Bun compile default interop
import * as findRecursiveNs from "@spaceproject/findrecursive";
type Validator<T> = (imported: unknown, file: string, dir: string) => imported is T | null;
type Loader<T> = (imported: T, file: string, dir: string) => void;
export async function useImporter<T>(file: string, dir: string, validator: Validator<T>, loader: Loader<T>) {
	const imported = (await import(`${dir}/${file}`)).default;
	const validated = validator(imported, file, dir);
	if (!validated) {
		return null;
	}
	loader(imported as T, file, dir);
	return imported;
}
export async function useImporterRecursive<T>(dir: string, validator: Validator<T>, loader: Loader<T>, middleware?: (file: string, dir: string) => void) {

	// TODO: optimize
	// Normalize default export vs namespace export (Bun compile may wrap default differently)
	const unwrapDefault = (m: any) => {
		let v = m;
		// unwrap up to a few times to handle nested default wrappers
		for (let i = 0; i < 5; i++) {
			if (typeof v === "function") return v;
			if (v && typeof v.default !== "undefined") v = v.default;
			else break;
		}
		return v;
	};
	const findRecursive = unwrapDefault(findRecursiveNs) as unknown as (d: string) => Promise<[string, string][]>;
	if (typeof findRecursive !== "function") {
		throw new TypeError("@spaceproject/findrecursive export is not callable after interop normalization");
	}
	const files = await findRecursive(dir);
	for (const [file, dir] of files) {
		if (middleware) {
			middleware(file, dir);
		}
		await useImporter(file, dir, validator, loader);
	}
}