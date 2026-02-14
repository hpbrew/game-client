import * as THREE from "three"

// Simple base height function (rolling hills)
function baseHeight(x, z) {
  return (
    Math.sin(x * 0.08) * 2 +
    Math.cos(z * 0.08) * 2 +
    Math.sin((x + z) * 0.04) * 1.5
  )
}

function createPlaneGeometryWithHoles(
  size,
  segments,
  tileCenterX,
  tileCenterZ,
  floorRef,
  caves = []
) {
  // base plane
  const geom = new THREE.PlaneGeometry(size, size, segments, segments)
  geom.rotateX(-Math.PI / 2)

  // positions are local to the tile; convert to world coords by adding tile center
  const posAttr = geom.attributes.position
  const idx = geom.index.array
  const newIndices = []
  const pA = new THREE.Vector3()
  const pB = new THREE.Vector3()
  const pC = new THREE.Vector3()
  const centroid = new THREE.Vector3()

  for (let i = 0; i < idx.length; i += 3) {
    const ia = idx[i]
    const ib = idx[i + 1]
    const ic = idx[i + 2]

    pA.fromBufferAttribute(posAttr, ia).add(
      new THREE.Vector3(tileCenterX, 0, tileCenterZ)
    )
    pB.fromBufferAttribute(posAttr, ib).add(
      new THREE.Vector3(tileCenterX, 0, tileCenterZ)
    )
    pC.fromBufferAttribute(posAttr, ic).add(
      new THREE.Vector3(tileCenterX, 0, tileCenterZ)
    )

    centroid.set(
      (pA.x + pB.x + pC.x) / 3,
      (pA.y + pB.y + pC.y) / 3,
      (pA.z + pB.z + pC.z) / 3
    )

    // check if centroid falls inside any cave footprint
    let insideHole = false
    for (const c of caves) {
      const dx = centroid.x - c.x
      const dz = centroid.z - c.z
      if (Math.sqrt(dx * dx + dz * dz) < c.radius) {
        insideHole = true
        break
      }
    }

    if (!insideHole) {
      newIndices.push(ia, ib, ic)
    }
  }

  // set new index, update vertex heights using floorRef.getHeight
  geom.setIndex(newIndices)
  const step = size / segments
  for (let i = 0; i < posAttr.count; i++) {
    const localX = posAttr.getX(i) + tileCenterX
    const localZ = posAttr.getZ(i) + tileCenterZ
    const y = floorRef.getHeight(localX, localZ)
    posAttr.setY(i, y)
  }

  geom.attributes.position.needsUpdate = true
  geom.computeVertexNormals()
  geom.computeBoundingSphere()
  geom.computeBoundingBox()

  return geom
}

class QuadtreeTile extends THREE.Mesh {
  constructor(size, segments, x, z, floorRef) {
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
    geometry.rotateX(-Math.PI / 2)
    // Quantize vertices for a stylized look and apply height via floorRef
    const step = size / segments
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const vx =
        Math.round(geometry.attributes.position.getX(i) / step) * step + x
      const vz =
        Math.round(geometry.attributes.position.getZ(i) / step) * step + z
      const vy = floorRef.getHeight(vx, vz)
      geometry.attributes.position.setX(i, vx - x)
      geometry.attributes.position.setY(i, vy)
      geometry.attributes.position.setZ(i, vz - z)
    }

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
    mapResolution = 201, // Number of grid points per side
    caves = [], // optional initial caves
  } = {}) {
    super()
    this.worldSize = worldSize
    this.minTileSize = minTileSize
    this.maxSegments = maxSegments
    this.minSegments = minSegments
    this.lodDistances = lodDistances
    this.tiles = []
    this.mapResolution = mapResolution
    this.caves = caves // array of { x, z, radius, depth, falloff }
    this.terrainMap = this._generateTerrainMap()
    this._createTiles()
  }

  // Add a cave and rebuild terrain map / tiles
  addCave(x, z, radius = 8, depth = 6, falloff = 1.0) {
    this.caves.push({ x, z, radius, depth, falloff })
    // regenerate heightmap and update tiles
    this.terrainMap = this._generateTerrainMap()
    // rebuild tile geometries to include cave
    for (const tile of this.tiles) {
      const segments = tile.segments
      const newGeom = new THREE.PlaneGeometry(
        tile.size,
        tile.size,
        segments,
        segments
      )
      newGeom.rotateX(-Math.PI / 2)
      const step = tile.size / segments
      for (let i = 0; i < newGeom.attributes.position.count; i++) {
        const vx =
          Math.round(newGeom.attributes.position.getX(i) / step) * step +
          tile.position.x
        const vz =
          Math.round(newGeom.attributes.position.getZ(i) / step) * step +
          tile.position.z
        const vy = this.getHeight(vx, vz)
        newGeom.attributes.position.setX(i, vx - tile.position.x)
        newGeom.attributes.position.setY(i, vy)
        newGeom.attributes.position.setZ(i, vz - tile.position.z)
      }
      newGeom.attributes.position.needsUpdate = true
      tile.geometry.dispose()
      tile.geometry = newGeom
    }
  }

  // Get composite height including caves
  getHeight(x, z) {
    let h = baseHeight(x, z)
    if (this.caves && this.caves.length) {
      for (const c of this.caves) {
        const dx = x - c.x
        const dz = z - c.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < c.radius) {
          const t = Math.min(1, Math.max(0, dist / c.radius)) // 0 at center -> 1 at edge
          const influence = 1 - t
          // optional nonlinear falloff
          const fall = Math.pow(influence, c.falloff || 1.0)
          // carve into the terrain (lower height by depth * fall)
          h -= c.depth * fall
        }
      }
    }
    return h
  }

  _generateTerrainMap() {
    // Create a 2D array of heights using getHeight (includes caves)
    const map = []
    const step = this.worldSize / (this.mapResolution - 1)
    const half = this.worldSize / 2
    for (let i = 0; i < this.mapResolution; i++) {
      map[i] = []
      for (let j = 0; j < this.mapResolution; j++) {
        const x = -half + i * step
        const z = -half + j * step
        map[i][j] = this.getHeight(x, z)
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
        const tile = new QuadtreeTile(
          this.minTileSize,
          this.minSegments,
          x,
          z,
          this
        )
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
        const newGeom = new THREE.PlaneGeometry(
          tile.size,
          tile.size,
          segments,
          segments
        )
        newGeom.rotateX(-Math.PI / 2)
        const step = tile.size / segments
        for (let i = 0; i < newGeom.attributes.position.count; i++) {
          const vx =
            Math.round(newGeom.attributes.position.getX(i) / step) * step +
            tile.position.x
          const vz =
            Math.round(newGeom.attributes.position.getZ(i) / step) * step +
            tile.position.z
          const vy = this.getHeight(vx, vz)
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

    // Bilinear interpolation of the precomputed map (map includes caves)
    const h00 = this.terrainMap[ix]
      ? this.terrainMap[ix][iz]
      : this.getHeight(x, z)
    const h10 = this.terrainMap[ix1]
      ? this.terrainMap[ix1][iz]
      : this.getHeight(x, z)
    const h01 = this.terrainMap[ix]
      ? this.terrainMap[ix][iz1]
      : this.getHeight(x, z)
    const h11 = this.terrainMap[ix1]
      ? this.terrainMap[ix1][iz1]
      : this.getHeight(x, z)

    const h0 = h00 * (1 - tx) + h10 * tx
    const h1 = h01 * (1 - tx) + h11 * tx
    return h0 * (1 - tz) + h1 * tz
  }
}
