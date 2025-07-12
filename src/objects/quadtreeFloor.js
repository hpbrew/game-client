import * as THREE from "three"

// Simple height function: hills using sine/cosine, can be replaced with noise for more realism
function getHeight(x, z) {
  // Example: rolling hills
  return (
    Math.sin(x * 0.08) * 2 +
    Math.cos(z * 0.08) * 2 +
    Math.sin((x + z) * 0.04) * 1.5
  )
}

class QuadtreeTile extends THREE.Mesh {
  constructor(size, segments, x, z) {
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
    geometry.rotateX(-Math.PI / 2)
    // Quantize vertices for a stylized look and apply height
    const step = size / segments
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const vx = Math.round(geometry.attributes.position.getX(i) / step) * step + x
      const vz = Math.round(geometry.attributes.position.getZ(i) / step) * step + z
      const vy = getHeight(vx, vz)
      geometry.attributes.position.setX(i, vx - x)
      geometry.attributes.position.setY(i, vy)
      geometry.attributes.position.setZ(i, vz - z)
    }
    geometry.attributes.position.needsUpdate = true

    const material = new THREE.MeshBasicMaterial({
      color: 0x808080,
      wireframe: true,
      side: THREE.DoubleSide,
      opacity: 0.7,
      transparent: true,
    })
    super(geometry, material)
    this.position.set(x, 0, z)
    this.size = size
    this.segments = segments
  }
}

export class QuadtreeFloor extends THREE.Group {
  constructor({
    worldSize = 200,
    minTileSize = 10,
    maxSegments = 64,
    minSegments = 8,
    lodDistances = [20, 40, 80, 160],
    mapResolution = 201 // Number of grid points per side
  } = {}) {
    super()
    this.worldSize = worldSize
    this.minTileSize = minTileSize
    this.maxSegments = maxSegments
    this.minSegments = minSegments
    this.lodDistances = lodDistances
    this.tiles = []
    this.mapResolution = mapResolution
    this.terrainMap = this._generateTerrainMap()
    this._createTiles()
  }

  _generateTerrainMap() {
    // Create a 2D array of heights
    const map = []
    const step = this.worldSize / (this.mapResolution - 1)
    const half = this.worldSize / 2
    for (let i = 0; i < this.mapResolution; i++) {
      map[i] = []
      for (let j = 0; j < this.mapResolution; j++) {
        const x = -half + i * step
        const z = -half + j * step
        map[i][j] = getHeight(x, z)
      }
    }
    return map
  }

  _createTiles() {
    const half = this.worldSize / 2
    const tileCount = Math.ceil(this.worldSize / this.minTileSize)
    for (let i = 0; i < tileCount; i++) {
      for (let j = 0; j < tileCount; j++) {
        const x = -half + i * this.minTileSize + this.minTileSize / 2
        const z = -half + j * this.minTileSize + this.minTileSize / 2
        // Start with lowest LOD (minSegments)
        const tile = new QuadtreeTile(this.minTileSize, this.minSegments, x, z)
        this.tiles.push(tile)
        this.add(tile)
      }
    }
  }

  updateLOD(camera) {
    for (const tile of this.tiles) {
      const dist = camera.position.distanceTo(tile.position)
      let segments = this.minSegments
      for (let l = 0; l < this.lodDistances.length; l++) {
        if (dist < this.lodDistances[l]) {
          segments = this.maxSegments / Math.pow(2, l)
          break
        }
      }
      // Only update geometry if segments changed
      if (tile.segments !== segments) {
        const newGeom = new THREE.PlaneGeometry(tile.size, tile.size, segments, segments)
        newGeom.rotateX(-Math.PI / 2)
        const step = tile.size / segments
        for (let i = 0; i < newGeom.attributes.position.count; i++) {
          const vx = Math.round(newGeom.attributes.position.getX(i) / step) * step + tile.position.x
          const vz = Math.round(newGeom.attributes.position.getZ(i) / step) * step + tile.position.z
          const vy = getHeight(vx, vz)
          newGeom.attributes.position.setX(i, vx - tile.position.x)
          newGeom.attributes.position.setY(i, vy)
          newGeom.attributes.position.setZ(i, vz - tile.position.z)
        }
        newGeom.attributes.position.needsUpdate = true
        tile.geometry.dispose()
        tile.geometry = newGeom
        tile.segments = segments
      }
    }
  }

  getHeightAt(x, z) {
    const half = this.worldSize / 2
    const step = this.worldSize / (this.mapResolution - 1)
    const fx = (x + half) / step
    const fz = (z + half) / step

    const ix = Math.floor(fx)
    const iz = Math.floor(fz)
    const tx = fx - ix
    const tz = fz - iz

    // Clamp indices
    const ix1 = Math.min(ix + 1, this.mapResolution - 1)
    const iz1 = Math.min(iz + 1, this.mapResolution - 1)

    // Bilinear interpolation
    const h00 = this.terrainMap[ix][iz]
    const h10 = this.terrainMap[ix1][iz]
    const h01 = this.terrainMap[ix][iz1]
    const h11 = this.terrainMap[ix1][iz1]

    const h0 = h00 * (1 - tx) + h10 * tx
    const h1 = h01 * (1 - tx) + h11 * tx
    return h0 * (1 - tz) + h1 * tz
  }
}