<script setup lang="ts">
import Axios from "axios"
import { BaklavaEditor, useBaklava } from "@baklavajs/renderer-vue";
import "@baklavajs/themes/dist/classic.css";
import { onBeforeUnmount, onMounted } from "vue";
import Nodes from "@/lib/graph-engine/defaultNodes";
import { type IEditorState } from "baklavajs";
import NavBar from "@/components/NavBar.vue";

const baklava = useBaklava();


async function fetchNodes() {
	const availableNodes = await Axios.get("/graph-engine/nodes")
	console.debug(availableNodes)
}

async function saveState(state: IEditorState) {
	/* console.debug(state)
	console.debug(JSON.stringify(state)) */
}

let intervalhandle: NodeJS.Timeout | null = null

onMounted(() => {
	//fetchNodes()
	for (const node of Nodes) {
		baklava.editor.registerNodeType(node);
	}
	intervalhandle = setInterval(() => { saveState(baklava.editor.save()) }, 5000)
})

onBeforeUnmount(() => {
	clearInterval(intervalhandle ?? undefined)
})

</script>
<template>
	<div class="w-full h-[100vh]">
		<NavBar/>
		<BaklavaEditor :view-model="baklava" />
	</div>
</template>