import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh } from 'three'

function OrbitingBadge({ index }: { index: number }) {
  const ref = useRef<Group>(null)
  useFrame((state) => {
    const g = ref.current
    if (!g) return
    const t = state.clock.elapsedTime * 0.35 + index * 0.4
    const r = 1.65
    g.position.set(Math.cos(t) * r, Math.sin(t * 0.6) * 0.25, Math.sin(t) * r)
    g.lookAt(0, 0.2, 0)
  })
  return (
    <group ref={ref}>
      <mesh>
        <planeGeometry args={[0.42, 0.16]} />
        <meshStandardMaterial
          color="#052e1f"
          emissive="#22c55e"
          emissiveIntensity={0.35}
          metalness={0.55}
          roughness={0.38}
        />
      </mesh>
    </group>
  )
}

export function SecurityScene() {
  const shield = useRef<Mesh>(null)

  useFrame((state) => {
    const m = shield.current
    if (m) m.rotation.y = state.clock.elapsedTime * 0.22
  })

  return (
    <>
      <color attach="background" args={['#06120e']} />
      <ambientLight intensity={0.15} />
      <spotLight position={[3, 5, 4]} intensity={1.4} color="#34d399" angle={0.5} penumbra={0.5} />
      <pointLight position={[-2, 1, 2]} intensity={0.55} color="#fbbf24" />

      <mesh ref={shield} castShadow>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshStandardMaterial
          color="#14532d"
          metalness={0.92}
          roughness={0.16}
          emissive="#064e3b"
          emissiveIntensity={0.4}
          flatShading
        />
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[0.88, 0.06, 20, 64]} />
        <meshStandardMaterial
          color="#ca8a04"
          metalness={0.88}
          roughness={0.2}
          emissive="#422006"
          emissiveIntensity={0.22}
        />
      </mesh>

      {Array.from({ length: 6 }).map((_, i) => (
        <OrbitingBadge key={i} index={i} />
      ))}
    </>
  )
}
