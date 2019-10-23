<p align="center">
	<a href="https://codesandbox.io/s/react-three-fiber-threejs-meshline-example-vl221"><img width="432" height="240" src="https://imgur.com/mZikTAH.gif" /></a>
	<a href="https://codesandbox.io/s/threejs-meshline-custom-spring-3-ypkxx"><img width="432" height="240" src="https://imgur.com/g8ts0vJ.gif" /></a>
</p>

Click examples above to view the code and the examples found at [THREE.meshline](https://github.com/spite/THREE.MeshLine) will work with this fork.

    npm install threejs-meshline

threejs-meshline is a replacement for `THREE.Line`, it allows you to create lines with varable widths. It is a fork of Jaume Sanchez Elias [THREE.meshline](https://github.com/spite/THREE.MeshLine) as the repo no longer appears to be maintained.

- Supports BufferGeometry
- Extends `THREE.BufferGeometry` and can be used in regular meshes as a geometry
- New `setVertices` and `setBufferArray` functions so you no longer need to create a geometry prior to a `MeshLine`
- Raycast is exposed as `MeshLineRaycast` and can be used like `mesh.raycast = MeshLineRaycast`
- Raycast accounts for line width
- Extra setters and getters to help with declaritive libraries like [react-three-fiber](https://github.com/react-spring/react-three-fiber)

# How to use

#### Fetch imports

```js
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'threejs-meshline'
```

#### Create and populate a geometry

First, create the list of vertices that will define the line. `MeshLine` accepts an array of vertices.

```js
const vertices = []
for (let j = 0; j < Math.PI; j += (2 * Math.PI) / 100)
  vertices.push(new THREE.Vector3(Math.cos(j), Math.sin(j), 0))
```

#### Create a MeshLine and set the vertices

Once you have that, you can create a new `MeshLine`, and call `.setVertices()` passing the vertices.

```js
const line = new MeshLine()
line.setVertices(vertices)
```

Note: `.setVertices` accepts a second parameter, which is a function to define the width in each point along the line. By default that value is 1, making the line width 1 \* lineWidth in the material.

```js
// p is a decimal percentage of the number of points
// ie. point 200 of 250 points, p = 0.8
line.setVertices(geometry, p => 2) // makes width 2 * lineWidth
line.setVertices(geometry, p => 1 - p) // makes width taper
line.setVertices(geometry, p => 2 + Math.sin(50 * p)) // makes width sinusoidal
```

#### Create a MeshLineMaterial

A `MeshLine` needs a `MeshLineMaterial`:

```js
const material = new MeshLineMaterial(OPTIONS)
```

By default it's a white material of width 1 unit.

`MeshLineMaterial` has several attributes to control the appereance of the `MeshLine`:

- `map` - a `THREE.Texture` to paint along the line (requires `useMap` set to true)
- `useMap` - tells the material to use `map` (0 - solid color, 1 use texture)
- `alphaMap` - a `THREE.Texture` to use as alpha along the line (requires `useAlphaMap` set to true)
- `useAlphaMap` - tells the material to use `alphaMap` (0 - no alpha, 1 modulate alpha)
- `repeat` - THREE.Vector2 to define the texture tiling (applies to map and alphaMap - MIGHT CHANGE IN THE FUTURE)
- `color` - `THREE.Color` to paint the line width, or tint the texture with
- `opacity` - alpha value from 0 to 1 (requires `transparent` set to `true`)
- `alphaTest` - cutoff value from 0 to 1
- `dashArray` - the length and space between dashes. (0 - no dash)
- `dashOffset` - defines the location where the dash will begin. Ideal to animate the line.
- `dashRatio` - defines the ratio between that is visible or not (0 - more visible, 1 - more invisible).
- `resolution` - `THREE.Vector2` specifying the canvas size (REQUIRED)
- `sizeAttenuation` - makes the line width constant regardless distance (1 unit is 1px on screen) (0 - attenuate, 1 - don't attenuate)
- `lineWidth` - float defining width (if `sizeAttenuation` is true, it's world units; else is screen pixels)
- `near` - camera near clip plane distance (REQUIRED if `sizeAttenuation` set to false)
- `far` - camera far clip plane distance (REQUIRED if `sizeAttenuation` set to false)

If you're rendering transparent lines or using a texture with alpha map, you should set `depthTest` to `false`, `transparent` to `true` and `blending` to an appropriate blending mode, or use `alphaTest`.

#### Use MeshLine and MeshLineMaterial to create a THREE.Mesh

Finally, we create a mesh and add it to the scene:

```js
const mesh = new THREE.Mesh(line, material)
scene.add(mesh)
```

You can optionally add raycast support with the following.

```js
mesh.raycast = MeshLineRaycast
```

# Declarative use

threejs-meshline has getters and setters that make declarative usage a little easier. This is how it would look like in react/[react-three-fiber](https://github.com/drcmda/react-three-fiber). You can try it live [here](https://codesandbox.io/s/react-three-fiber-threejs-meshline-example-vl221).

```jsx
import { extend, Canvas } from 'react-three-fiber'
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'threejs-meshline'

extend({ MeshLine, MeshLineMaterial })

function Line({ vertices, width, color }) {
  return (
    <Canvas>
      <mesh raycast={MeshLineRaycast}>
        <meshLine attach="geometry" vertices={vertices} />
        <meshLineMaterial
          attach="material"
          transparent
          depthTest={false}
          lineWidth={width}
          color={color}
          dashArray={0.05}
          dashRatio={0.95}
        />
      </mesh>
    </Canvas>
  )
}
```
