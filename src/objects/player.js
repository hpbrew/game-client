import * as THREE from "three"
import { getSmileyTexture } from "../scenes/smileyTexture"

export class Player extends THREE.Mesh {
    constructor() {
        const playerGeometry = new THREE.BoxGeometry()
        const materials = []
        const smileyTexture = getSmileyTexture()
        for (let i = 0; i < 6; i++) {
            if (i === 5) {
                materials.push(new THREE.MeshBasicMaterial({ map: smileyTexture }))
            } else {
                materials.push(new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
            }
        }
        super(playerGeometry, materials)

        // Add a black border using EdgesGeometry and LineSegments
        const edges = new THREE.EdgesGeometry(playerGeometry)
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            linewidth: 2,
        })
        const line = new THREE.LineSegments(edges, lineMaterial)
        this.add(line)

        // Add a blue circle to the front side of the cube
        const frontCircleGeometry = new THREE.CircleGeometry(0.18, 32)
        const frontCircleMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff })
        const frontBlueCircle = new THREE.Mesh(frontCircleGeometry, frontCircleMaterial)
        frontBlueCircle.position.set(0, 0, 0.501)
        this.add(frontBlueCircle)

        this.position.y = 0.5
    }
}