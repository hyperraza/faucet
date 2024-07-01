<script>
	let address = '';
	let message = '';

	async function handleSubmit(event) {
		event.preventDefault();
		message = '';

		try {
			const response = await fetch(`/fund?to=${encodeURIComponent(address)}`);

			if (response.ok) {
				message = 'Funds sent successfully';
			} else {
				const errorMessage = await response.text();
				message = 'Error: ' + errorMessage;
			}
		} catch (error) {
			message = 'An error occurred. Please try again later.';
		}
	}
</script>

<main class="relative min-h-screen overflow-hidden bg-zinc-950">
	<a href="https://pendulumchain.org/amplitude" target="_blank" rel="noreferrer">
		<img src="amplitude_logo.svg" alt="Foucoco logo" class="w-1/2 pt-5 pl-5 md:w-2/12" />
	</a>
	<img
		src="circle.svg"
		alt="just circle"
		class="absolute right-0 hidden scale-150 md:block top-3"
	/>
	<img
		src="circle.svg"
		alt="just circle"
		class="absolute hidden scale-125 md:block -right-3 top-1/2"
	/>
	<img src="circle.svg" alt="just circle" class="absolute bottom-2 left-5" />
	<img
		src="circle.svg"
		alt="just circle"
		class="absolute hidden scale-125 md:block -left-3 top-1/2"
	/>
	<img src="circle.svg" alt="just circle" class="absolute hidden left-1/2 md:block top-1/2" />
	<img src="circle.svg" alt="just circle" class="absolute scale-150 right-1/2 top-2/3" />
	<section class="flex items-center justify-center mt-10">
		<article
			class="relative z-50 flex flex-col items-center max-w-3xl px-20 py-10 bg-zinc-800 rounded-2xl"
		>
			<h1 class="text-4xl font-bold text-center text-gray-200">Foucoco Faucet</h1>
			<p class="mt-2 text-center text-zinc-400">Get AMPE tokens for Foucoco parachain</p>
			<form class="mt-5 text-lg" on:submit={handleSubmit}>
				<label for="foucoco_address" class="text-gray-200">Foucoco address</label>
				<input
					type="text"
					placeholder="2fa9..."
					bind:value={address}
					required
					class="w-full px-2 py-1 text-xl text-gray-200 border rounded bg-inherit md:min-w-96"
					id="foucoco_address"
				/>
				<button
					type="submit"
					class="w-full px-8 py-2 mt-4 font-bold text-white transition rounded-full bg-emerald-500 hover:bg-emerald-700"
					>GET some AMPE</button
				>
			</form>
			{#if message}
				<p
					class="w-full max-w-3xl mt-4 text-sm text-center text-red-500 break-words whitespace-pre-line"
				>
					{message}
				</p>
			{/if}
		</article>
	</section>
</main>
