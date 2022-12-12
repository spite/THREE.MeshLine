import * as THREE from 'three'

// https://stackoverflow.com/a/56532878
function memcpy(
  src: BufferSource | ArrayLike<number>,
  srcOffset: number,
  dst: BufferSource | ArrayLike<number>,
  dstOffset: number,
  length: number,
): any {
  let i: number
  // @ts-ignore
  src = src.subarray || src.slice ? src : src.buffer
  // @ts-ignore
  dst = dst.subarray || dst.slice ? dst : dst.buffer
  src = srcOffset
    ? // @ts-ignore
      src.subarray
      ? // @ts-ignore
        src.subarray(srcOffset, length && srcOffset + length)
      : // @ts-ignore
        src.slice(srcOffset, length && srcOffset + length)
    : src
  // @ts-ignore
  if (dst.set) {
    // @ts-ignore
    dst.set(src, dstOffset)
  } else {
    // @ts-ignore
    for (i = 0; i < src.length; i++) dst[i + dstOffset] = src[i]
  }
  return dst
}

export type PointsRepresentation =
  | THREE.BufferGeometry
  | Float32Array
  | THREE.Vector3[]
  | THREE.Vector2[]
  | THREE.Vector3Tuple[]
  | THREE.Vector2Tuple[]
  | number[]

function convertPoints(points: PointsRepresentation): Float32Array | number[] {
  if (points instanceof Float32Array) return points
  if (points instanceof THREE.BufferGeometry) return points.getAttribute('position').array as Float32Array
  return points
    .map((p) => {
      const isArray = Array.isArray(p)
      return p instanceof THREE.Vector3
        ? [p.x, p.y, p.z]
        : p instanceof THREE.Vector2
        ? [p.x, p.y, 0]
        : isArray && p.length === 3
        ? [p[0], p[1], p[2]]
        : isArray && p.length === 2
        ? [p[0], p[1], 0]
        : p
    })
    .flat()
}

export type WidthCallback = (p: number) => any

export class MeshLineGeometry extends THREE.BufferGeometry {
  type = 'MeshLine'
  isMeshLine = true
  positions: number[] = []
  previous: number[] = []
  next: number[] = []
  side: number[] = []
  width: number[] = []
  indices_array: number[] = []
  uvs: number[] = []
  counters: number[] = []
  widthCallback: WidthCallback | null = null

  _attributes!: {
    position: THREE.BufferAttribute
    previous: THREE.BufferAttribute
    next: THREE.BufferAttribute
    side: THREE.BufferAttribute
    width: THREE.BufferAttribute
    uv: THREE.BufferAttribute
    index: THREE.BufferAttribute
    counters: THREE.BufferAttribute
  }
  _points: Float32Array | number[] = []
  points!: Float32Array | number[]

  // Used to raycast
  matrixWorld = new THREE.Matrix4()

  constructor() {
    super()

    Object.defineProperties(this, {
      points: {
        enumerable: true,
        get() {
          return this._points
        },
        set(value) {
          this.setPoints(value, this.widthCallback)
        },
      },
    })
  }

  setMatrixWorld(matrixWorld: THREE.Matrix4): void {
    this.matrixWorld = matrixWorld
  }

  setPoints(points: PointsRepresentation, wcb?: WidthCallback): void {
    points = convertPoints(points)
    // as the points are mutated we store them
    // for later retreival when necessary (declaritive architectures)
    this._points = points
    this.widthCallback = wcb ?? null
    this.positions = []
    this.counters = []

    // TODO: this is unreachable
    if (points.length && (points[0] as any) instanceof THREE.Vector3) {
      // could transform Vector3 array into the array used below
      // but this approach will only loop through the array once
      // and is more performant
      for (let j = 0; j < points.length; j++) {
        const p = points[j] as unknown as THREE.Vector3
        const c = j / (points.length - 1)
        this.positions.push(p.x, p.y, p.z)
        this.positions.push(p.x, p.y, p.z)
        this.counters.push(c)
        this.counters.push(c)
      }
    } else {
      for (let j = 0; j < points.length; j += 3) {
        const c = j / (points.length - 1)
        this.positions.push(points[j], points[j + 1], points[j + 2])
        this.positions.push(points[j], points[j + 1], points[j + 2])
        this.counters.push(c)
        this.counters.push(c)
      }
    }
    this.process()
  }

  compareV3(a: number, b: number): boolean {
    const aa = a * 6
    const ab = b * 6
    return (
      this.positions[aa] === this.positions[ab] &&
      this.positions[aa + 1] === this.positions[ab + 1] &&
      this.positions[aa + 2] === this.positions[ab + 2]
    )
  }

  copyV3(a: number): THREE.Vector3Tuple {
    const aa = a * 6
    return [this.positions[aa], this.positions[aa + 1], this.positions[aa + 2]]
  }

