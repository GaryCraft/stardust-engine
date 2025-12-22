import fs from 'fs';

// Simplified, cross-platform permission utilities.
// We avoid spawning external commands and rely on fs.stat where possible.

export const isAccessible = (path: string): boolean => {
	try {
		fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK);
		return true;
	} catch {
		return false;
	}
};

export const isSecure = (path: string): boolean => {
	// On Windows, return true (POSIX permission bits are not meaningful)
	if (process.platform === 'win32') return true;
	try {
		const st = fs.statSync(path);
		const mode = st.mode & 0o777;
		// Consider secure if group/others do NOT have write permission: (002 or 020)
		// This is a conservative simple check that avoids world/group-writable configs
		return (mode & 0o022) === 0;
	} catch {
		// If we cannot stat, treat as insecure to be safe
		return false;
	}
};
