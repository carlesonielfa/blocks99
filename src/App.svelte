<script>
    import Game from "./lib/Game.svelte";
    import Button from "./lib/Button.svelte";
    import PeerList from "./lib/PeerList.svelte";
    import { onDestroy } from "svelte";
    import peerServerConnect, {
        PEER_SERVER_KEY,
        PEER_SERVER_URI,
    } from "./scripts/peer.js";
    import config from "./configs/tetrominos.json";

    let peer;
    peerServerConnect().then((p) => {
        peer = p;
        peer.on("open", (id) => {
            console.log("My peer ID is: " + id);
            peerId = id;
            updateState();
        });
        peer.on("connection", (conn) => {
            setupConnectionHandlers(conn);
            updateState();
        });
        peer.on("error", (err) => {
            console.error(err);
        });
    });

    let peerId;
    let connections = {};
    const GameStates = Object.freeze({
        DISCONNECTED: Symbol("disconnected"),
        CONNECTED: Symbol("connected"),
        JOINED: Symbol("joined"),
        IN_GAME: Symbol("in_game"),
    });
    let currentState = GameStates.DISCONNECTED;
    function updateState() {
        if (connections && Object.keys(connections).length > 0) {
            currentState = GameStates.IN_GAME;
        } else if (peerId) {
            currentState = GameStates.CONNECTED;
        } else {
            currentState = GameStates.DISCONNECTED;
        }
        console.log("Current state: ", currentState);
    }

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
    function handleClickConnect(code) {
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
            updateState();
        });
        conn.on("data", (data) => {
            console.log("Received", data);
            dispatchAction(data);
        });
        conn.on("close", () => {
            console.log("Connection closed");
            delete connections[conn.peer];
            connections = { ...connections };
            updateState();
        });
    }

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
        <h1
            class="mb-2 font-bold tracking-tight text-5xl font-custom uppercase"
        >
            Blocks 99
        </h1>
        <p
            class="mb-1 {currentState === GameStates.IN_GAME
                ? 'animate-fade-out'
                : 'opacity-0 animate-fade-in animation-delay-300'}"
        >
            A P2P Tetrominos Battle Royale!
        </p>
        <div
            class="flex flex-row justify-center items-center gap-1 {currentState ===
            GameStates.IN_GAME
                ? 'animate-fade-out animation-delay-300'
                : 'animate-fade-in'}"
        >
            {#each config.colors as color}
                <div class="w-10 h-1" style="background-color: {color};" />
            {/each}
        </div>

        {#key connections}
            {#if currentState === GameStates.CONNECTED}
                <p class="p-4">
                    Your ID is:
                    <strong>{peerId}</strong>
                </p>
                <div class="my-6">
                    <PeerList
                        SERVER_URI={PEER_SERVER_URI}
                        SERVER_KEY={PEER_SERVER_KEY}
                        {peerId}
                        onClickPeer={(code) => handleClickConnect(code)}
                    />
                </div>
            {:else if currentState === GameStates.DISCONNECTED}
                <p class="p-4">Connecting to server...</p>
            {/if}
        {/key}
    </div>
    {#if currentState === GameStates.IN_GAME}
        <div
            class="mt-4 flex flex-row gap-4 items-center justify-center {currentState ===
            GameStates.IN_GAME
                ? 'animate-fade-in'
                : ''}"
        >
            <Game {peerId} seed={43} {registerActionListener} />
            {#each Object.keys(connections) as connId}
                <Game peerId={connId} seed={43} {registerActionListener} />
            {/each}
        </div>
    {/if}
    {#if currentState === GameStates.IN_GAME}
        <Button on:click={handleClickDisconnect}>Disconnect</Button>
    {/if}
</main>

<style>
</style>
