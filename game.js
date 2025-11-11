const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const BLOCK_SIZE = 16;
const CHUNK_SIZE = 16; // X × Z
const MAX_HEIGHT = 20; // Y-axis

// Colors
const COLORS = {
    grass:'#228B22',
    dirt:'#8B4513',
    stone:'#808080',
    leaves:'#90EE90',
    wood:'#D2B48C',
    water:'#1E90FF'
};

// Smooth pseudo-noise terrain
function smoothNoise(x,z){
    return (Math.sin(x*0.1+z*0.15) + Math.sin(x*0.05+z*0.1)*0.5 + 1)*0.5;
}

// 3D world array
let world = [];
for(let x=0;x<CHUNK_SIZE;x++){
    world[x]=[];
    for(let y=0;y<MAX_HEIGHT;y++){
        world[x][y]=[];
        for(let z=0;z<CHUNK_SIZE;z++){
            world[x][y][z] = null;
        }
    }
}

// Terrain generation
for(let x=0;x<CHUNK_SIZE;x++){
    for(let z=0;z<CHUNK_SIZE;z++){
        let height = Math.floor(smoothNoise(x,z)*10)+5;

        for(let y=0;y<height;y++){
            if(y>0 && Math.random()<0.05) continue; // vertical gaps/caves

            let type='stone';
            if(y>=height-3 && y<height-1) type='dirt';
            if(y===height-1) type='grass';

            world[x][y][z] = {type:type, solid:true};
        }

        // Water at low terrain
        if(height<8){
            world[x][height][z] = {type:'water', solid:false};
        }

        // Tree spawn
        if(Math.random()<0.1 && height<MAX_HEIGHT-5){
            let trunkHeight = 3 + Math.floor(Math.random()*2);
            for(let t=0;t<trunkHeight;t++){
                world[x][height+t][z] = {type:'wood', solid:true};
            }
            // Leaves 3x3x3
            for(let lx=-1;lx<=1;lx++){
                for(let ly=0;ly<3;ly++){
                    for(let lz=-1;lz<=1;lz++){
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

// Compute top terrain height per slice (for cave rendering)
let topHeight = [];
for(let x=0;x<CHUNK_SIZE;x++){
    topHeight[x] = [];
    for(let z=0;z<CHUNK_SIZE;z++){
        topHeight[x][z] = 0;
        for(let y=MAX_HEIGHT-1;y>=0;y--){
            if(world[x][y][z]){
                topHeight[x][z] = y+1;
                break;
            }
        }
    }
}

// Player spawn
let spawnX=2, spawnZ=0;
let spawnY = 0;
for(let y=MAX_HEIGHT-1;y>=0;y--){
    if(world[spawnX][y][spawnZ] && world[spawnX][y][spawnZ].solid){
        spawnY = canvas.height - (y+1)*BLOCK_SIZE - 30;
        break;
    }
}

// Player object
let player = {
    x: spawnX*BLOCK_SIZE,
    y: spawnY,
    w: BLOCK_SIZE,
    h: 30,
    vy:0,
    onGround:false,
    z: spawnZ,
    targetZ: spawnZ
};

// Controls
const keys = {};
document.addEventListener('keydown', e=>keys[e.key]=true);
document.addEventListener('keyup', e=>keys[e.key]=false);
window.addEventListener('wheel', e=>{
    player.targetZ -= Math.sign(e.deltaY); // scroll up → forward
    if(player.targetZ<0) player.targetZ=0;
    if(player.targetZ>CHUNK_SIZE-1) player.targetZ=CHUNK_SIZE-1;
});

// Game loop
function update(){
    player.z += (player.targetZ - player.z)*0.2;

    // Horizontal movement
    if(keys['ArrowLeft']||keys['a']) player.x -= 3;
    if(keys['ArrowRight']||keys['d']) player.x += 3;

    // Jump
    if((keys['ArrowUp']||keys['w']||keys[' ']) && player.onGround){
        player.vy=-10;
        player.onGround=false;
    }

    // Gravity
    player.vy += 0.5;
    player.y += player.vy;

    // Collision
    player.onGround=false;
    let sliceZ = Math.round(player.z);
    for(let x=0;x<CHUNK_SIZE;x++){
        for(let y=0;y<MAX_HEIGHT;y++){
            let block = world[x][y][sliceZ];
            if(!block || block.type==='water') continue;

            let bx = x*BLOCK_SIZE;
            let by = canvas.height-(y+1)*BLOCK_SIZE;

            if(block.type==='leaves' && block.semi){
                if(player.x+player.w>bx && player.x<bx+BLOCK_SIZE &&
                   player.y+player.h>by+8 && player.y<by+BLOCK_SIZE){
                    player.y = by+8 - player.h;
                    player.vy=0;
                    player.onGround=true;
                }
            } else {
                if(player.x+player.w>bx && player.x<bx+BLOCK_SIZE &&
                   player.y+player.h>by && player.y<by+BLOCK_SIZE){
                    player.y = by - player.h;
                    player.vy=0;
                    player.onGround=true;
                }
            }
        }
    }

    // Respawn if fallen
    if(player.y > canvas.height){
        player.x = spawnX*BLOCK_SIZE;
        player.y = spawnY;
        player.vy = 0;
        player.z = spawnZ;
        player.targetZ = spawnZ;
    }

    draw();
    requestAnimationFrame(update);
}

// Draw
function draw(){
    ctx.fillStyle = '#87CEFA';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    let sliceZ = Math.round(player.z);

    for(let x=0;x<CHUNK_SIZE;x++){
        for(let y=0;y<MAX_HEIGHT;y++){
            let block = world[x][y][sliceZ];
            let bx = x*BLOCK_SIZE;
            let by = canvas.height-(y+1)*BLOCK_SIZE;

            // Draw block or cave black
            if(block){
                if(block.type==='wood'){
                    ctx.fillStyle = COLORS.wood;
                    ctx.fillRect(bx,by,BLOCK_SIZE,BLOCK_SIZE);
                } else if(block.type==='leaves'){
                    let leftSlice = sliceZ-1>=0?world[x][y][sliceZ-1]:null;
                    let rightSlice = sliceZ+1<CHUNK_SIZE?world[x][y][sliceZ+1]:null;
                    let showLeaf = true;

                    if((leftSlice && leftSlice.type==='leaves')||(rightSlice && rightSlice.type==='leaves')){
                        showLeaf=true;
                    }

                    if(showLeaf){
                        ctx.fillStyle = COLORS.leaves;
                        ctx.fillRect(bx,by,BLOCK_SIZE,BLOCK_SIZE);
                    }
                } else {
                    ctx.fillStyle = COLORS[block.type] || '#AAAAAA';
                    ctx.fillRect(bx,by,BLOCK_SIZE,BLOCK_SIZE);
                }
            } else if(y < topHeight[x][sliceZ]){
                ctx.fillStyle = '#000000';
                ctx.fillRect(bx,by,BLOCK_SIZE,BLOCK_SIZE);
            }
        }
    }

    // Player
    ctx.fillStyle = '#008080';
    ctx.fillRect(player.x, player.y + player.h/2, player.w, player.h/2);
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(player.x, player.y, player.w, player.h/2);

    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText('Slice: ' + (sliceZ+1),10,20);
}

update();
