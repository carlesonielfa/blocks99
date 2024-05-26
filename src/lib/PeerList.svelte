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
    <h2 class="text-xl font-semibold mb-2">Connected Users</h2>
    <ul
        class="w-auto text-sm font-medium border border-black rounded-md dark:border-white"
    >
        {#if peerList.length === 0}
            <li class="p-2">You are by yourself 🥲</li>
        {/if}
        {#each peerList as peer, index}
            <li
                class="p-2 border-white dark:border-white
          hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black {index ===
                0
                    ? 'rounded-t-md'
                    : ''} select-none cursor-pointer"
                on:click={() => onClickPeer(peer)}
            >
                {peer}
            </li>
        {/each}
        <li
            class="p-2 font-semibold upp
                dark:bg-white bg-black text-white dark:text-black
                hover:bg-gray-700 dark:hover:bg-gray-300
                rounded-b-md select-none cursor-pointer"
            on:click={fetchPeers}
        >
            Refresh
        </li>
    </ul>
</div>
