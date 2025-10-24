import { simplex } from "./simplex-noise.mjs"

export class NoiseGenerator {
    private _params: {
      exponentiation: number
      height: number
      lacunarity: number
      octaves: number
      persistence: number
      scale: number
      seed: number
    }
    private _noise!: InstanceType<typeof simplex.SimplexNoise>

    constructor(params: {
      exponentiation: number
      height: number
      lacunarity: number
      octaves: number
      persistence: number
      scale: number
      seed: number
    }) {
      this._params = params
      this._Init()
    }

    _Init() {
      this._noise = new simplex.SimplexNoise(this._params.seed)
    }

    Get(x: number, y: number, z: number) {
      const G = 2.0 ** -this._params.persistence
      const xs = x / this._params.scale
      const ys = y / this._params.scale
      const zs = z / this._params.scale
      const noiseFunc = this._noise

      let amplitude = 1.0
      let frequency = 1.0
      let normalization = 0
      let total = 0
      for (let o = 0; o < this._params.octaves; o++) {
        const noiseValue =
          noiseFunc.noise3D(xs * frequency, ys * frequency, zs * frequency) *
            0.5 +
          0.5

        total += noiseValue * amplitude
        normalization += amplitude
        amplitude *= G
        frequency *= this._params.lacunarity
      }
      total /= normalization
      return Math.pow(total, this._params.exponentiation) * this._params.height
    }
  }
