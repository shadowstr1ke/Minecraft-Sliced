const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const BLOCK_SIZE = 16;
const SLICES = 6;

// Define block colors
const COLORS = {
    grass: '#228B22',
    dirt: '#8B4513',
    stone: '#808080',
    leaves: '#90EE90',
    wood: '#D2B48C',
    water: '#1E90FF',
    placed: '#AAAAAA' // default for placed blocks
};

// Create world blocks
let blocks = [];
for (let z = 0; z < SLICES; z++) {
    for (let x = 0; x < 50; x++) {
        // Randomly choose a ground block type for variety
        let type = ['grass','dirt','stone'][Math.floor(Math.random()*3)];
        blocks.push({
            x: x * BLOCK_SIZE,
            y: canvas.height - BLOCK_SIZE,
            z: z,
            type: type,
            solid: true
        });
    }
}

// Player (~2 blocks tall)
let player = {
    x: 100,
    y: canvas.height - BLOCK_SIZE*2, // start above ground
    w: BLOCK_SIZE,
    h: 30,
    vy: 0,
    onGround: false,
    z: 0,
    targetZ: 0
};

// Controls
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Slice shift
window.addEventListener('wheel', e => {
    player.targetZ += Math.sign(e.deltaY);
    if(player.targetZ < 0) player.targetZ = 0;
    if(player.targetZ > SLICES-1) player.targetZ = SLICES-1;
});

// Block placing/breaking
document.addEventListener('keydown', e => {
    const px = Math.floor(player.x / BLOCK_SIZE) * BLOCK_SIZE;
    const py = Math.floor((player.y + player.h) / BLOCK_SIZE) * BLOCK_SIZE;
    const z = Math.round(player.z);

    if(e.key === 'e' || e.key === 'E'){
        blocks.push({x:px, y:py - BLOCK_SIZE, z:z, type:'placed', solid:true});
    }
    if(e.key === 'q' || e.key === 'Q'){
        for(let i=blocks.length-1; i>=0; i--){
            let b = blocks[i];
            if(b.x === px && b.y === py && b.z === z){
                blocks.splice(i,1);
                break;
            }
        }
    }
});

// Game loop
function update(){
    // Smooth slice shift
    player.z += (player.targetZ - player.z)*0.2;

    // Horizontal movement
    if(keys['ArrowLeft'] || keys['a']) player.x -= 3;
    if(keys['ArrowRight'] || keys['d']) player.x += 3;

    // Jump
    if((keys['ArrowUp'] || keys['w'] || keys[' ']) && player.onGround){
        player.vy = -10;
        player.onGround = false;
    }

    // Gravity
    player.vy += 0.5;
    player.y += player.vy;

    // Collision with current slice
    player.onGround = false;
    blocks.filter(b => Math.round(b.z) === Math.round(player.z) && b.solid)
          .forEach(b=>{
        if(player.x + player.w > b.x && player.x < b.x + BLOCK_SIZE &&
           player.y + player.h > b.y && player.y + player.h < b.y + BLOCK_SIZE + player.vy){
            player.y = b.y - player.h;
            player.vy = 0;
            player.onGround = true;
        }
    });

    draw();
    requestAnimationFrame(update);
}

// Draw everything
function draw(){
    // Sky
    ctx.fillStyle = '#87CEFA';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Draw blocks in current slice
    blocks.filter(b => Math.round(b.z) === Math.round(player.z))
          .forEach(b => {
        ctx.fillStyle = COLORS[b.type] || '#AAAAAA';
        ctx.fillRect(b.x, b.y, BLOCK_SIZE, BLOCK_SIZE);
    });

    // Draw player
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Slice info
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText('Slice: ' + Math.round(player.z), 10, 20);
}

update();
