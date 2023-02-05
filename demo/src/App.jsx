import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { extend, Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { easing } from 'maath'
import { useControls } from 'leva'
import { useEffect } from 'react'

extend({ MeshLineGeometry, MeshLineMaterial })

export default function App() {
  const { dash, count, radius, threshold } = useControls({
    dash: { value: 0.5, min: 0, max: 0.99, step: 0.01 },
    count: { value: 1, min: 0, max: 200, step: 1 },
    radius: { value: 10, min: 1, max: 100, step: 1 },
    threshold: { value: 1.0, min: 0.0, max: 1.0, step: 0.1 }
  })
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 90 }}>
      <color attach="background" args={['black']} />
      <Lines
        dash={dash}
        count={count}
        radius={radius}
        colors={[[10, 0.5, 2], [1, 2, 10], '#A2CCB6', '#FCEEB5', '#EE786E', '#e0feff']}
      />
      <Rig />
      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={threshold} radius={0.6} />
      </EffectComposer>
    </Canvas>
  )
}

function Lines({ dash, count, colors, radius = 50, rand = THREE.MathUtils.randFloatSpread }) {
  const lines = useMemo(() => {
    return Array.from({ length: count }, () => {
      const pos = new THREE.Vector3(rand(radius), rand(radius), rand(radius))
      const points = Array.from({ length: 5 }, () =>
        pos.add(new THREE.Vector3(rand(radius), rand(radius), rand(radius))).clone(),
      )
      const curve = new THREE.CatmullRomCurve3(points).getPoints(50)
      return {
        color: colors[parseInt(colors.length * Math.random())],
        width: Math.max(radius / 100, (radius / 50) * Math.random()),
        speed: Math.max(0.8, 1 * Math.random()),
        curve: curve.flatMap((point) => point.toArray()),
      }
    })
  }, [colors, count, radius])
  return lines.map((props, index) => <Fatline key={index} dash={dash} {...props} />)
}

function Fatline({ curve, width, color, speed, dash }) {
  const ref = useRef()
  const material = useRef()
  useFrame((state, delta) => (ref.current.material.dashOffset -= (delta * speed) / 10))
  useEffect(() =>{
    console.log(ref.current.geometry.attributes)
  })
  return (
    <mesh ref={ref}>
      <meshLineGeometry points={curve} />
      <meshLineMaterial ref={material}
        transparent
        lineWidth={width}
        color={color}
        gradient={[new THREE.Color('blue'), new THREE.Color('yellow')]}
        depthWrite={false}
        dashArray={0.25}
        dashRatio={dash}
        toneMapped={false}
      />
    </mesh>
  )
}

function Rig({ radius = 20 }) {
  return useFrame((state, dt) => {
    easing.damp3(
      state.camera.position,
      [Math.sin(state.pointer.x) * radius, Math.atan(state.pointer.y) * radius, Math.cos(state.pointer.x) * radius],
      0.25,
      dt,
    )
    state.camera.lookAt(0, 0, 0)
  })
}
