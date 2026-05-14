import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'

import type { ThreeElements } from '@react-three/fiber'

type GroupProps = ThreeElements['group'] & { idleMotion?: boolean }

/** Procedural semi-truck (merged boxes). Drop `public/models/truck.glb` and swap to useGLTF if desired. */
export function Truck({ idleMotion = true, ...rest }: GroupProps) {
  const group = useRef<Group>(null)

  useFrame((state) => {
    const g = group.current
    if (!g || !idleMotion) return
    const t = state.clock.elapsedTime
    g.rotation.y += 0.002
    g.position.y = Math.sin(t) * 0.1
  })

  return (
    <group ref={group} {...rest}>
      <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[1.1, 0.55, 2.4]} />
        <meshStandardMaterial color="#1a1d24" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh castShadow position={[0, 0.95, 0.35]}>
        <boxGeometry args={[1.05, 0.55, 1.1]} />
        <meshStandardMaterial color="#252a33" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 0.32, -1.35]}>
        <boxGeometry args={[1.05, 0.35, 0.85]} />
        <meshStandardMaterial color="#111318" metalness={0.5} roughness={0.45} />
      </mesh>
      {[[-0.52, 0.22, 0.75], [0.52, 0.22, 0.75], [-0.52, 0.22, -0.85], [0.52, 0.22, -0.85]].map(
        (p, i) => (
          <mesh key={i} castShadow position={p as [number, number, number]}>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
            <meshStandardMaterial color="#0d0f12" metalness={0.3} roughness={0.55} />
          </mesh>
        ),
      )}
      <mesh position={[0.56, 0.55, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.08, 0.02, 0.35]} />
        <meshStandardMaterial emissive="#FF6B00" emissiveIntensity={0.9} color="#331100" />
      </mesh>
    </group>
  )
}
