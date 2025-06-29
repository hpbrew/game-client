import * as THREE from 'three';

export function createBoxGeometry(width, height, depth) {
    return new THREE.BoxGeometry(width, height, depth);
}

export function createMesh(material, geometry) {
    return new THREE.Mesh(geometry, material);
}

export function createBasicMaterial(color) {
    return new THREE.MeshBasicMaterial({ color });
}

export function animate(callback) {
    requestAnimationFrame(animate.bind(null, callback));
    callback();
}