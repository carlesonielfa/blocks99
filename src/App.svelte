<script>
    import Game from "./lib/Game.svelte";
    import Peer from "peerjs";
    import { onDestroy } from "svelte";

    // Generate the ID for the connection, once per load of the tab.
    const UUID = window.crypto.randomUUID();
    // Server connection information.
    // Complete with the URI of your Cloud Run server.
    const SERVER_URI = "blocks99-server-bivrmfu6ua-ew.a.run.app";
    // Key will be exposed to front end, that's fine.
    // This is the MD5 of the key from Terraform.
    const SERVER_KEY = "fd73517959ca5765538f4d7d8dadefda";
    const SERVER_CONNECTION = {
        host: SERVER_URI,
        port: 443,
        ping: 1000 * 15, // 15s ping
        secure: true,
        debug: 2,
        key: SERVER_KEY,
    };

    const peer = new Peer(UUID, SERVER_CONNECTION);

    let peerId;
    let connections = {};

    peer.on("open", (id) => {
        console.log("My peer ID is: " + id);
        peerId = id;
    });
    peer.on("connection", (conn) => {
        setupConnectionHandlers(conn);
    });
    peer.on("error", (err) => {
        console.error(err);
    });

    // ACTION EVENTS
    const actionListeners = [];
    function registerActionListener(callback) {
        actionListeners.push(callback);
    }
    function unregisterInputListener(callback) {
        const index = actionListeners.indexOf(callback);
        if (index !== -1) {
            actionListeners.splice(index, 1);
        }
    }
    function dispatchAction(event) {
        actionListeners.forEach((callback) => {
            callback(event);
        });
    }
    function handleInput(e) {
        let action;
        switch (e.key) {
            case "ArrowLeft":
                action = "LEFT";
                break;
            case "ArrowRight":
                action = "RIGHT";
                break;
            case "ArrowUp":
                action = "ROTATE";
                break;
            case "ArrowDown":
                action = "DOWN";
                break;
            case " ":
                action = "DROP";
                break;
        }
        if (action) {
            const event = {
                action: action,
                peerId: peerId,
            };
            dispatchAction(event);
            // Send action to all connected peers
            for (const conn of Object.values(connections)) {
                conn.send(event);
            }
        }
    }
    window.addEventListener("keydown", handleInput);

    // PEER CONNECTION
    function handleClickConnect() {
        let code = window.prompt("Enter peer ID");
        if (code) {
            const conn = peer.connect(code);
            setupConnectionHandlers(conn);
        }
    }
    function handleClickDisconnect() {
        for (const conn of Object.values(connections)) {
            conn.close();
        }
        connections = {};
    }

    function setupConnectionHandlers(conn) {
        conn.on("open", () => {
            console.log("Connected to peer ", conn.peer);
            connections[conn.peer] = conn;
            connections = { ...connections };
        });
        conn.on("data", (data) => {
            console.log("Received", data);
            dispatchAction(data);
        });
        conn.on("close", () => {
            console.log("Connection closed");
            delete connections[conn.peer];
            connections = { ...connections };
        });
    }
    // HELPER FUNCTIONS
    $: isConnected = () => Object.keys(connections).length > 0;

    // CLEANUP
    onDestroy(() => {
        window.removeEventListener("keydown", handleInput);
        for (const conn of Object.values(connections)) {
            conn.close();
        }
        peer.destroy();
    });
</script>

<main>
    <div class="mb-29">
        <h1 class="mb-2 font-bold tracking-tight sm:text-4xl">
            Tetrominos Battle Royale
        </h1>

        {#key connections}
            {#if peerId}
                <p>
                    Your ID is:
                    <br />
                    <strong>{peerId}</strong>
                </p>
                <button
                    class="mt-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    on:click={() => handleClickConnect()}
                >
                    Connect
                </button>
            {:else if Object.keys(connections).length === 0}
                <p>Connecting...</p>
            {:else}
                <button
                    class="mt-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    on:click={() => handleClickDisconnect()}
                >
                    Disconnect
                </button>
            {/if}
        {/key}
    </div>
    <div class="mt-4 flex flex-row gap-4 items-center justify-center">
        <Game {peerId} seed={43} {registerActionListener} />
        {#each Object.keys(connections) as connId}
            <Game peerId={connId} seed={43} {registerActionListener} />
        {/each}
    </div>
</main>

<style global lang="postcss">
    @tailwind utilities;
    @tailwind components;
    @tailwind base;
</style>
