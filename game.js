// Using Three.js for a pseudo-2D platformer in a 3D world
// Player moves in X (left/right), Y (up/down) and scroll moves Z

import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Player
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(geometry, material);
scene.add(player);

player.position.set(0, 0, 0);

// Floor
const floorGeo = new THREE.BoxGeometry(50, 1, 50);
const floorMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.position.set(0, -1, 0);
scene.add(floor);

camera.position.set(0, 5, 10);
camera.lookAt(player.position);

// Controls
const keys = {};
document.addEventListener('keydown', (e) => { keys[e.key] = true; });
document.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Scroll moves player in Z
window.addEventListener('wheel', (e) => {
    player.position.z += e.deltaY * 0.01; // scroll speed
});

function animate() {
    requestAnimationFrame(animate);

    // Basic movement X/Y
    if (keys['ArrowLeft']) player.position.x -= 0.1;
    if (keys['ArrowRight']) player.position.x += 0.1;
    if (keys['ArrowUp']) player.position.y += 0.1;
    if (keys['ArrowDown']) player.position.y -= 0.1;

    camera.position.z = player.position.z + 10; // follow player in Z
    camera.position.x = player.position.x;
    camera.lookAt(player.position);

    renderer.render(scene, camera);
}
animate();
