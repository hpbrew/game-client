// const QT_MIN_CELL_SIZE = 32
const QT_MIN_CELL_SIZE = 64
// const QT_MIN_CELL_RESOLUTION = 24;
const QT_MIN_CELL_RESOLUTION = 16
// const QT_MIN_CELL_RESOLUTION = 4;

// 2^13 = 8192
const VIEWER_RADIUS = 16_384//8192.0

const NOISE_HEIGHT = 1200.0
// const NOISE_HEIGHT = 0.0;
const NOISE_SCALE = 1800.0

export const terrain_constants = {
  QT_MIN_CELL_SIZE: QT_MIN_CELL_SIZE,
  QT_MIN_CELL_RESOLUTION: QT_MIN_CELL_RESOLUTION,
  VIEWER_RADIUS: VIEWER_RADIUS,

  NOISE_HEIGHT: NOISE_HEIGHT,
  NOISE_SCALE: NOISE_SCALE,
  NOISE_PARAMS: {
    octaves: 10,
    persistence: 0.5,
    lacunarity: 1.6,
    exponentiation: 7.5,
    height: NOISE_HEIGHT,
    scale: NOISE_SCALE,
    seed: 1,
  },
}
