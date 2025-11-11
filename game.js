const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const BLOCK_SIZE = 16;
const CHUNK_SIZE = 16; // 16x16 blocks in X and Z
const MAX_HEIGHT = 20; // max Y height

// Colors
const COLORS = {
    grass: '#228B22',
    dirt: '#8B4513',
    stone: '#808080',
    leaves: '#90EE90',
    wood: '#D2B48C',
    water: '#1E90FF',
    placed: '#AAAAAA'
};

// Helper: smooth pseudo-noise
function smoothNoise(x, z) {
    return (Math.sin(x*0.2 + z*0.3) + Math.sin(x*0.1 + z*0.5) *0.5 +1)*0.5;
}

// 3D world array: world[x][y][z]
let world = [];
for(let x=0; x<CHUNK_SIZE; x++){
    world[x] = [];
    for(let y=0; y<MAX_HEIGHT; y++){
        world[x][y] = [];
        for(let z=0; z<CHUNK_SIZE; z++){
            world[x][y][z] = null; // empty initially
        }
    }
}

// Generate terrain
for(let x=0; x<CHUNK_SIZE; x++){
    for(let z=0; z<CHUNK_SIZE; z++){
        // Base height
        let height = Math.floor(smoothNoise(x,z)*10) +5;
        let prevHeight = height;

        // Place blocks up to height
        for(let y=0; y<height; y++){
            let type='stone';
            if(y>=height-3 && y<height-1) type='dirt';
            if(y===height-1) type='grass';

            // Random vertical gaps for caves
            if(Math.random()<0.05) continue;

            world[x][y][z] = {type:type, solid:true};
        }

        // Water in low terrain
        if(height<8){
            world[x][height][z] = {type:'water', solid:false};
        }

        // Tree spawn
        if(Math.random()<0.1 && height<MAX_HEIGHT-5){
            let trunkHeight = 3 + Math.floor(Math.random()*2);
            for(let t=0; t<trunkHeight; t++){
                world[x][height+t][z] = {type:'wood', solid:true};
            }
            // Leaves cube 3x3x3 around top of trunk
            for(let lx=-1; lx<=1; lx++){
                for(let ly=0; ly<3; ly++){
                    for(let lz=-1; lz<=1; lz++){
                        let nx = x+lx, ny = height+trunkHeight+ly, nz = z+lz;
                        if(nx>=0 && nx<CHUNK_SIZE && ny<MAX_HEIGHT && nz>=0 && nz<CHUNK_SIZE){
                            world[nx][ny][nz] = {type:'leaves', solid:true, semi:true};
                        }
                    }
                }
            }
        }
    }
}

// Player
let player = {
    x: BLOCK_SIZE*2,
    y: canvas.height - BLOCK_SIZE*2,
    w: BLOCK_SIZE,
    h: 30,
    vy:0,
    onGround:false,
    z:0,
    targetZ:0
};

// Controls
const keys={};
document.addEventListener('keydown',e=>keys[e.key]=true);
document.addEventListener('keyup',e=>keys[e.key]=false);

// Slice scrolling
window.addEventListener('wheel', e=>{
    player.targetZ += Math.sign(e.deltaY);
    if(player.targetZ<0) player.targetZ=0;
    if(player.targetZ>CHUNK_SIZE-1) player.targetZ=CHUNK_SIZE-1;
});

// Game loop
function update(){
    player.z += (player.targetZ - player.z)*0.2;

    // Horizontal movement
    if(keys['ArrowLeft'] || keys['a']) player.x -=3;
    if(keys['ArrowRight'] || keys['d']) player.x +=3;

    // Jump
    if((keys['ArrowUp']||keys['w']||keys[' ']) && player.onGround){
        player.vy=-10;
        player.onGround=false;
    }

    // Gravity
    player.vy+=0.5;
    player.y+=player.vy;

    // Collision with solid blocks in current slice
    player.onGround=false;
    let sliceZ=Math.round(player.z);
    for(let x=0; x<CHUNK_SIZE; x++){
        for(let y=0; y<MAX_HEIGHT; y++){
            let block = world[x][y][sliceZ];
            if(!block || block.type==='water') continue;
            let bx = x*BLOCK_SIZE, by = canvas.height - (y+1)*BLOCK_SIZE;

            if(block.type==='leaves' && block.semi){
                // Semi-solid top 8px
                if(player.x + player.w > bx && player.x < bx+BLOCK_SIZE &&
                   player.y + player.h > by + 8 && player.y < by + BLOCK_SIZE){
                    player.y = by +8 - player.h;
                    player.vy=0;
                    player.onGround=true;
                }
            } else {
                // Fully solid
                if(player.x + player.w > bx && player.x < bx+BLOCK_SIZE &&
                   player.y + player.h > by && player.y < by + BLOCK_SIZE){
                    player.y = by - player.h;
                    player.vy=0;
                    player.onGround=true;
                }
            }
        }
    }

    draw();
    requestAnimationFrame(update);
}

// Draw
function draw(){
    // Sky
    ctx.fillStyle = '#87CEFA';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Draw blocks in current slice
    let sliceZ=Math.round(player.z);
    for(let x=0; x<CHUNK_SIZE; x++){
        for(let y=0; y<MAX_HEIGHT; y++){
            let block = world[x][y][sliceZ];
            if(!block) continue;
            let bx = x*BLOCK_SIZE;
            let by = canvas.height - (y+1)*BLOCK_SIZE;
            ctx.fillStyle = COLORS[block.type] || '#AAAAAA';
            ctx.fillRect(bx,by,BLOCK_SIZE,BLOCK_SIZE);
        }
    }

    // Draw player (split upper/lower)
    ctx.fillStyle = '#008080'; // lower teal
    ctx.fillRect(player.x, player.y + player.h/2, player.w, player.h/2);
    ctx.fillStyle = '#D2B48C'; // upper tan
    ctx.fillRect(player.x, player.y, player.w, player.h/2);

    // Slice info
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText('Slice: '+sliceZ, 10,20);
}

update();
