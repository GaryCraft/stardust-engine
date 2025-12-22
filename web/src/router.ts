import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/Index.vue'

const routes = [
	{
		path: '/',
		component: Index,
		name: 'Application'
	},
	{
		path: '/stardust',
		component: () => import('@/pages/stardust.vue'),
		name: 'Dashboard'
	},
]

export const router = createRouter({
	history: createWebHistory('/'),
	routes,
})