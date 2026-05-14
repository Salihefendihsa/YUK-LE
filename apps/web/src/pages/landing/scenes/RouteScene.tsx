import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
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

function HighwaySign({ x, z, text }: { x: number; z: number; text: string }) {
  const face = x < 0 ? 1 : -1
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.12, 0.62, 0.95]} />
        <meshStandardMaterial color="#334155" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[face * 0.07, 1.05, 0]} rotation={[0, face * (Math.PI / 2), 0]}>
        <planeGeometry args={[0.88, 0.52]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <Text
        position={[face * 0.11, 1.05, 0]}
        rotation={[0, face * (Math.PI / 2), 0]}
        fontSize={0.11}
        color="#0f172a"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.8}
      >
        {text}
      </Text>
    </group>
  )
}

function GuardRail({ side, z }: { side: number; z: number }) {
  return (
    <mesh position={[side * 2.05, 0.25, z]} castShadow>
      <boxGeometry args={[0.06, 0.18, 0.45]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.4} roughness={0.35} />
    </mesh>
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
  const camRef = useRef({ y: 3.2, z: 9.5, lookY: 0.45 })

  const trees = useMemo(() => {
    const t: [number, number][] = []
    const step = reduceTrees ? 5 : 3
    for (let i = -28; i < 36; i += step) {
      t.push([-2.35, i * 1.15])
      t.push([2.35, i * 1.15 + 0.6])
    }
    return t
  }, [reduceTrees])

  const signs = useMemo(
    () => [
      { x: -2.58, z: -5, text: 'ANKARA 250 KM →' },
      { x: 2.58, z: -12, text: 'İSTANBUL 450 KM →' },
      { x: -2.58, z: -20, text: 'İZMİR 380 KM →' },
    ],
    [],
  )

  useFrame((state, delta) => {
    const p = progressRef.current
    const truck = truckRef.current
    if (!truck) return

    truck.position.z = -p * 20

    const ty = 0.45
    const tz = truck.position.z + 2.2

    let targetY = 3.4 + p * 2.8
    let targetZ = 8.5 + p * 5
    if (p < 0.25) {
      targetY = 2.8
      targetZ = 10.5
    } else if (p < 0.5) {
      targetY = 4.2 + (p - 0.25) * 4
      targetZ = 7 + (p - 0.25) * 10
    } else if (p < 0.75) {
      targetY = 6.2 - (p - 0.5) * 4
      targetZ = 9.5 - (p - 0.5) * 6
    }

    camRef.current.y += (targetY - camRef.current.y) * Math.min(1, delta * 2.2)
    camRef.current.z += (targetZ - camRef.current.z) * Math.min(1, delta * 2.2)

    state.camera.position.set(0, camRef.current.y, camRef.current.z)
    state.camera.lookAt(0, ty, tz)
  })

  return (
    <>
      <color attach="background" args={['#090b0e']} />
      <fog attach="fog" args={['#090b0e', 14, 58]} />
      <ambientLight intensity={0.48} />
      <hemisphereLight args={['#7c2d12', '#090b0e', 0.45]} position={[0, 14, 0]} />
      <directionalLight position={[4, 16, 6]} intensity={1.05} color="#ffe4c4" castShadow />
      <directionalLight position={[-6, 8, -4]} intensity={0.35} color="#6366f1" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[10, 96]} />
        <meshStandardMaterial color="#12151c" roughness={0.92} metalness={0.06} />
      </mesh>

      {Array.from({ length: 48 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -i * 2]}>
          <planeGeometry args={[0.1, 0.75]} />
          <meshBasicMaterial color="#f8fafc" opacity={0.82} transparent />
        </mesh>
      ))}

      {trees.map(([x, z], i) => (
        <Tree key={i} x={x} z={z} />
      ))}

      {signs.map((s, i) => (
        <HighwaySign key={i} x={s.x} z={s.z} text={s.text} />
      ))}

      {Array.from({ length: 40 }).map((_, i) => (
        <GuardRail key={`L-${i}`} side={-1} z={-i * 2.2} />
      ))}
      {Array.from({ length: 40 }).map((_, i) => (
        <GuardRail key={`R-${i}`} side={1} z={-i * 2.2 - 0.4} />
      ))}

      <mesh position={[0, 2.2, -32]} rotation={[0.05, 0, 0]}>
        <planeGeometry args={[70, 14]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.88} />
      </mesh>

      <group ref={truckRef} scale={1.7}>
        <Truck journey idleMotion={false} rotation={[0, Math.PI, 0]} position={[0, 0, 0]} />
        <mesh position={[0.48, 0.42, 1.02]} rotation={[0, Math.PI, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial emissive="#fff2cc" emissiveIntensity={2.4} color="#331800" />
        </mesh>
        <mesh position={[-0.48, 0.42, 1.02]} rotation={[0, Math.PI, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial emissive="#fff2cc" emissiveIntensity={2.4} color="#331800" />
        </mesh>
        <pointLight position={[0.5, 0.45, 1.05]} intensity={1.4} color="#ffe8bc" distance={7} decay={2} />
        <pointLight position={[-0.5, 0.45, 1.05]} intensity={1.4} color="#ffe8bc" distance={7} decay={2} />
        <mesh position={[0, 0.55, -2.35]} rotation={[0, Math.PI, 0]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial emissive="#ff2200" emissiveIntensity={2} color="#330000" />
        </mesh>
      </group>
    </>
  )
}
