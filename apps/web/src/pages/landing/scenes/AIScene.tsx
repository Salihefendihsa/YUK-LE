import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments, Vector3 } from 'three'
import type { Group as ThreeGroup } from 'three'

type Props = {
  mouseRef: MutableRefObject<{ x: number; y: number }>
  active: boolean
}

export function AIScene({ mouseRef, active }: Props) {
  const linesRef = useRef<LineSegments>(null)
  const groupRef = useRef<ThreeGroup>(null)

  const { geometry, spherePositions } = useMemo(() => {
    const n = 100
    const pts: Vector3[] = []
    for (let i = 0; i < n; i++) {
      pts.push(
        new Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
        ),
      )
    }
    const positions: number[] = []
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (pts[i]!.distanceTo(pts[j]!) < 1.15) {
          positions.push(pts[i]!.x, pts[i]!.y, pts[i]!.z, pts[j]!.x, pts[j]!.y, pts[j]!.z)
        }
      }
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(new Float32Array(positions), 3))
    const flat = new Float32Array(n * 3)
    pts.forEach((p, i) => {
      flat[i * 3] = p.x
      flat[i * 3 + 1] = p.y
      flat[i * 3 + 2] = p.z
    })
    return { geometry: geo, spherePositions: flat }
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
      const mat = linesRef.current?.material
      if (mat && !Array.isArray(mat)) mat.dispose()
    }
  }, [geometry])

  useFrame((state) => {
    if (!active) return
    const t = state.clock.elapsedTime
    const g = groupRef.current
    if (g) {
      g.rotation.y = t * 0.06 + mouseRef.current.x * 0.15
      g.rotation.x = mouseRef.current.y * 0.08
    }
    const mat = linesRef.current?.material as LineBasicMaterial | undefined
    if (mat) mat.opacity = 0.25 + 0.35 * Math.sin(t * 2.2)
  })

  return (
    <group ref={groupRef}>
      <color attach="background" args={['#12081f']} />
      <ambientLight intensity={0.2} />
      <pointLight position={[2, 3, 2]} intensity={1.2} color="#8B5CF6" />
      <pointLight position={[-3, -1, 1]} intensity={0.6} color="#FF6B00" />

      {Array.from({ length: 100 }).map((_, i) => (
        <mesh key={i} position={[spherePositions[i * 3]!, spherePositions[i * 3 + 1]!, spherePositions[i * 3 + 2]!]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial
            color="#c4b5fd"
            emissive="#6d28d9"
            emissiveIntensity={0.6 + 0.4 * Math.sin(i * 0.7)}
            metalness={0.4}
            roughness={0.35}
          />
        </mesh>
      ))}

      <lineSegments ref={linesRef} geometry={geometry}>
        <lineBasicMaterial color="#a78bfa" transparent opacity={0.45} />
      </lineSegments>
    </group>
  )
}
