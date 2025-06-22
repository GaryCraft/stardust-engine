<template>
	<div>
		<div class="logo">
			<h1>stardust-engine</h1>
		</div>
		<nav class="flex justify-center">
			<ul class="flex space-x-4">
				<!-- <li><router-link to="/">Home</router-link></li>
				<li><router-link to="/about">About</router-link></li>
				<li><router-link to="/contact">Contact</router-link></li> -->
				<li v-for="route in routes" :key="route.path">
					<router-link :to="route.path">{{ route.name }}</router-link>
				</li>
			</ul>
		</nav>
		<ColorMode />
	</div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import ColorMode from './util/ColorMode.vue';
const router = useRouter();

const routes = router.getRoutes();

</script>