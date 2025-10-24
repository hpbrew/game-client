import {
  TextureLoader,
  RepeatWrapping,
  MeshStandardMaterial,
  BackSide,
  Group,
  Vector3,
  Raycaster,
} from "three"

import { entity } from "./entity.js"
import { quadtree } from "./quadtree.js"
import { terrain_shader } from "./terrain-shader.js"
import { terrain_builder_threaded } from "./terrain-builder-threaded.js"
import { texture_splatter } from "./texture-splatter.js"
import { textures } from "./textures.js"
import { utils } from "./utils.js"

import { terrain_constants } from "../shared/terrain-constants.ts"
import { HeightGenerator } from "../shared/terrain-height.ts"

import { NoiseGenerator } from "../shared/noise.ts"

export class TerrainChunkManager {
  constructor(params) {
    this._Init(params)
  }

  _Init(params) {
    this._params = params

    const loader = new TextureLoader()

    const noiseTexture = loader.load(
      "not_my_resources/terrain/simplex-noise.png"
    )
    noiseTexture.wrapS = RepeatWrapping
    noiseTexture.wrapT = RepeatWrapping

    const diffuse = new textures.TextureAtlas(params)
    diffuse.Load("diffuse", [
      "not_my_resources/terrain/dirt_01_diffuse-1024.png",
      "not_my_resources/terrain/grass1-albedo3-1024.png",
      "not_my_resources/terrain/sandyground-albedo-1024.png",
      "not_my_resources/terrain/worn-bumpy-rock-albedo-1024.png",
      "not_my_resources/terrain/rock-snow-ice-albedo-1024.png",
      "not_my_resources/terrain/snow-packed-albedo-1024.png",
      "not_my_resources/terrain/rough-wet-cobble-albedo-1024.png",
      // 'not_my_resources/terrain/sandy-rocks1-albedo-1024.png',
      "not_my_resources/terrain/bark1-albedo.jpg",
    ])

    const normal = new textures.TextureAtlas(params)
    normal.Load("normal", [
      "not_my_resources/terrain/dirt_01_normal-1024.jpg",
      "not_my_resources/terrain/grass1-normal-1024.jpg",
      "not_my_resources/terrain/sandyground-normal-1024.jpg",
      "not_my_resources/terrain/worn-bumpy-rock-normal-1024.jpg",
      "not_my_resources/terrain/rock-snow-ice-normal-1024.jpg",
      "not_my_resources/terrain/snow-packed-normal-1024.jpg",
      "not_my_resources/terrain/rough-wet-cobble-normal-1024.jpg",
      // 'not_my_resources/terrain/sandy-rocks1-normal-1024.jpg',
      "not_my_resources/terrain/bark1-normal3.jpg",
    ])

    this._material = new MeshStandardMaterial({
      side: BackSide,
      vertexColors: true,
      wireframe: false,
    })

    // this._material.onBeforeCompile = (s) => {
    //   let a = 0
    //   let vsh = s.vertexShader
    //   vsh = terrain_shader.VS1 + s.vertexShader
    //   const vi1 = vsh.search("#include <fog_vertex>")
    //   vsh = [vsh.slice(0, vi1) + terrain_shader.VS2 + vsh.slice(vi1)].join("")
    //   s.vertexShader = vsh

    //   s.fragmentShader = terrain_shader.PS1 + s.fragmentShader
    //   const fi1 = s.fragmentShader.search("#include <lights_physical_fragment>")

    //   s.fragmentShader = [
    //     s.fragmentShader.slice(0, fi1) +
    //       // TODO: fix this
    //       // terrain_shader.PS2 + // This is commented out because it's crashing need to fix
    //       s.fragmentShader.slice(fi1),
    //   ].join("")

    //   s.uniforms.TRIPLANAR_normalMap = { value: normal.Info["normal"].atlas }
    //   s.uniforms.TRIPLANAR_diffuseMap = {
    //     value: diffuse.Info["diffuse"].atlas,
    //   }
    //   s.uniforms.TRIPLANAR_noiseMap = { value: noiseTexture }

    //   diffuse.onLoad = () => {
    //     s.uniforms.TRIPLANAR_diffuseMap.value = diffuse.Info["diffuse"].atlas
    //   }
    //   normal.onLoad = () => {
    //     s.uniforms.TRIPLANAR_normalMap.value = normal.Info["normal"].atlas
    //   }

    //   // s.fragmentShader += 'poop';
    // }

    this._builder =
      new terrain_builder_threaded.TerrainChunkRebuilder_Threaded()
    // this._builder = new terrain_builder.TerrainChunkRebuilder();

    this._InitNoise()
    this._InitBiomes(params)
    this._InitTerrain(params)
  }

  _InitNoise() {
    this.heightGenerator_ = new HeightGenerator()
  }

