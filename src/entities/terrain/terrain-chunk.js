import { BufferGeometry, Mesh, Float32BufferAttribute } from "three"

export const terrain_chunk = (function () {
  class TerrainChunk {
    constructor(params) {
      this._params = params
      this._Init(params)
    }

    Destroy() {
      this._params.group.remove(this._plane)
    }

    Hide() {
      this._plane.visible = false
    }

    Show() {
      this._plane.visible = true
    }

    _Init(params) {
      this._geometry = new BufferGeometry()
      this._plane = new Mesh(this._geometry, params.material)
      this._plane.castShadow = false
      this._plane.receiveShadow = true
      this._plane.frustumCulled = false
      this._params.group.add(this._plane)
      this.Reinit(params)
    }

    Update(cameraPosition) {
      // this._plane.position.copy(this._params.origin);
      // this._plane.position.sub(cameraPosition);
    }

    Reinit(params) {
      this._params = params
      this._plane.position.set(0, 0, 0)
    }

    RebuildMeshFromData(data) {
      this._plane.geometry.setAttribute(
        "position",
        new Float32BufferAttribute(data.positions, 3)
      )
      this._plane.geometry.setAttribute(
        "color",
        new Float32BufferAttribute(data.colours, 3)
      )
      this._plane.geometry.setAttribute(
        "normal",
        new Float32BufferAttribute(data.normals, 3)
      )
      this._plane.geometry.setAttribute(
        "coords",
        new Float32BufferAttribute(data.coords, 3)
      )
      this._plane.geometry.setAttribute(
        "weights1",
        new Float32BufferAttribute(data.weights1, 4)
      )
      this._plane.geometry.setAttribute(
        "weights2",
        new Float32BufferAttribute(data.weights2, 4)
      )
      this._plane.geometry.computeBoundingBox()
    }
  }

  return {
    TerrainChunk: TerrainChunk,
  }
})()
