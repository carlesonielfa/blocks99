import React, { useEffect, useRef, useState } from "react";
import { createCustomEvent } from "./utils/customEvents";
import { useEvent } from "./context/EventContext";
import "./App.css";
import Peer from "peerjs";
import Game from "./Game";

const peer = new Peer();

function App() {
    const { dispatchEvent } = useEvent();
    const [peerId, setPeerId] = useState();
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
            const event = createCustomEvent("input", {
                action: action,
                peerId: peerId,
            });
            dispatchEvent(event);
        }
    }
    useEffect(() => {
        peer.on("open", function (id) {
            setPeerId(id);
            console.log("My peer ID is: " + id);
        });
        document.addEventListener("keydown", handleInput);
        return () => {
            document.removeEventListener("keydown", handleInput);
        };
    }),
        [];
    return (
        <>
            <div className="mb-29">
                <h1 className="mb-2 font-bold tracking-tight sm:text-4xl">
                    Tetrominos Battle Royale
                </h1>
                <p>
                    Your ID is:<br/><strong>{peerId}</strong>
                </p>
            </div>
            {peerId && (
                <div className="flex flex-row justify-center m-3">
                    <Game peerId={peerId} seed={43} />
                </div>
            )}
            <button className="btn" onClick={() => peer.disconnect()}/>
            <div className=" text-left mx-auto w-auto inline-block">
                ↑ &emsp;&emsp;&ensp; Rotate<br />
                ← &emsp;&emsp;&ensp;Move left<br />
                → &emsp;&emsp;&ensp;Move right<br />
                ↓ &emsp;&emsp;&ensp; Move down<br />
                SPACE &nbsp; Drop
            </div>
        </>
    );
}

export default App;
