<script>
	import Circles from '../lib/components/Circles.svelte';
	import FaucetForm from '../lib/components/FaucetForm.svelte';
</script>

<main class="relative min-h-screen overflow-hidden bg-zinc-950">
	<a href="https://pendulumchain.org/amplitude" target="_blank" rel="noreferrer">
		<img src="amplitude_logo.svg" alt="Foucoco logo" class="w-1/2 pt-5 pl-5 md:w-2/12" />
	</a>
	<Circles />
	<section class="flex items-center justify-center mt-10">
		<article
			class="relative z-50 flex flex-col items-center max-w-3xl px-20 py-10 bg-zinc-800 rounded-2xl"
		>
			<h1 class="text-4xl font-bold text-center text-gray-200">Foucoco Faucet</h1>
			<p class="mt-2 text-center text-zinc-400">Get AMPE tokens for Foucoco parachain</p>
			<FaucetForm />
		</article>
	</section>
</main>
