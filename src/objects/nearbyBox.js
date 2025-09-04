import * as THREE from 'three';

export function createNearbyBox(floor = null) {
    const geometry = new THREE.BoxGeometry(2,2,2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff8800 });
    const box = new THREE.Mesh(geometry, material);

    // Add black outline
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const outline = new THREE.LineSegments(edges, lineMaterial);
    box.add(outline);

    // Default position
    let x = 2, z = 0;
    let y = 0.5;
    if (floor && typeof floor.getHeightAt === 'function') {
        y = floor.getHeightAt(x, z) + 0.5;
    }
    box.position.set(x, y, z); // 2 units to the right of the starting cube
    return box;
}