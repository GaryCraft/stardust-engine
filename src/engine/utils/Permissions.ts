import fs from 'fs';



export const isAccessible = (path: string): boolean => {
	try {
		fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
		return true;
	} catch {
		return false;
	}
};

export const isSecure = (path: string): boolean => {

	if (process.platform === 'win32') return true;
	try {
		const st = fs.statSync(path);
		const mode = st.mode & 0o777;

		return (mode & 0o022) === 0;
	} catch {

		return false;
	}
};
