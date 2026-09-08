import {
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from "three"

const DIFFUSE_PATHS = [
  "not_my_resources/terrain/dirt_01_diffuse-1024.png",
  "not_my_resources/terrain/grass1-albedo3-1024.png",
  "not_my_resources/terrain/sandyground-albedo-1024.png",
  "not_my_resources/terrain/worn-bumpy-rock-albedo-1024.png",
  "not_my_resources/terrain/rock-snow-ice-albedo-1024.png",
  "not_my_resources/terrain/snow-packed-albedo-1024.png",
  "not_my_resources/terrain/rough-wet-cobble-albedo-1024.png",
  "not_my_resources/terrain/bark1-albedo.jpg",
]

export function createTerrainMaterial(
  loader = new TextureLoader(),
  noiseTexture,
) {
  const terrainTextures = DIFFUSE_PATHS.map((path) => {
    const texture = loader.load(path)
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.colorSpace = SRGBColorSpace
    return texture
  })

  const material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.0,
  })

  material.onBeforeCompile = (shader) => {
    terrainTextures.forEach((texture, index) => {
      shader.uniforms[`terrainTexture${index}`] = { value: texture }
    })
    shader.uniforms.terrainNoise = { value: noiseTexture }

    shader.vertexShader = shader.vertexShader.replace(
      "#include <common>",
      `#include <common>
attribute vec4 weights1;
attribute vec4 weights2;
varying vec3 vTerrainPosition;
varying vec3 vTerrainNormal;
varying vec4 vTerrainWeights1;
varying vec4 vTerrainWeights2;`,
    )
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
vTerrainPosition = position;
vTerrainNormal = normalize(normal);
vTerrainWeights1 = weights1;
vTerrainWeights2 = weights2;`,
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
    uniform sampler2D terrainTexture0;
    uniform sampler2D terrainTexture1;
    uniform sampler2D terrainTexture2;
    uniform sampler2D terrainTexture3;
    uniform sampler2D terrainTexture4;
    uniform sampler2D terrainTexture5;
    uniform sampler2D terrainTexture6;
    uniform sampler2D terrainTexture7;
uniform sampler2D terrainNoise;
varying vec3 vTerrainPosition;
varying vec3 vTerrainNormal;
varying vec4 vTerrainWeights1;
varying vec4 vTerrainWeights2;

vec3 terrainTriplanarSample(int layer, vec3 position, vec3 normal) {
  vec3 blend = pow(abs(normal), vec3(4.0));
  blend /= max(blend.x + blend.y + blend.z, 0.0001);
  vec2 xUv = position.zy / 12.0;
  vec2 yUv = position.xz / 12.0;
  vec2 zUv = position.xy / 12.0;
  vec3 xSample = vec3(0.0);
  vec3 ySample = vec3(0.0);
  vec3 zSample = vec3(0.0);
  if (layer == 0) {
    xSample = texture(terrainTexture0, xUv).rgb;
    ySample = texture(terrainTexture0, yUv).rgb;
    zSample = texture(terrainTexture0, zUv).rgb;
  } else if (layer == 1) {
    xSample = texture(terrainTexture1, xUv).rgb;
    ySample = texture(terrainTexture1, yUv).rgb;
    zSample = texture(terrainTexture1, zUv).rgb;
  } else if (layer == 2) {
    xSample = texture(terrainTexture2, xUv).rgb;
    ySample = texture(terrainTexture2, yUv).rgb;
    zSample = texture(terrainTexture2, zUv).rgb;
  } else if (layer == 3) {
    xSample = texture(terrainTexture3, xUv).rgb;
    ySample = texture(terrainTexture3, yUv).rgb;
    zSample = texture(terrainTexture3, zUv).rgb;
  } else if (layer == 4) {
    xSample = texture(terrainTexture4, xUv).rgb;
    ySample = texture(terrainTexture4, yUv).rgb;
    zSample = texture(terrainTexture4, zUv).rgb;
  } else if (layer == 5) {
    xSample = texture(terrainTexture5, xUv).rgb;
    ySample = texture(terrainTexture5, yUv).rgb;
    zSample = texture(terrainTexture5, zUv).rgb;
  } else if (layer == 6) {
    xSample = texture(terrainTexture6, xUv).rgb;
    ySample = texture(terrainTexture6, yUv).rgb;
    zSample = texture(terrainTexture6, zUv).rgb;
  } else {
    xSample = texture(terrainTexture7, xUv).rgb;
    ySample = texture(terrainTexture7, yUv).rgb;
    zSample = texture(terrainTexture7, zUv).rgb;
  }
  vec3 color = xSample * blend.x + ySample * blend.y + zSample * blend.z;
  return pow(max(color, vec3(0.001)), vec3(2.2));
}

vec3 terrainSplatColor() {
  float indices[4] = float[4](vTerrainWeights1.x, vTerrainWeights1.y, vTerrainWeights1.z, vTerrainWeights1.w);
  float strengths[4] = float[4](vTerrainWeights2.x, vTerrainWeights2.y, vTerrainWeights2.z, vTerrainWeights2.w);
  vec3 color = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 4; i++) {
    int layer = int(indices[i] + 0.5);
    float strength = max(strengths[i], 0.0);
    color += terrainTriplanarSample(layer, vTerrainPosition, normalize(vTerrainNormal)) * strength;
    total += strength;
  }
  return color / max(total, 0.0001);
}`,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
vec3 terrainColor = terrainSplatColor();
float terrainMacro = texture(terrainNoise, vTerrainPosition.xz / 1800.0).r;
diffuseColor.rgb *= terrainColor * mix(0.82, 1.12, terrainMacro);`,
    )
  }

  return material
}
