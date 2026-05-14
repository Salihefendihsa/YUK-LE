import { useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, ShaderMaterial, SpotLight, Vector2 } from 'three'
import { Truck } from '../models/Truck'
import gradientVert from '../shaders/gradient.vert.glsl?raw'
import gradientFrag from '../shaders/gradient.frag.glsl?raw'
import particleVert from '../shaders/particle.vert.glsl?raw'
import particleFrag from '../shaders/particle.frag.glsl?raw'

function BackgroundPlane({ mouse }: { mouse: MutableRefObject<Vector2> }) {
  const mat = useRef<ShaderMaterial>(null)
  const { viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0, 0) },
    }),
    [],
  )

  useFrame((state) => {
    if (!mat.current) return
    mat.current.uniforms.uTime.value = state.clock.elapsedTime
    mat.current.uniforms.uMouse.value.copy(mouse.current)
  })

  const w = Math.max(viewport.width, 12)
  const h = Math.max(viewport.height, 12)

  return (
    <mesh position={[0, 1.2, -6]} scale={[w * 1.4, h * 1.4, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={mat}
        vertexShader={gradientVert}
        fragmentShader={gradientFrag}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  )
}

function OrbitParticles({ count = 500 }: { count?: number }) {
  const mat = useRef<ShaderMaterial>(null)
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = 1.8 + Math.random() * 2.2
      const a = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 1.6
      positions[i * 3] = Math.cos(a) * r
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(a) * r
      phases[i] = Math.random() * Math.PI * 2
      sizes[i] = 2 + Math.random() * 4
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(positions, 3))
    g.setAttribute('aPhase', new Float32BufferAttribute(phases, 1))
    g.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
    return g
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new Color('#FF6B00') },
    }),
    [],
  )

  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <points geometry={geometry} rotation={[0, 0, 0]}>
      <shaderMaterial
        ref={mat}
        depthWrite={false}
        transparent
        blending={AdditiveBlending}
        vertexShader={particleVert}
        fragmentShader={particleFrag}
        uniforms={uniforms}
      />
    </points>
  )
}

type HeroSceneProps = {
  mouseRef: MutableRefObject<Vector2>
  reduceEffects?: boolean
}

function KeyLight() {
  const ref = useRef<SpotLight>(null)
  useLayoutEffect(() => {
    const L = ref.current
    if (L?.shadow?.mapSize) L.shadow.mapSize.set(1024, 1024)
  }, [])
  return (
    <spotLight
      ref={ref}
      position={[3, 6, 2]}
      angle={0.45}
      penumbra={0.6}
      intensity={2.2}
      color="#FF6B00"
      castShadow
    />
  )
}

export function HeroScene({ mouseRef, reduceEffects }: HeroSceneProps) {
  const particles = reduceEffects ? 220 : 500

  return (
    <>
      <color attach="background" args={['#090B0E']} />
      <ambientLight intensity={0.25} />
      <KeyLight />
      <spotLight position={[-4, 3, -3]} intensity={0.9} color="#ffffff" />
      <BackgroundPlane mouse={mouseRef} />
      <Truck position={[0, 0.05, 0]} />
      <OrbitParticles count={particles} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial
          color="#07080a"
          metalness={0.55}
          roughness={0.35}
          envMapIntensity={reduceEffects ? 0.4 : 0.85}
        />
      </mesh>
    </>
  )
}
