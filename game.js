const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 512; // 16 blocks * 32px
canvas.height = 512; // 16 blocks * 32px

const BLOCK_SIZE = 32;
const SLICE_COUNT = 16;
const WORLD_WIDTH = 16;
const WORLD_HEIGHT = 16;

// Block types
const BLOCKS = {
    air: null,
    grass: 'green',
    dirt: 'brown',
    stone: 'grey',
    leaves: 'lightgreen',
    wood: 'saddlebrown',
    water: 'blue'
};

// Player
let player = {
    x: 8, y: 0, z: 0, // grid coordinates
    px: 0, py: 0,      // pixel position
    width: BLOCK_SIZE,
    height: 30,
    colorTop: 'tan',
    colorBottom: 'teal',
    dy: 0
};

// World: slice[z][x][y] = block type
let world = [];

function generateWorld() {
    for (let z = 0; z < SLICE_COUNT; z++) {
        const slice = [];
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const column = [];
            const height = 4 + Math.floor(Math.random() * 5); // terrain height 4-8
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                if (y < height - 1) column.push('dirt');
                else if (y === height - 1) column.push('grass');
                else column.push('air');
            }
            // Add a tree randomly
            if (Math.random() < 0.2 && height < WORLD_HEIGHT - 4) {
                column[height] = 'wood';
                column[height + 1] = 'wood';
                column[height + 2] = 'leaves';
                column[height + 3] = 'leaves';
            }
            slice.push(column);
        }
        world.push(slice);
    }
}

function drawSlice(z) {
    ctx.fillStyle = 'lightblue'; // sky
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let x = 0; x < WORLD_WIDTH; x++) {
        for (let y = 0; y < WORLD_HEIGHT; y++) {
            const block = world[z][x][y];
            if (!block || block === 'air') continue;
            if (block === 'leaves') ctx.globalAlpha = 0.6;
            else ctx.globalAlpha = 1;

            ctx.fillStyle = BLOCKS[block];
            ctx.fillRect(x * BLOCK_SIZE, canvas.height - (y + 1) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            ctx.globalAlpha = 1;
        }
    }

    // Draw player
    player.px = player.x * BLOCK_SIZE;
    player.py = canvas.height - (player.y + 1) * BLOCK_SIZE - (player.height - BLOCK_SIZE);
    ctx.fillStyle = player.colorTop;
    ctx.fillRect(player.px, player.py, player.width, player.height / 2);
    ctx.fillStyle = player.colorBottom;
    ctx.fillRect(player.px, player.py + player.height / 2, player.width, player.height / 2);
}

function isSolid(x, y, z) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= SLICE_COUNT) return true;
    const block = world[z][x][y];
    return block && block !== 'air' && block !== 'water' && block !== 'leaves';
}

// Simple gravity
function updatePlayer() {
    player.dy += 0.5; // gravity
    let newY = player.y + player.dy / BLOCK_SIZE;

    if (player.dy > 0) { // falling
        if (isSolid(player.x, Math.floor(newY), player.z)) {
            player.y = Math.floor(newY);
            player.dy = 0;
        } else {
            player.y = newY;
        }
    } else if (player.dy < 0) { // jumping
        if (isSolid(player.x, Math.floor(newY), player.z)) {
            player.dy = 0;
        } else {
            player.y = newY;
        }
    }

    // Respawn if fall below
    if (player.y < 0) {
        player.x = 8; player.y = 10; player.z = 0; player.dy = 0;
    }
}

function gameLoop() {
    updatePlayer();
    drawSlice(player.z);
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        if (!isSolid(player.x - 1, Math.floor(player.y), player.z)) player.x--;
    }
    if (e.key === 'ArrowRight') {
        if (!isSolid(player.x + 1, Math.floor(player.y), player.z)) player.x++;
    }
    if (e.key === 'ArrowUp') {
        if (isSolid(player.x, Math.floor(player.y - 1), player.z)) player.dy = -10;
    }
    if (e.key === 'w') {
        if (player.z < SLICE_COUNT - 1) player.z++; // forward slice
    }
    if (e.key === 's') {
        if (player.z > 0) player.z--; // backward slice
    }
});

generateWorld();
player.y = 10;
gameLoop();
