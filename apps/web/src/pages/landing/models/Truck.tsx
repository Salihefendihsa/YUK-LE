import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, Group, SRGBColorSpace, type Mesh } from 'three'

import type { ThreeElements } from '@react-three/fiber'

type GroupProps = ThreeElements['group'] & {
  idleMotion?: boolean
  /** Journey sahnesi: tekerlek dönüşü, turuncu kabin, dorse markası */
  journey?: boolean
}

function useBrandTexture() {
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const g = canvas.getContext('2d')
    if (!g) return null
    g.fillStyle = '#121418'
    g.fillRect(0, 0, 512, 256)
    g.shadowColor = 'rgba(255, 120, 0, 0.9)'
    g.shadowBlur = 28
    g.font = '900 76px Plus Jakarta Sans, system-ui, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = '#ff6b00'
    g.fillText('YÜK-LE', 256, 130)
    const t = new CanvasTexture(canvas)
    t.colorSpace = SRGBColorSpace
    t.needsUpdate = true
    return t
  }, [])

  useEffect(() => {
    return () => {
      tex?.dispose()
    }
  }, [tex])

  return tex
}

/** Kabin + dorse + tekerlekler; journey modunda turuncu kabin ve yan marka */
export function Truck({ idleMotion = true, journey = false, ...rest }: GroupProps) {
  const group = useRef<Group>(null)
  const wheels = useRef<Mesh[]>([])
  const brand = useBrandTexture()

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    if (idleMotion && !journey) {
      g.rotation.y += 0.002
      g.position.y = Math.sin(t) * 0.1
    } else if (journey) {
      g.position.y = Math.sin(t * 2.4) * 0.035
    }
    if (journey) {
      const spin = delta * 9
      for (const w of wheels.current) {
        if (w) w.rotation.x += spin
      }
    }
  })

  const cabColor = journey ? '#ff6b00' : '#252a33'
  const cabDark = journey ? '#cc5500' : '#1a1d24'
  const trailerColor = journey ? '#e8eaef' : '#1a1d24'

  return (
    <group ref={group} {...rest}>
      {/* Kabin */}
      <mesh castShadow receiveShadow position={[0, 0.52, 0.55]}>
        <boxGeometry args={[1.05, 0.62, 1.15]} />
        <meshStandardMaterial color={cabColor} metalness={0.35} roughness={0.4} emissive={journey ? '#441800' : '#000000'} emissiveIntensity={journey ? 0.25 : 0} />
      </mesh>
      {/* Ön cam */}
      <mesh position={[0, 0.62, 1.12]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.95, 0.35, 0.08]} />
        <meshStandardMaterial color="#1e3a5f" metalness={0.8} roughness={0.15} transparent opacity={0.65} />
      </mesh>
      {/* Dorse */}
      <mesh castShadow receiveShadow position={[0, 0.48, -0.95]}>
        <boxGeometry args={[1.02, 0.68, 2.85]} />
        <meshStandardMaterial color={trailerColor} metalness={journey ? 0.55 : 0.5} roughness={journey ? 0.35 : 0.45} />
      </mesh>
      {journey && brand ? (
        <mesh position={[0.53, 0.45, -0.95]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.5, 0.75]} />
          <meshStandardMaterial map={brand} transparent roughness={0.45} metalness={0.2} emissive="#ff5500" emissiveIntensity={0.35} depthWrite={false} />
        </mesh>
      ) : null}
      {/* Şasi */}
      <mesh castShadow position={[0, 0.18, -0.2]}>
        <boxGeometry args={[0.95, 0.12, 3.2]} />
        <meshStandardMaterial color={cabDark} metalness={0.4} roughness={0.55} />
      </mesh>
      {/* Tekerlekler — journey'de döner */}
      {(
        [
          [-0.48, 0.16, 0.78],
          [0.48, 0.16, 0.78],
          [-0.48, 0.16, -0.35],
          [0.48, 0.16, -0.35],
          [-0.48, 0.16, -1.55],
          [0.48, 0.16, -1.55],
        ] as const
      ).map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el && journey) wheels.current[i] = el
          }}
          castShadow
          position={[...p]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.2, 0.2, 0.14, 18]} />
          <meshStandardMaterial color="#0b0d10" metalness={0.25} roughness={0.65} />
        </mesh>
      ))}
      {/* Egzoz */}
      <mesh castShadow position={[-0.42, 0.62, 0.05]} rotation={[0.2, 0, 0.15]}>
        <cylinderGeometry args={[0.05, 0.06, 0.35, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Ayna */}
      <mesh position={[0.58, 0.58, 0.85]}>
        <boxGeometry args={[0.06, 0.12, 0.08]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-0.58, 0.58, 0.85]}>
        <boxGeometry args={[0.06, 0.12, 0.08]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}
