import * as THREE from 'three'

export function MeshLineRaycast(raycaster, intersects) {
  const inverseMatrix = new THREE.Matrix4()
  const ray = new THREE.Ray()
  const sphere = new THREE.Sphere()
  const interRay = new THREE.Vector3()
  const geometry = this.geometry
  // Checking boundingSphere distance to ray

  sphere.copy(geometry.boundingSphere)
  sphere.applyMatrix4(this.matrixWorld)

  if (raycaster.ray.intersectSphere(sphere, interRay) === false) {
    return
  }

  inverseMatrix.getInverse(this.matrixWorld)
  ray.copy(raycaster.ray).applyMatrix4(inverseMatrix)

  const vStart = new THREE.Vector3()
  const vEnd = new THREE.Vector3()
  const interSegment = new THREE.Vector3()
  const step = this instanceof THREE.LineSegments ? 2 : 1
  const index = geometry.index
  const attributes = geometry.attributes

  if (index !== null) {
    const indices = index.array
    const positions = attributes.position.array
    const widths = attributes.width.array

    for (let i = 0, l = indices.length - 1; i < l; i += step) {
      const a = indices[i]
      const b = indices[i + 1]

      vStart.fromArray(positions, a * 3)
      vEnd.fromArray(positions, b * 3)
      const width = widths[Math.floor(i / 3)] != undefined ? widths[Math.floor(i / 3)] : 1
      const precision = raycaster.params.Line.threshold + (this.material.lineWidth * width) / 2
      const precisionSq = precision * precision

      const distSq = ray.distanceSqToSegment(vStart, vEnd, interRay, interSegment)

      if (distSq > precisionSq) continue

      interRay.applyMatrix4(this.matrixWorld) //Move back to world space for distance calculation

      const distance = raycaster.ray.origin.distanceTo(interRay)

      if (distance < raycaster.near || distance > raycaster.far) continue

      intersects.push({
        distance,
        // What do we want? intersection point on the ray or on the segment??
        // point: raycaster.ray.at( distance ),
        point: interSegment.clone().applyMatrix4(this.matrixWorld),
        index: i,
        face: null,
        faceIndex: null,
        object: this
      })
      // make event only fire once
      i = l
    }
  }
}
