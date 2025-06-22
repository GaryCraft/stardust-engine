import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/Index.vue'

const routes = [
	{
		path: '/',
		component: Index,
		name: 'Index'
	},
	{
		path: '/stardust',
		component: () => import('@/pages/stardust.vue'),
		name: 'stardust'
	},
]

export const router = createRouter({
	history: createWebHistory('/'),
	routes,
})