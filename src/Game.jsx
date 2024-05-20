import { useEffect, useRef, useState, useCallback } from "react";
import { useEvent } from "./context/EventContext";
import config from "./configs/tetrominos.json";
import {rng} from "./utils/rng";

export default function Game({ peerId, seed }) {
	const [frameTime, setFrameTime] = useState();
	const canvasRef = useRef();
	const { addEventListener, removeEventListener } = useEvent();

	useEffect(() => {
		let frameId;
		let lastTime = 0;
		let deltaTime = 0;
        const random = rng(seed);

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");

		// variables
		const BOARD_WIDTH = config.board.width;
		const BOARD_HEIGHT = config.board.height;
		const BLOCK_SIZE = config.board.block_size;
		const BLOCK_BORDER = config.board.block_border;

		const counters = {
			drop: 0,
		};
		let gameOver = false;
		let dropTime = 1000;

		const board = Array.from({ length: BOARD_HEIGHT }, () =>
			Array(BOARD_WIDTH).fill(0)
		);

		// draw function
		function draw() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			drawBoard();
			drawPlayer();
		}
		function drawBlocks(blocks, offset = { x: 0, y: 0 }) {
			for (let y = 0; y < blocks.length; y++) {
				for (let x = 0; x < blocks[y].length; x++) {
					if (blocks[y][x]) {
						ctx.fillStyle = config.colors[blocks[y][x] - 1];
						ctx.fillRect(
							x * BLOCK_SIZE + offset.x + BLOCK_BORDER,
							y * BLOCK_SIZE + offset.y + BLOCK_BORDER,
							BLOCK_SIZE - 2 * BLOCK_BORDER,
							BLOCK_SIZE - 2 * BLOCK_BORDER
						);
					}
				}
			}
		}
		function drawBoard() {
			drawBlocks(board);
		}
		function drawPlayer() {
			drawBlocks(player.block, {
				x: player.x * BLOCK_SIZE,
				y: player.y * BLOCK_SIZE,
			});
		}
		// update - game logic
		const player = {
			x: BOARD_WIDTH / 2 - 1,
			y: 0,
			block: config.blocks["O"].shape,
		};
		addEventListener("input", handleEvent);
		function handleEvent(event) {
			// TODO: Add validation
			if (event.detail.peerId === peerId) {
				processInput(event.detail.action);
			}
		}
		function processInput(input) {
			switch (input) {
				case "LEFT":
					if (!checkCollision(-1, 0)) player.x--;
					break;
				case "RIGHT":
					if (!checkCollision(1, 0)) player.x++;
					break;
				case "ROTATE":
					rotatePlayer();
					break;
				case "DOWN":
					counters["drop"] = 0;
					if (!checkCollision(0, 1)) player.y++;
					break;
				case "DROP":
					// TODO: Improve by raycasting
					while (!checkCollision()) {
						player.y++;
					}
					player.y--;
					solidify();
					break;
			}
		}
		function rotatePlayer() {
			const rotatedBlock = player.block[0]
				.map((_, i) => player.block.map((row) => row[i]))
				.reverse();
			if (!checkCollision(0, 0, rotatedBlock))
				player.block = rotatedBlock;
		}
		function checkCollision(
			xOffset = 0,
			yOffset = 0,
			blocks = player.block
		) {
			return blocks.find((row, y) => {
				return row.find((block, x) => {
					return (
						block != 0 &&
						board[player.y + y + yOffset]?.[
							player.x + x + xOffset
						] != 0
					);
				});
			});
		}
		function solidify() {
			player.block.forEach((row, y) => {
				row.forEach((block, x) => {
					if (block) {
						board[player.y + y][player.x + x] = block;
					}
				});
			});
			resetPlayer();
			clearLines();
			// If player is out of bounds, game over
			if (checkCollision()) {
				console.log("Game Over");
				gameOver = true;
			}
		}
		function resetPlayer() {
			player.x = BOARD_WIDTH / 2 - 1;
			player.y = 0;
			// Random block from config
			player.block = Object.values(config.blocks)[
				Math.floor(random() * Object.values(config.blocks).length)
			].shape;
		}
		function clearLines() {
			for (let y = 0; y < BOARD_HEIGHT; y++) {
				if (board[y].every((block) => block != 0)) {
					board.splice(y, 1);
					board.unshift(Array(BOARD_WIDTH).fill(0));
				}
			}
		}
		function update() {
			if (counters["drop"] > dropTime) {
				player.y++;
				if (checkCollision()) {
					player.y--;
					solidify();
				}
				counters["drop"] = 0;
			}
		}
		// game loop
		const frame = (time) => {
			deltaTime = time - lastTime;
			lastTime = time;
			// Update counters
			for (const key in counters) {
				counters[key] += deltaTime;
			}
			setFrameTime(deltaTime);
			if (gameOver) {
				return;
			}
			update();
			draw(ctx, canvas, deltaTime);
			frameId = requestAnimationFrame(frame);
		};
		requestAnimationFrame(frame);
		return () => {
			removeEventListener("input", handleEvent);
			cancelAnimationFrame(frameId);
		};
	}, []);
	return (
		<>
			<canvas
				className="ring-1 ring-white mx-auto bg-black"
				ref={canvasRef}
				width={config.board.width * config.board.block_size}
				height={config.board.height * config.board.block_size}
			/>
		</>
	);
}
