import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import tailwind from "tailwindcss"
import autoprefixer from "autoprefixer"
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    clearScreen: false,
	css: {
		postcss: {
			plugins: [tailwind({
				config: path.resolve(__dirname, "./tailwind.config.ts"),
			}), autoprefixer()],
		},
	},
	plugins: [vue()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		outDir: '../public',
		emptyOutDir: true,
	},
	server: {
		hmr: {
			port: 5002,
			host: "localhost",
			protocol: "http"
		}
	}
})
