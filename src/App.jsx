import React, { useEffect, useRef, useState } from "react";
import { createCustomEvent } from "./utils/customEvents";
import { useEvent } from "./context/EventContext";
import "./App.css";
import Peer from "peerjs";
import Game from "./Game";

const peer = new Peer();

function App() {
    const { dispatchEvent } = useEvent();
    const [peerId, setPeerId] = useState("");
    const [connections, setConnections] = useState([]);

    // Handle input from the user
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
            console.log("Peer ID: " + peerId + " Action: " + action);
            const event = createCustomEvent("input", {
                action: action,
                peerId: peerId,
            });
            dispatchEvent(event);
            sendInput(event);
            console.log("Sent input ", event.detail);
        }
    }
    // Send input to all connected peers
    function sendInput(event) {
        connections.forEach((conn) => {
            if (conn.open) {
                conn.send(event);
            }
        });
    }
    function handlePeerInput(event) {
        // Propagate the event to the game
        // TODO: Validation
        dispatchEvent(event);
    }

    function setupConnectionHandlers(conn) {
        conn.on("data", (event) => {
            handlePeerInput(event);
        });

        conn.on("close", () => {
            setConnections(connections.filter((c) => c !== conn));
        });
    }

    function handleClickConnect() {
        let code = window.prompt("Enter peer ID");
        if (code) {
            console.log("Connecting to peer ", code);
            const conn = peer.connect(code);
            if (!conn) {
                console.error("Failed to connect to peer ", code);
                return;
            }
            setupConnectionHandlers(conn);
            setConnections((prevConnections) => [...prevConnections, conn]);
        }
    }
    function handleClickDisconnect() {
        for (let conn of connections) {
            conn.close();
        }
        setConnections([]);
    }
    useEffect(() => {
        peer.on("open", (id) => {
            setPeerId(id);
            console.log("My peer ID is: " + id);
        });
        peer.on ("error", (error) => {
            console.error("Peer error ", error);
        });
        peer.on("connection", (conn) => {
            if (connections.some((c) => c.peer === conn.peer)) {
                console.warn("Already connected to peer ", conn.peer);
                return;
            }
            console.log("Peer connected ", conn.peer);
            setConnections((prevConnections) => [...prevConnections, conn]);
            setupConnectionHandlers(conn);
        });
        document.addEventListener("keydown", handleInput);
        return () => {
            document.removeEventListener("keydown", handleInput);
            peer.disconnect();
        };
    }, []);

    return (
        <>
            <div className="mb-29">
                <h1 className="mb-2 font-bold tracking-tight sm:text-4xl">
                    Tetrominos Battle Royale
                </h1>
                <p>
                    Your ID is:
                    <br />
                    <strong>{peerId}</strong>
                </p>
            </div>
            <div className="flex-col flex gap-2 justify-center items-center">
                {peerId && connections.length > 0 && (
                    <div className="flex flex-row justify-center m-3">
                        <Game peerId={peerId} seed={43} />
                        {connections.map((conn) => (
                            <div key={conn.peer}>
                                <Game peerId={conn.peer} seed={43} />
                            </div>
                        ))}
                    </div>
                )}
                {!peerId && <p>Waiting for peer connection...</p>}
                {peerId && connections.length === 0 && (
                    <>
                    <button
                        className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        onClick={() => handleClickConnect()}
                    >
                        Connect to peer
                    </button>
                    <Game peerId={peerId} seed={43} />
                    </>
                )}
                {connections.length > 0 && <button className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={() => handleClickDisconnect()}>
                    Disconnect
                </button>}
                <div className=" text-left mx-auto w-auto inline-block">
                    ↑ &emsp;&emsp;&ensp; Rotate
                    <br />
                    ← &emsp;&emsp;&ensp;Move left
                    <br />
                    → &emsp;&emsp;&ensp;Move right
                    <br />
                    ↓ &emsp;&emsp;&ensp; Move down
                    <br />
                    SPACE &nbsp; Drop
                </div>
            </div>
        </>
    );
}

export default App;
