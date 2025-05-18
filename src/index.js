// This file initializes the Three.js scene, camera, and renderer, and starts the animation loop.

import * as THREE from 'three';
import { MainScene } from './scenes/mainScene';

const scene = new MainScene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

function animate() {
    requestAnimationFrame(animate);
    scene.update();
    renderer.render(scene, camera);
}

animate();