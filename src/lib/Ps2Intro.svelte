<script lang="ts">
	import { onMount, createEventDispatcher } from "svelte";

	const KEY = "ps2IntroSeen";
	const dispatch = createEventDispatcher();

	onMount(() => {
		try {
			// Marcamos como visto para siempre
			localStorage.setItem(KEY, "1");
		} catch {
			/* ignore */
		}
		// Avisamos al contenedor de que la intro ha "terminado"
		dispatch("done");
	});
</script>