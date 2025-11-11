const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const BLOCK_SIZE = 16;
const SLICES = 6;

// Block colors
const COLORS = {
    grass: '#228B22',
    dirt: '#8B4513',
    stone: '#808080',
    leaves: '#90EE90',
    wood: '#D2B48C',
    water: '#1E90FF',
    placed: '#AAAAAA'
};

// Simple smooth noise function
function smoothNoise(x) {
    return (Math.sin(x * 0.05) + Math.sin(x * 0.1) * 0.5 + 1) * 0.5;
}

// Generate terrain for all slices
let blocks = [];
for (let z = 0; z < SLICES; z++) {
    let prevHeight = 10 + Math.floor(Math.random()*3); // initial height
    for (let x = 0; x < Math.ceil(canvas.width / BLOCK_SIZE); x++) {
        let height = Math.floor(smoothNoise(x + z*100) * 10) + 5;

        // Smooth transition from previous column
        height = Math.floor((height + prevHeight) / 2);
        prevHeight = height;

        // Random water dip
        if (Math.random() < 0.08 && height > 5) height -= Math.floor(Math.random()*3);

        // Place stone, dirt, grass
        for (let y = 0; y < height; y++) {
            let type = 'stone';
            if (y >= height - 3 && y < height - 1) type = 'dirt';
            else if (y === height -1) type = 'grass';
            blocks.push({
                x: x*BLOCK_SIZE,
                y: canvas.height - (y+1)*BLOCK_SIZE,
                z: z,
                type: type,
                solid: true
            });
        }

        // Place water if height < 8
        if (height < 8) {
            blocks.push({
                x: x*BLOCK_SIZE,
                y: canvas.height - height*BLOCK_SIZE,
                z: z,
                type: 'water',
                solid: false
            });
        }

        // Random tree spawn on top grass
        if (Math.random() < 0.08) {
            let trunkHeight = 3 + Math.floor(Math.random()*2);
            for (let t = 0; t < trunkHeight; t++) {
                blocks.push({
                    x: x*BLOCK_SIZE,
                    y: canvas.height - (height + t)*BLOCK_SIZE,
                    z: z,
                    type:'wood',
                    solid:true
                });
            }
            // Leaves cube 3x3x3
            for (let lx=-1; lx<=1; lx++){
                for (let ly=0; ly<3; ly++){
                    for (let lz=-1; lz<=1; lz++){
                        let leafX = x + lx;
                        let leafZ = z + lz;
                        if (leafX >=0 && leafZ >=0 && leafZ < SLICES) {
                            blocks.push({
                                x: leafX*BLOCK_SIZE,
                                y: canvas.height - (height + trunkHeight + ly)*BLOCK_SIZE,
                                z: leafZ,
                                type:'leaves',
                                solid:false
                            });
                        }
                    }
                }
            }
        }
    }
}

// Player (~2 blocks tall)
let player = {
    x: 100,
    y: canvas.height - BLOCK_SIZE*2 - 2,
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

// Slice shift with scroll
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
