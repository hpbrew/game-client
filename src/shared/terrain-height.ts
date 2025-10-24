import { terrain_constants } from "./terrain-constants.ts"
import { NoiseGenerator } from "./noise.js"

export class HeightGenerator {
    noise_: NoiseGenerator
    constructor() {
      this.noise_ = new NoiseGenerator(terrain_constants.NOISE_PARAMS)
    }

    Get(x: number, y: number, z: number) {
      return [this.noise_.Get(x, y, z), 1]
    }
  }

