import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { Truck } from '../models/Truck'

function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.7, 8]} />
        <meshStandardMaterial color="#1e1810" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <coneGeometry args={[0.35, 0.7, 10]} />
        <meshStandardMaterial color="#0f3d28" roughness={0.75} />
      </mesh>
    </group>
  )
}

export function RouteScene({
  progressRef,
  reduceTrees,
}: {
  progressRef: MutableRefObject<number>
  reduceTrees?: boolean
}) {
  const truckRef = useRef<Group>(null)
  const camRef = useRef<{ p: number; h: number }>({ p: 0, h: 0 })

  const trees = useMemo(() => {
    const t: [number, number][] = []
    const step = reduceTrees ? 5 : 3
    for (let i = -30; i < 40; i += step) {
      t.push([-2.2, i])
      t.push([2.2, i + 1.2])
    }
    return t
  }, [reduceTrees])

  useFrame((state, delta) => {
    const p = progressRef.current
    const truck = truckRef.current
    if (!truck) return

    truck.position.z = -p * 14
    truck.rotation.y = Math.PI * 0.04

    const targetH = p < 0.25 ? 2.2 : p < 0.5 ? 5.5 + p * 4 : 8 + p * 2
    const targetP = p < 0.25 ? 4.5 : p < 0.5 ? 7 + p * 6 : 9 + p * 4
    camRef.current.h += (targetH - camRef.current.h) * Math.min(1, delta * 2)
    camRef.current.p += (targetP - camRef.current.p) * Math.min(1, delta * 2)

    state.camera.position.set(0, camRef.current.h, camRef.current.p)
    state.camera.lookAt(0, 0.5, truck.position.z - 2)
  })

  return (
    <>
      <color attach="background" args={['#1a0f08']} />
      <fog attach="fog" args={['#2a1810', 12, 55]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ff9a44', '#1a0f08', 0.6]} position={[0, 8, 0]} />
      <directionalLight position={[2, 10, 4]} intensity={1.1} color="#ffd4a8" castShadow />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[8, 80]} />
        <meshStandardMaterial color="#151820" roughness={0.92} metalness={0.05} />
      </mesh>

      {Array.from({ length: 40 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -i * 2]}>
          <planeGeometry args={[0.12, 0.8]} />
          <meshBasicMaterial color="#f3f4f6" opacity={0.85} transparent />
        </mesh>
      ))}

      {trees.map(([x, z], i) => (
        <Tree key={i} x={x} z={z} />
      ))}

      <mesh position={[0, 1.2, -28]} rotation={[0, 0.2, 0]}>
        <planeGeometry args={[48, 10]} />
        <meshBasicMaterial color="#0b0d12" transparent opacity={0.85} />
      </mesh>

      <group ref={truckRef}>
        <Truck idleMotion={false} rotation={[0, Math.PI, 0]} />
      </group>
    </>
  )
}
