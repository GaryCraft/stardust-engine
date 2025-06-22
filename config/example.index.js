// @ts-check
/** @typedef {import('../src/config/index.ts').default} DefinedConfig */
/** @type {DefinedConfig} */
module.exports = {
	// Database
	database: {
		// Either 'sqlite' or 'mysql'
		type: "sqlite",
		// Ignored if type is 'sqlite'
		database: "database",
		// MySQL Specific Settings
		host: "localhost",
		port: 3306,
		user: "root",
		password: "password",
		// Other Settings
		sync: false,
		logging: false,
	},
	// HTTP Server
	http: {
		port: 5000,
	},
	modules: {
		discord: {
			prefix: "!",
			token: process.env.DISCORD_TOKEN,
			activity: {
				type: "PLAYING",
				name: "stardust-engine development",
			},
			admins: [],
			defaultEmbedColor: "FFFFFF",
		},
		//$StripStart
		i18n: {
			baseLanguage: "en",
		},
		orizuru: {
			serverName: "Orizuru",
		},
		web_from_git: {
			enabled: false,
			gitRepo: "",
			gitSecret: "",
			gitUser: "",
		},
		//$StripEnd
	},
};