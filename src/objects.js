import * as THREE from 'three';

export function createNearbyBox() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0xff8800 });
    const box = new THREE.Mesh(geometry, material);
    box.position.set(2, 0.5, 0); // 2 units to the right of the starting cube
    return box;
}