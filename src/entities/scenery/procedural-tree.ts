import * as THREE from "three"

const trunkGeometry = new THREE.CylinderGeometry(0.12, 0.42, 1, 7, 3)
const branchGeometry = new THREE.CylinderGeometry(0.035, 0.13, 1, 6, 1)
const foliageGeometry = new THREE.IcosahedronGeometry(1, 0)

const barkMaterial = new THREE.MeshStandardMaterial({
  color: 0x68432d,
  flatShading: true,
  roughness: 1,
})
const foliageMaterials = [
  0x426b32,
  0x507c38,
  0x5d873d,
  0x6e9145,
].map(
  (color) =>
    new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: 1,
    }),
)

function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function setMeshShadows(mesh: THREE.Mesh | THREE.InstancedMesh) {
  mesh.castShadow = true
  mesh.receiveShadow = true
}

/** Builds a reusable, faceted fantasy tree with a tapered trunk and clustered canopy. */
export function createProceduralTree(seed = Math.random() * 0xffffffff) {
  const random = createRandom(seed)
  const tree = new THREE.Group()
  const height = 5.8 + random() * 1.4
  const overallScale = 0.82 + random() * 0.38

  const trunk = new THREE.Mesh(trunkGeometry, barkMaterial)
  trunk.position.y = height / 2
  trunk.scale.set(1, height, 1)
  setMeshShadows(trunk)
  tree.add(trunk)

  const branchCount = 4
  const branches = new THREE.InstancedMesh(
    branchGeometry,
    barkMaterial,
    branchCount,
  )
  const up = new THREE.Vector3(0, 1, 0)
  const branchPosition = new THREE.Vector3()
  const branchDirection = new THREE.Vector3()
  const branchScale = new THREE.Vector3()
  const branchQuaternion = new THREE.Quaternion()
  const branchMatrix = new THREE.Matrix4()

  for (let i = 0; i < branchCount; i++) {
    const angle = (i / branchCount) * Math.PI * 2 + random() * 0.35
    const startY = height * (0.48 + random() * 0.16)
    const length = height * (0.22 + random() * 0.045)
    branchDirection.set(
      Math.cos(angle) * 0.82,
      0.58 + random() * 0.16,
      Math.sin(angle) * 0.82,
    ).normalize()
    branchPosition.set(0, startY, 0).addScaledVector(
      branchDirection,
      length / 2,
    )
    branchScale.setScalar(0.8 + random() * 0.35)
    branchScale.y = length
    branchQuaternion.setFromUnitVectors(up, branchDirection)
    branchMatrix.compose(branchPosition, branchQuaternion, branchScale)
    branches.setMatrixAt(i, branchMatrix)
  }
  branches.instanceMatrix.needsUpdate = true
  setMeshShadows(branches)
  tree.add(branches)

  const foliageByMaterial = new Map<
    THREE.MeshStandardMaterial,
    THREE.Matrix4[]
  >()
  const crownClusters = [
    { y: height * 0.57, radius: 0.98, spread: 0.7 },
    { y: height * 0.59, radius: 0.98, spread: 0.7 },
    { y: height * 0.61, radius: 0.98, spread: 0.7 },
    { y: height * 0.76, radius: 0.83, spread: 0.61 },
    { y: height * 0.78, radius: 0.83, spread: 0.61 },
    { y: height * 0.8, radius: 0.83, spread: 0.61 },
    { y: height * 0.94, radius: 0.72, spread: 0.54 },
  ]
  const leafPosition = new THREE.Vector3()
  const leafScale = new THREE.Vector3()
  const leafQuaternion = new THREE.Quaternion()
  const leafMatrix = new THREE.Matrix4()

  crownClusters.forEach((cluster, index) => {
    const angle = (index % 3) * ((Math.PI * 2) / 3) + random() * 0.45
    const radius = cluster.radius * (0.82 + random() * 0.35)
    leafPosition.set(
      Math.cos(angle) * radius,
      cluster.y + (random() - 0.5) * 0.35,
      Math.sin(angle) * radius,
    )
    const size = cluster.spread * (0.85 + random() * 0.38)
    leafScale.set(size, size * (0.86 + random() * 0.34), size)
    leafQuaternion.setFromEuler(
      new THREE.Euler(random() * 0.35, random() * Math.PI, random() * 0.25),
    )
    leafMatrix.compose(leafPosition, leafQuaternion, leafScale)

    const material = foliageMaterials[Math.floor(random() * foliageMaterials.length)]
    const matrices = foliageByMaterial.get(material) ?? []
    matrices.push(leafMatrix.clone())
    foliageByMaterial.set(material, matrices)
  })

  foliageByMaterial.forEach((matrices, material) => {
    const foliage = new THREE.InstancedMesh(
      foliageGeometry,
      material,
      matrices.length,
    )
    matrices.forEach((matrix, index) => foliage.setMatrixAt(index, matrix))
    foliage.instanceMatrix.needsUpdate = true
    setMeshShadows(foliage)
    tree.add(foliage)
  })

  tree.scale.setScalar(overallScale)
  tree.rotation.y = random() * Math.PI * 2
  tree.userData.isProceduralTree = true
  return tree
}
