import type { ThreeElements } from '@react-three/fiber'

export function BoxStack(props: ThreeElements['group']) {
  return (
    <group {...props}>
      {[0, 0.32, 0.64].map((y, i) => (
        <mesh key={i} castShadow position={[0, y + 0.16, 0]}>
          <boxGeometry args={[0.45, 0.28, 0.45]} />
          <meshStandardMaterial
            color={i === 1 ? '#3d2a1a' : '#2a2118'}
            metalness={0.2}
            roughness={0.65}
          />
        </mesh>
      ))}
      <mesh position={[0.23, 0.42, 0.23]}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshStandardMaterial emissive="#FF6B00" emissiveIntensity={0.4} color="#442200" />
      </mesh>
    </group>
  )
}
