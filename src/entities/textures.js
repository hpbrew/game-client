import {
  RepeatWrapping,
  LinearFilter,
  LinearMipMapLinearFilter,
  UnsignedByteType,
  RGBAFormat,
  DataArrayTexture,
  TextureLoader,
  LoadingManager,
  // sRGBEncoding,
} from "three"

export const textures = (function () {
  // Taken from https://github.com/mrdoob/three.js/issues/758
  function _GetImageData(image) {
    var canvas = document.createElement("canvas")
    canvas.width = image.width
    canvas.height = image.height

    var context = canvas.getContext("2d")
    context.drawImage(image, 0, 0)

    return context.getImageData(0, 0, image.width, image.height)
  }

  return {
    TextureAtlas: class {
      constructor(params) {
        this._threejs = params.threejs
        this._Create()
        this.onLoad = () => {}
      }

      Load(atlas, names) {
        this._LoadAtlas(atlas, names)
      }

      _Create() {
        this._manager = new LoadingManager()
        this._loader = new TextureLoader(this._manager)
        this._textures = {}

        this._manager.onLoad = () => {
          this._OnLoad()
        }
      }

      get Info() {
        return this._textures
      }

      _LoadTexture(n) {
        const t = this._loader.load(n)
        // t.encoding = sRGBEncoding
        return t
      }

      _OnLoad() {
        for (let k in this._textures) {
          const atlas = this._textures[k]
          const data = new Uint8Array(atlas.textures.length * 4 * 1024 * 1024)

          for (let t = 0; t < atlas.textures.length; t++) {
            const curTexture = atlas.textures[t]
            const curData = _GetImageData(curTexture.image)
            const offset = t * (4 * 1024 * 1024)

            data.set(curData.data, offset)
          }

          const diffuse = new DataArrayTexture(
            data,
            1024,
            1024,
            atlas.textures.length
          )
          diffuse.format = RGBAFormat
          diffuse.type = UnsignedByteType
          diffuse.minFilter = LinearMipMapLinearFilter
          diffuse.magFilter = LinearFilter
          diffuse.wrapS = RepeatWrapping
          diffuse.wrapT = RepeatWrapping
          diffuse.generateMipmaps = true

          const caps = this._threejs.capabilities
          // const aniso = caps.getMaxAnisotropy()

          diffuse.anisotropy = 4

          atlas.atlas = diffuse
        }

        this.onLoad()
      }

      _LoadAtlas(atlas, names) {
        this._textures[atlas] = {
          textures: names.map((n) => this._LoadTexture(n)),
          atlas: null,
        }
      }
    },
  }
})()
