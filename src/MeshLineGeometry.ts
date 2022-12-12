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
  | Float32Array
  | THREE.Vector3[]
  | THREE.Vector2[]
  | THREE.Vector3Tuple[]
  | THREE.Vector2Tuple[]
  | number[]

function convertPoints(points: PointsRepresentation): Float32Array | number[] {
  if (points instanceof Float32Array) return points
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

  _points: Float32Array | number[] = []
  _geometry: THREE.BufferGeometry | null = null

  // Used to raycast
  matrixWorld = new THREE.Matrix4()

  geometry!: THREE.BufferGeometry | null
  points!: Float32Array | number[]

  constructor() {
    super()

    Object.defineProperties(this, {
      geometry: {
        enumerable: true,
        get() {
          return this._geometry
        },
        set(value) {
          this.setGeometry(value, this.widthCallback)
        },
      },
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

  // setting via a geometry is rather superfluous
  // as you're creating a unecessary geometry just to throw away
  // but exists to support previous api
  setGeometry(g: THREE.BufferGeometry, c: (p: number) => any): void {
    // as the input geometry are mutated we store them
    // for later retreival when necessary (declaritive architectures)
    if (g instanceof THREE.BufferGeometry) {
      this._geometry = g
      this.setPoints(g.getAttribute('position').array as number[], c)
    }
  }

  setPoints(points: PointsRepresentation, wcb?: WidthCallback): void {
    points = convertPoints(points)
    if (!(points instanceof Float32Array) && !(points instanceof Array)) {
      console.error('ERROR: The BufferArray of points is not instancied correctly.')
      return
    }
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

    // redefining the attribute seems to prevent range errors
    // if the user sets a differing number of vertices
    /*if (!this.attributes || this.attributes.position.count !== this.positions.length) {
      this.attributes = {
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
      const position = this.attributes.position as THREE.BufferAttribute
      const previous = this.attributes.next as THREE.BufferAttribute
      const next = this.attributes.next as THREE.BufferAttribute
      const side = this.attributes.next as THREE.BufferAttribute
      const width = this.attributes.next as THREE.BufferAttribute
      const uv = this.attributes.next as THREE.BufferAttribute
      const index = this.attributes.next as THREE.BufferAttribute

      position.copyArray(new Float32Array(this.positions))
      position.needsUpdate = true
      previous.copyArray(new Float32Array(this.previous))
      previous.needsUpdate = true
      next.copyArray(new Float32Array(this.next))
      next.needsUpdate = true
      side.copyArray(new Float32Array(this.side))
      side.needsUpdate = true
      width.copyArray(new Float32Array(this.width))
      width.needsUpdate = true
      uv.copyArray(new Float32Array(this.uvs))
      uv.needsUpdate = true
      index.copyArray(new Uint16Array(this.indices_array))
      index.needsUpdate = true
    }*/

    if (!this.attributes || this.attributes.position.count !== this.positions.length) {
      this.attributes = {
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
      ;(this.attributes.position as THREE.BufferAttribute).copyArray(new Float32Array(this.positions))
      this.attributes.position.needsUpdate = true
      ;(this.attributes.previous as THREE.BufferAttribute).copyArray(new Float32Array(this.previous))
      this.attributes.previous.needsUpdate = true
      ;(this.attributes.next as THREE.BufferAttribute).copyArray(new Float32Array(this.next))
      this.attributes.next.needsUpdate = true
      ;(this.attributes.side as THREE.BufferAttribute).copyArray(new Float32Array(this.side))
      this.attributes.side.needsUpdate = true
      ;(this.attributes.width as THREE.BufferAttribute).copyArray(new Float32Array(this.width))
      this.attributes.width.needsUpdate = true
      ;(this.attributes.uv as THREE.BufferAttribute).copyArray(new Float32Array(this.uvs))
      this.attributes.uv.needsUpdate = true
      ;(this.attributes.index as THREE.BufferAttribute).copyArray(new Uint16Array(this.indices_array))
      this.attributes.index.needsUpdate = true
    }

    this.setAttribute('position', this.attributes.position)
    this.setAttribute('previous', this.attributes.previous)
    this.setAttribute('next', this.attributes.next)
    this.setAttribute('side', this.attributes.side)
    this.setAttribute('width', this.attributes.width)
    this.setAttribute('uv', this.attributes.uv)
    this.setAttribute('counters', this.attributes.counters)

    this.setAttribute('position', this.attributes.position)
    this.setAttribute('previous', this.attributes.previous)
    this.setAttribute('next', this.attributes.next)
    this.setAttribute('side', this.attributes.side)
    this.setAttribute('width', this.attributes.width)
    this.setAttribute('uv', this.attributes.uv)
    this.setAttribute('counters', this.attributes.counters)

    this.setIndex(this.attributes.index as THREE.BufferAttribute)

    this.computeBoundingSphere()
    this.computeBoundingBox()
  }

  /**
   * Fast method to advance the line by one position.  The oldest position is removed.
   * @param position
   */
  advance({ x, y, z }: THREE.Vector3) {
    const positions = this.attributes.position.array as number[]
    const previous = this.attributes.previous.array as number[]
    const next = this.attributes.next.array as number[]
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

    this.attributes.position.needsUpdate = true
    this.attributes.previous.needsUpdate = true
    this.attributes.next.needsUpdate = true
  }
}