  _InitBiomes(params) {
    params.guiParams.biomes = {
      octaves: 2,
      persistence: 0.5,
      lacunarity: 2.0,
      scale: 1024.0,
      noiseType: "simplex",
      seed: 2,
      exponentiation: 2,
      height: 1.0,
    }

    const onNoiseChanged = () => {
      this._builder.Rebuild(this._chunks)
    }

    const noiseRollup = params.gui.addFolder("Terrain.Biomes")
    noiseRollup
      .add(params.guiParams.biomes, "scale", 64.0, 4096.0)
      .onChange(onNoiseChanged)
    noiseRollup
      .add(params.guiParams.biomes, "octaves", 1, 20, 1)
      .onChange(onNoiseChanged)
    noiseRollup
      .add(params.guiParams.biomes, "persistence", 0.01, 1.0)
      .onChange(onNoiseChanged)
    noiseRollup
      .add(params.guiParams.biomes, "lacunarity", 0.01, 4.0)
      .onChange(onNoiseChanged)
    noiseRollup
      .add(params.guiParams.biomes, "exponentiation", 0.1, 10.0)
      .onChange(onNoiseChanged)

    this._biomes = new NoiseGenerator(params.guiParams.biomes)
    this._biomesParams = params.guiParams.biomes

    const colourParams = {
      octaves: 1,
      persistence: 0.5,
      lacunarity: 2.0,
      exponentiation: 1.0,
      scale: 256.0,
      noiseType: "simplex",
      seed: 2,
      height: 1.0,
    }
    this._colourNoise = new NoiseGenerator(colourParams)
    this._colourNoiseParams = colourParams
  }

  _InitTerrain(params) {
    params.guiParams.terrain = {
      wireframe: true,
    }

    this._groups = [...new Array(6)].map((_) => new Group())
    params.scene.add(...this._groups)

    const terrainRollup = params.gui.addFolder("Terrain")
    terrainRollup.add(params.guiParams.terrain, "wireframe").onChange(() => {
      for (let k in this._chunks) {
        this._chunks[k].chunk._plane.material.wireframe =
          new MeshStandardMaterial({
            side: BackSide,
            vertexColors: true,
            wireframe: params.guiParams.terrain.wireframe,
          })
        // params.guiParams.terrain.wireframe
      }
    })

    this._chunks = {}
    this._params = params
  }

  _CreateTerrainChunk(group, groupTransform, offset, width, resolution) {
    const params = {
      group: group,
      transform: groupTransform,
      material: this._material,
      width: width,
      offset: offset,
      resolution: resolution,
      biomeGenerator: this._biomes,
      colourGenerator: new texture_splatter.TextureSplatter({
        biomeGenerator: this._biomes,
        colourNoise: this._colourNoise,
      }),
      heightGenerators: [this.heightGenerator_],
      noiseParams: terrain_constants.NOISE_PARAMS,
      colourNoiseParams: this._colourNoiseParams,
      biomesParams: this._biomesParams,
    }

    return this._builder.AllocateChunk(params)
  }

  raycastSelect(event, camera) {
    const mouse = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    }

    const raycaster = new Raycaster()
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(
      Object.values(this._chunks).map((c) => c.chunk._plane)
    )
    if (intersects.length > 0) {
      const p = intersects[0].point
      console.log(
        `Clicked on terrain at ${p.x.toFixed(2)}, ${p.y.toFixed(
          2
        )}, ${p.z.toFixed(2)} (height: ${this.getHeightAt(p.x, p.z).toFixed(
          2
        )})`
      )

      return {
        x: p.x,
        y: this.getHeightAt(p.x, p.z),
        z: p.z,
      }
    }

    return undefined
  }

  GetHeight(pos) {
    return this.heightGenerator_.Get(pos.x, 0.0, pos.z)
  }

  getHeightAt(x, z) {
    return this.heightGenerator_.Get(x, 0.0, z)[0]
  }

  GetBiomeAt(pos) {
    return this._biomes.Get(pos.x, 0.0, pos.z)
  }

  Update(_) {
    const target = this._params.target //this.FindEntity(this._params.target)

    this._builder.Update()
    if (!this._builder.Busy) {
      this._UpdateVisibleChunks_Quadtree(target)
    }

    for (let k in this._chunks) {
      this._chunks[k].chunk.Update(target.position)
    }
    for (let c of this._builder._old) {
      c.chunk.Update(target.position)
    }
  }

  _UpdateVisibleChunks_Quadtree(target) {
    function _Key(c) {
      return c.position[0] + "/" + c.position[2] + " [" + c.size + "]"
    }

    const quadTree = new quadtree.CubeQuadTree({
      radius: terrain_constants.VIEWER_RADIUS,
      min_node_size: terrain_constants.QT_MIN_CELL_SIZE,
    })
    quadTree.Insert(target.position)

    const sides = quadTree.GetChildren()

    let newTerrainChunks = {}
    const center = new Vector3()
    const dimensions = new Vector3()
    for (let i = 0; i < sides.length; i++) {
      for (let c of sides[i].children) {
        c.bounds.getCenter(center)
        c.bounds.getSize(dimensions)

        const child = {
          index: i,
          group: this._groups[i],
          transform: sides[i].transform,
          position: [center.x, center.y, center.z],
          bounds: c.bounds,
          size: dimensions.x,
        }

        const k = _Key(child)
        newTerrainChunks[k] = child
      }
    }

    const intersection = utils.DictIntersection(this._chunks, newTerrainChunks)
    // Compare list of terrain chunks to the list we already have
    const difference = utils.DictDifference(newTerrainChunks, this._chunks)
    const recycle = Object.values(
      utils.DictDifference(this._chunks, newTerrainChunks)
    )

    // Keep the old chunks so we don't rebuild them if not required
    this._builder.RetireChunks(recycle)

    newTerrainChunks = intersection

    for (let k in difference) {
      const [xp, yp, zp] = difference[k].position

      const offset = new Vector3(xp, yp, zp)
      newTerrainChunks[k] = {
        position: [xp, zp],
        chunk: this._CreateTerrainChunk(
          difference[k].group,
          difference[k].transform,
          offset,
          difference[k].size,
          terrain_constants.QT_MIN_CELL_RESOLUTION
        ),
      }
    }

    this._chunks = newTerrainChunks
  }
}