  process(): void {
    const l = this.positions.length / 6

    this.previous = []
    this.next = []
    this.side = []
    this.width = []
    this.indices_array = []
    this.uvs = []

    let w

    let v: THREE.Vector3Tuple
    // initial previous points
    if (this.compareV3(0, l - 1)) {
      v = this.copyV3(l - 2)
    } else {
      v = this.copyV3(0)
    }
    this.previous.push(v[0], v[1], v[2])
    this.previous.push(v[0], v[1], v[2])

    for (let j = 0; j < l; j++) {
      // sides
      this.side.push(1)
      this.side.push(-1)

      // widths
      if (this.widthCallback) w = this.widthCallback(j / (l - 1))
      else w = 1
      this.width.push(w)
      this.width.push(w)

      // uvs
      this.uvs.push(j / (l - 1), 0)
      this.uvs.push(j / (l - 1), 1)

      if (j < l - 1) {
        // points previous to poisitions
        v = this.copyV3(j)
        this.previous.push(v[0], v[1], v[2])
        this.previous.push(v[0], v[1], v[2])

        // indices
        const n = j * 2
        this.indices_array.push(n, n + 1, n + 2)
        this.indices_array.push(n + 2, n + 1, n + 3)
      }
      if (j > 0) {
        // points after poisitions
        v = this.copyV3(j)
        this.next.push(v[0], v[1], v[2])
        this.next.push(v[0], v[1], v[2])
      }
    }

    // last next point
    if (this.compareV3(l - 1, 0)) {
      v = this.copyV3(1)
    } else {
      v = this.copyV3(l - 1)
    }
    this.next.push(v[0], v[1], v[2])
    this.next.push(v[0], v[1], v[2])

    if (!this._attributes || this._attributes.position.count !== this.positions.length) {
      this._attributes = {
        position: new THREE.BufferAttribute(new Float32Array(this.positions), 3),
        previous: new THREE.BufferAttribute(new Float32Array(this.previous), 3),
        next: new THREE.BufferAttribute(new Float32Array(this.next), 3),
        side: new THREE.BufferAttribute(new Float32Array(this.side), 1),
        width: new THREE.BufferAttribute(new Float32Array(this.width), 1),
        uv: new THREE.BufferAttribute(new Float32Array(this.uvs), 2),
        index: new THREE.BufferAttribute(new Uint16Array(this.indices_array), 1),
        counters: new THREE.BufferAttribute(new Float32Array(this.counters), 1),
      }
    } else {
      this._attributes.position.copyArray(new Float32Array(this.positions))
      this._attributes.position.needsUpdate = true
      this._attributes.previous.copyArray(new Float32Array(this.previous))
      this._attributes.previous.needsUpdate = true
      this._attributes.next.copyArray(new Float32Array(this.next))
      this._attributes.next.needsUpdate = true
      this._attributes.side.copyArray(new Float32Array(this.side))
      this._attributes.side.needsUpdate = true
      this._attributes.width.copyArray(new Float32Array(this.width))
      this._attributes.width.needsUpdate = true
      this._attributes.uv.copyArray(new Float32Array(this.uvs))
      this._attributes.uv.needsUpdate = true
      this._attributes.index.copyArray(new Uint16Array(this.indices_array))
      this._attributes.index.needsUpdate = true
    }

    this.setAttribute('position', this._attributes.position)
    this.setAttribute('previous', this._attributes.previous)
    this.setAttribute('next', this._attributes.next)
    this.setAttribute('side', this._attributes.side)
    this.setAttribute('width', this._attributes.width)
    this.setAttribute('uv', this._attributes.uv)
    this.setAttribute('counters', this._attributes.counters)

    this.setAttribute('position', this._attributes.position)
    this.setAttribute('previous', this._attributes.previous)
    this.setAttribute('next', this._attributes.next)
    this.setAttribute('side', this._attributes.side)
    this.setAttribute('width', this._attributes.width)
    this.setAttribute('uv', this._attributes.uv)
    this.setAttribute('counters', this._attributes.counters)

    this.setIndex(this._attributes.index)

    this.computeBoundingSphere()
    this.computeBoundingBox()
  }

  /**
   * Fast method to advance the line by one position.  The oldest position is removed.
   * @param position
   */
  advance({ x, y, z }: THREE.Vector3) {
    const positions = this._attributes.position.array as number[]
    const previous = this._attributes.previous.array as number[]
    const next = this._attributes.next.array as number[]
    const l = positions.length

    // PREVIOUS
    memcpy(positions, 0, previous, 0, l)

    // POSITIONS
    memcpy(positions, 6, positions, 0, l - 6)

    positions[l - 6] = x
    positions[l - 5] = y
    positions[l - 4] = z
    positions[l - 3] = x
    positions[l - 2] = y
    positions[l - 1] = z

    // NEXT
    memcpy(positions, 6, next, 0, l - 6)

    next[l - 6] = x
    next[l - 5] = y
    next[l - 4] = z
    next[l - 3] = x
    next[l - 2] = y
    next[l - 1] = z

    this._attributes.position.needsUpdate = true
    this._attributes.previous.needsUpdate = true
    this._attributes.next.needsUpdate = true
  }
}
