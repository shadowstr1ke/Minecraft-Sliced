const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 640;
canvas.height = 360;

// Constants
const BLOCK_SIZE = 16;
const SLICE_WIDTH = 16; // blocks per slice
const VIEW_HEIGHT = canvas.height;
const VIEW_WIDTH = canvas.width;

// Terrain & slice storage
let slices = {}; // keys are slice indices
let player = { x: 8, y: 0, slice: 0, width: 16, height: 30 };

// Noise function for terrain height
function pseudoNoise(x) {
    return Math.floor(8 + 4 * Math.sin(x * 0.5) + Math.sin(x * 0.25) * 2);
}

// Generate a slice
function generateSlice(index) {
    if (slices[index]) return; // already exists
    let slice = [];
    for (let x = 0; x < SLICE_WIDTH; x++) {
        let height = pseudoNoise(index * SLICE_WIDTH + x);
        let column = [];
        for (let y = 0; y < VIEW_HEIGHT / BLOCK_SIZE; y++) {
            if (y > height) column.push("air");
            else if (y === height) column.push("grass");
            else if (y > height - 3) column.push("dirt");
            else column.push("stone");
        }
        // Add tree with small probability
        if (Math.random() < 0.1 && height < (VIEW_HEIGHT / BLOCK_SIZE - 4)) {
            column[height - 1] = "wood";
            column[height - 2] = "leaves";
            column[height - 3] = "leaves";
        }
        slice.push(column);
    }
    slices[index] = slice;
}

// Draw a slice
function drawSlice(index, offsetX) {
    generateSlice(index);
    const slice = slices[index];
    for (let x = 0; x < SLICE_WIDTH; x++) {
        for (let y = 0; y < slice[x].length; y++) {
            const block = slice[x][y];
            if (block === "air") continue;
            ctx.fillStyle = blockColor(block);
            // subtle parallax for depth effect
            ctx.fillRect(offsetX + x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
}

// Block colors
function blockColor(block) {
    switch(block) {
        case "grass": return "#00FF00";
        case "dirt": return "#8B4513";
        case "stone": return "#808080";
        case "wood": return "#A0522D";
        case "leaves": return "rgba(144,238,144,0.7)"; // semi-transparent
        default: return "#000000";
    }
}

// Draw player
function drawPlayer() {
    ctx.fillStyle = "#D2B48C"; // upper part tan
    ctx.fillRect(player.x, player.y, player.width, player.height/2);
    ctx.fillStyle = "#008080"; // lower part teal
    ctx.fillRect(player.x, player.y + player.height/2, player.width, player.height/2);
}

// Main render
function render() {
    ctx.fillStyle = "#87CEFA"; // sky
    ctx.fillRect(0,0,canvas.width, canvas.height);

    // Determine slices to draw around player
    const startSlice = player.slice - 2;
    const endSlice = player.slice + 2;
    for (let s = startSlice; s <= endSlice; s++) {
        drawSlice(s, (s - player.slice) * SLICE_WIDTH * BLOCK_SIZE + (canvas.width/2 - player.width/2 - player.x));
    }

    drawPlayer();
}

// Controls
document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") movePlayer(1,0);
    if (e.key === "ArrowLeft") movePlayer(-1,0);
    if (e.key === "ArrowUp") movePlayer(0,-1);
    if (e.key === "ArrowDown") movePlayer(0,1);
    if (e.key === "w") scrollSlice(1);
    if (e.key === "s") scrollSlice(-1);
});

// Scroll between slices
function scrollSlice(dir) {
    player.slice += dir;
}

// Move player with collision
function movePlayer(dx, dy) {
    let newX = player.x + dx * BLOCK_SIZE;
    let newY = player.y + dy * BLOCK_SIZE;
    const slice = slices[player.slice] || [];
    // Collision detection
    const gridX = Math.floor((newX + player.width/2) / BLOCK_SIZE);
    const gridY = Math.floor((newY + player.height/2) / BLOCK_SIZE);
    if (slice[gridX] && slice[gridX][gridY] !== "air") return;
    player.x = newX;
    player.y = newY;
}

// Game loop
function gameLoop() {
    render();
    requestAnimationFrame(gameLoop);
}

// Initialize
generateSlice(0);
gameLoop();
