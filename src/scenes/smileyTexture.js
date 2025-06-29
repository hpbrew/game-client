import * as THREE from 'three';

export function getSmileyTexture() {
    const smileyCanvas = document.createElement('canvas');
    smileyCanvas.width = 256;
    smileyCanvas.height = 256;
    const ctx = smileyCanvas.getContext('2d');
    // Background
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(0, 0, 256, 256);
    // Face
    ctx.beginPath();
    ctx.arc(128, 128, 100, 0, Math.PI * 2, true); // Outer circle
    ctx.fillStyle = '#ffff00';
    ctx.fill();
    // Eyes
    ctx.beginPath();
    ctx.arc(88, 110, 15, 0, Math.PI * 2, true); // Left eye
    ctx.arc(168, 110, 15, 0, Math.PI * 2, true); // Right eye
    ctx.fillStyle = '#000000';
    ctx.fill();
    // Smile
    ctx.beginPath();
    ctx.arc(128, 150, 50, 0, Math.PI, false); // Mouth (clockwise)
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    return new THREE.CanvasTexture(smileyCanvas);
}