<template>
	<div class="flex flex-row items-center justify-around p-2">
		<div class="flex flex-row h-full items-center text-center">
			<h1>stardust-engine</h1>
		</div>
		<nav class="flex justify-center">
			<ul class="flex space-x-4">
				<!-- <li><router-link to="/">Home</router-link></li>
				<li><router-link to="/about">About</router-link></li>
				<li><router-link to="/contact">Contact</router-link></li> -->
				<router-link v-for="route in routes" :key="route.path" class="border p-2 rounded-md" :to="route.path">
					{{ route.name }}
				</router-link>
			</ul>
		</nav>
		<div class="hidden">
			<ColorMode />
		</div>
	</div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import ColorMode from './util/ColorMode.vue';
const router = useRouter();

const routes = router.getRoutes();

</script>