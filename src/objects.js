import * as THREE from 'three';

export function createNearbyBox() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0xff8800 });
    const box = new THREE.Mesh(geometry, material);

    // Add black outline
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const outline = new THREE.LineSegments(edges, lineMaterial);
    box.add(outline);

    box.position.set(2, 0.5, 0); // 2 units to the right of the starting cube
    return box;
}