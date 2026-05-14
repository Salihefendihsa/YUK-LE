import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import type { ThreeElements } from '@react-three/fiber'

type PhoneProps = ThreeElements['group'] & {
  screenSlot?: ReactNode
  rotateY?: number
}

export function Phone({ screenSlot, rotateY = 0, ...rest }: PhoneProps) {
  const g = useRef<Group>(null)
  const rot = useRef(rotateY)
  useLayoutEffect(() => {
    rot.current = rotateY
  }, [rotateY])
  useFrame(() => {
    if (g.current) g.current.rotation.y = rot.current
  })
  return (
    <group ref={g} {...rest}>
      <mesh castShadow>
        <boxGeometry args={[0.55, 1.12, 0.08]} />
        <meshStandardMaterial color="#0c0e12" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0.041]}>
        <planeGeometry args={[0.48, 1.02]} />
        <meshBasicMaterial color="#090B0E" />
      </mesh>
      <group position={[0, 0, 0.045]}>{screenSlot}</group>
      <mesh position={[0, 0.48, 0.045]} rotation={[0, 0, Math.PI / 20]}>
        <planeGeometry args={[0.12, 0.03]} />
        <meshBasicMaterial color="#111318" />
      </mesh>
    </group>
  )
}
