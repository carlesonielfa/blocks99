<script>
    import Game from "./lib/Game.svelte";
    import Button from "./lib/Button.svelte";
    import PeerList from "./lib/PeerList.svelte";
    import { onDestroy } from "svelte";
    import peerServerConnect, {
        PEER_SERVER_KEY,
        PEER_SERVER_URI,
    } from "./scripts/peer.js";

    const peer = peerServerConnect();

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
        <h1 class="mb-2 font-bold tracking-tight text-4xl">
            Tetrominos Battle Royale
        </h1>

        {#key connections}
            {#if currentState === GameStates.CONNECTED}
                <p>
                    Your ID is:
                    <br />
                    <strong>{peerId}</strong>
                </p>
                <PeerList
                    SERVER_URI={PEER_SERVER_URI}
                    SERVER_KEY={PEER_SERVER_KEY}
                    {peerId}
                    onClickPeer={(code) => handleClickConnect(code)}
                />
            {:else if currentState === GameStates.DISCONNECTED}
                <p>Connecting to server...</p>
            {:else if currentState === GameStates.JOINED}
                <Button on:click={() => handleClickDisconnect()}>
                    Exit game
                </Button>
            {/if}
        {/key}
    </div>
    {#if currentState === GameStates.IN_GAME}
        <div class="mt-4 flex flex-row gap-4 items-center justify-center">
            <Game {peerId} seed={43} {registerActionListener} />
            {#each Object.keys(connections) as connId}
                <Game peerId={connId} seed={43} {registerActionListener} />
            {/each}
        </div>
    {/if}
</main>
