<script>
    import Button from "./Button.svelte";

    export let SERVER_URI;
    export let SERVER_KEY;
    export let peerId;
    export let onClickPeer;

    let peers = `https://${SERVER_URI}/${SERVER_KEY}/peers`;
    // Get the list of peers
    let peerList = [];
    function fetchPeers() {
        fetch(peers)
            .then((response) => response.json())
            .then((data) => {
                peerList = data.filter((peer) => peer !== peerId);
            })
            .catch((error) => {
                console.error("Error fetching peer list", error);
            });
    }
    fetchPeers();
</script>

<div class="flex flex-col items-center">
    <h2 class="text-xl font-semibold">Connected Users</h2>
    {#if peerList.length === 0}
        <p class="text-sm">You are by yourself 🥲</p>
    {:else}
        <ul
            class="w-auto text-sm font-medium border border-black rounded-lg dark:border-white"
        >
            {#each peerList as peer, index}
                <li
                    class="p-2 border-white dark:border-white
          hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black
          {index === peerList.length - 1 ? 'rounded-b-lg' : ''}
          {index === 0 ? 'rounded-t-lg' : ''}"
                    on:click={() => onClickPeer(peer)}
                >
                    {peer}
                </li>
            {/each}
        </ul>
    {/if}
    <Button on:click={fetchPeers}>Refresh</Button>
</div>
