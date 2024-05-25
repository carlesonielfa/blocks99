import Peer from "peerjs";
import {
    uniqueNamesGenerator,
    adjectives,
    colors,
    animals,
} from "unique-names-generator";

// TURN server configuration.
const TURN_USERNAME = import.meta.env.VITE_TURN_SERVER_USERNAME;
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_SERVER_CREDENTIAL;
const TURN_CONFIG = [
    {
        urls: "stun:stun.relay.metered.ca:80",
    },
    {
        urls: "turn:global.relay.metered.ca:80",
        username: TURN_USERNAME,
        credential: TURN_CREDENTIAL,
    },
    {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: TURN_USERNAME,
        credential: TURN_CREDENTIAL,
    },
    {
        urls: "turn:global.relay.metered.ca:443",
        username: TURN_USERNAME,
        credential: TURN_CREDENTIAL,
    },
    {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: TURN_USERNAME,
        credential: TURN_CREDENTIAL,
    },
];

// PeerJS server configuration.
export const PEER_SERVER_URI = import.meta.env.VITE_PEER_SERVER_URI;
export const PEER_SERVER_KEY = import.meta.env.VITE_PEER_SERVER_KEY;

const SERVER_CONNECTION = {
    host: PEER_SERVER_URI,
    port: 443,
    ping: 1000 * 15, // 15s ping
    secure: true,
    debug: 2,
    key: PEER_SERVER_KEY,
    config: {
        iceServers: TURN_CONFIG,
    },
};

export default function peerServerConnect() {
    const UUID = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
    }); // big_red_donkey
    return new Peer(UUID, SERVER_CONNECTION);
}
