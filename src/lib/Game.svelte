<script context="module">
    // constants
    const BOARD_WIDTH = config.board.width;
    const BOARD_HEIGHT = config.board.height;
    const BLOCK_SIZE = config.board.block_size;
    const BLOCK_BORDER = config.board.block_border;
</script>

<script>
    import { rng } from "../utils/rng";
    import config from "../configs/tetrominos.json";
    import { beforeUpdate, onMount } from "svelte";
    import anime from "animejs";
    import {
        animateFallParticles,
        animateLineClearParticles,
    } from "../scripts/particles";
    export let peerId;
    export let seed;
    export let registerActionListener;

    let frameId;
    let lastTime = 0;
    let deltaTime = 0;
    const random = rng(seed);

    let canvas;
    let canvasBG;
    let canvasFX;
    let canvasContainer;

    onMount(() => {
        canvasContainer.style.width = `${config.board.width * config.board.block_size}px`;
        canvasContainer.style.height = `${config.board.height * config.board.block_size}px`;

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        const ctxBG = canvasBG.getContext("2d");
        ctxBG.imageSmoothingEnabled = false;

        const ctxFX = canvasFX.getContext("2d");
        ctxFX.imageSmoothingEnabled = false;

        // FX
        var renderFX = anime({
            duration: Infinity,
            update: function () {
                ctxFX.clearRect(0, 0, canvasFX.width, canvasFX.height);
            },
        });

        const counters = {
            drop: 0,
            total: 0,
        };
        let gameOver = false;
        let dropTime = 1000;
        let lineClearTime = 300;
        // Store lines to clear and when to clear them (animation)
        let linesToClear = [];

        const board = Array.from({ length: BOARD_HEIGHT }, () =>
            Array(BOARD_WIDTH).fill(0),
        );

        // draw function
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBoard();
            drawPlayer();
            ctx.imageSmoothingEnabled = false;
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
                            BLOCK_SIZE - 2 * BLOCK_BORDER,
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
        function drawBG() {
            // Draw background grid
            // This is only drawn once
            ctxBG.lineWidth = 1;
            ctxBG.strokeStyle = "rgb(20,20,20)";
            for (
                var x = 0;
                x < config.board.width * config.board.block_size;
                x += config.board.block_size
            ) {
                for (
                    var y = 0;
                    y < config.board.height * config.board.block_size;
                    y += config.board.block_size
                ) {
                    ctxBG.strokeRect(
                        x,
                        y,
                        config.board.block_size,
                        config.board.block_size,
                    );
                }
            }
        }
        drawBG();
        // update - game logic
        const player = {
            x: BOARD_WIDTH / 2 - 1,
            y: 0,
            block: config.blocks["O"].shape,
        };
        registerActionListener(handleEvent);
        function handleEvent(event) {
            // TODO: Add validation
            if (event.peerId === peerId) {
                processInput(event.action);
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

                    renderFX.play();
                    animateFallParticles(
                        ctxFX,
                        (player.x + 1) * BLOCK_SIZE +
                            BOARD_WIDTH * BLOCK_SIZE * 0.5,
                        player.y * BLOCK_SIZE + BOARD_HEIGHT * BLOCK_SIZE * 0.5,
                        10,
                        config.colors[Math.max(...player.block.flat()) - 1],
                    );
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
            blocks = player.block,
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
            setLinesToClear();
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
        function setLinesToClear() {
            const t = counters["total"];
            // Find lines to clear
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if (board[y].every((block) => block != 0)) {
                    linesToClear.push([t + lineClearTime, y]);
                    // Set the line to clear to 0
                    board[y] = Array(BOARD_WIDTH).fill(0);
                    renderFX.play();
                    animateLineClearParticles(
                        ctxFX,
                        (BOARD_WIDTH / 2) * BLOCK_SIZE +
                            BOARD_WIDTH * BLOCK_SIZE * 0.5,
                        y * BLOCK_SIZE + BOARD_HEIGHT * BLOCK_SIZE * 0.5,
                        10,
                        "white",
                    );
                }
            }
        }
        function clearLines() {
            const t = counters["total"];
            // Clear lines that are ready
            let linesCleared = 0;
            for (let i = 0; i < linesToClear.length; i++) {
                const timeToClear = linesToClear[i][0];
                const y = linesToClear[i][1];
                if (t >= timeToClear) {
                    board.splice(y, 1);
                    board.unshift(Array(BOARD_WIDTH).fill(0));
                    linesToClear.splice(i, 1);
                    i--;
                } else {
                    break;
                }
            }
            // For each line cleared, we have to move the rest of the stored lines to clear down
            linesToClear.forEach((line) => {
                line[1] -= linesCleared;
            });
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
            clearLines();
        }
        // game loop
        const frame = (time) => {
            deltaTime = time - lastTime;
            lastTime = time;
            // Update counters
            for (const key in counters) {
                counters[key] += deltaTime;
            }
            if (gameOver) {
                return;
            }
            update();
            draw();
            frameId = requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    });
</script>

<div class="flex flex-col items-center justify-center">
    <div class="relative" bind:this={canvasContainer}>
        <canvas
            class="ring-1 ring-gray-700 mx-auto bg-black z-0 top-0 left-0"
            bind:this={canvasBG}
            width={config.board.width * config.board.block_size}
            height={config.board.height * config.board.block_size}
        />
        <canvas
            class="z-1 top-0 left-0"
            bind:this={canvas}
            width={config.board.width * config.board.block_size}
            height={config.board.height * config.board.block_size}
        />
        <canvas
            class="z-2 pointer-events-none"
            style="top: -{0.5 *
                config.board.height *
                config.board.block_size}px; left: -{0.5 *
                config.board.width *
                config.board.block_size}px;"
            bind:this={canvasFX}
            width={2 * config.board.width * config.board.block_size}
            height={2 * config.board.height * config.board.block_size}
        />
    </div>
    <p class="text-center">{peerId}</p>
</div>

<style>
    canvas {
        image-rendering: optimizeSpeed; /* Older versions of FF          */
        image-rendering: -moz-crisp-edges; /* FF 6.0+                       */
        image-rendering: -webkit-optimize-contrast; /* Safari                        */
        image-rendering: -o-crisp-edges; /* OS X & Windows Opera (12.02+) */
        image-rendering: pixelated; /* Awesome future-browsers       */
        -ms-interpolation-mode: nearest-neighbor; /* IE                            */
        position: absolute;
    }
</style>
