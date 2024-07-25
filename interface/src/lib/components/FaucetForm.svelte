<script lang="ts">
	let address = '';
	let message = '';
	let isPending = false;

	async function handleSubmit(event: Event) {
		event.preventDefault();
		message = '';
		isPending = true;

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
		} finally {
			isPending = false;
		}
	}
</script>

<form autocomplete="off" class="mt-5 text-lg" on:submit={handleSubmit}>
    <label for="foucoco_address" class="text-gray-200">Foucoco address</label>
    <input
        type="text"
        placeholder="2fa9..."
        required
        class="w-full px-2 py-1 text-xl text-gray-200 border rounded bg-inherit md:min-w-96"
        id="foucoco_address"
        name="foucoco_address"
        autocomplete="off"
        data-lpignore="true"
        data-1p-ignore="true"
        bind:value={address}
    />
    <button
        disabled={isPending}
        aria-busy={isPending}
        type="submit"
        class="w-full px-8 py-2 mt-4 font-bold text-white transition rounded-full bg-emerald-500 hover:bg-emerald-700 disabled:hover:bg-emerald-500 disabled:opacity-25"
        >{isPending ? 'Submitting...' : 'GET AMPE (testnet)'}</button
    >
</form>
{#if message}
    <p
        class="w-full max-w-3xl mt-4 text-sm text-center text-red-500 break-words whitespace-pre-line"
    >
        {message}
    </p>
{/if}