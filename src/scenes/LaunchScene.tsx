import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { C, Label, Particles, Stage3D, TechFloor, approach, getGlowTexture, isMotion, unitBox, useCameraRig, useSceneClock, useStageFit } from './common/kit'

/**
 * Máquina de lanzamiento: 11 segmentos (uno por check) alrededor de un núcleo.
 * Cada check enciende su segmento y acopla su módulo. Con todo listo → SYSTEM READY;
 * al activar, el sistema completo empieza a funcionar.
 */
const N = 11
const R_SEG = 2.55
const R_MOD = 3.3

const cOff = new THREE.Color('#1b2440')
const cOn = new THREE.Color(C.cyan)
const cGold = new THREE.Color(C.gold)
const tmp = new THREE.Color()

function Machine({ checks, active }: { checks: boolean[]; active: boolean }) {
  const t = useSceneClock()
  const root = useRef<THREE.Group>(null)
  const core = useRef<THREE.Group>(null)
  const coreMat = useRef<THREE.MeshStandardMaterial>(null)
  const coreHalo = useRef<THREE.SpriteMaterial>(null)
  const cage = useRef<THREE.Mesh>(null)
  const outer = useRef<THREE.Group>(null)
  const segs = useRef<(THREE.Mesh | null)[]>([])
  const mods = useRef<(THREE.Group | null)[]>([])
  const beams = useRef<(THREE.Mesh | null)[]>([])
  const orbit = useRef<THREE.Group>(null)
  const ready = checks.every(Boolean)
  const tex = getGlowTexture()

  const angles = useMemo(() => Array.from({ length: N }, (_, i) => Math.PI / 2 - (i + 0.5) * ((Math.PI * 2) / N)), [])
  const arc = (Math.PI * 2) / N - 0.07

  useCameraRig(() => ({ pos: new THREE.Vector3(0, active ? 1.4 : 0.9, active ? 11.5 : 12), look: new THREE.Vector3(0, 0, 0) }), 1.6)
  // Estado arriba; ciclo de producción y botones abajo
  useStageFit(root, () => ({ w: 10.2, h: 10.2, top: 0.15, bottom: 0.25, max: 1.3 }))

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05)
    const time = t.current
    const motion = isMotion()
    if (root.current) {
      if (motion) root.current.rotation.y = approach(root.current.rotation.y, active ? Math.sin(time * 0.25) * 0.35 : -0.18, 1.5, dt)
    }
    const done = checks.filter(Boolean).length
    checks.forEach((on, i) => {
      const s = segs.current[i]
      if (s) {
        const m = s.material as THREE.MeshStandardMaterial
        tmp.copy(on ? (ready ? cGold : cOn) : cOff)
        m.emissive.lerp(tmp, 1 - Math.exp(-6 * dt))
        m.emissiveIntensity = on ? (active ? 0.9 + 0.3 * Math.sin(time * 6 - i) : 0.8) : 0.15
      }
      const g = mods.current[i]
      if (g) {
        const r = on ? R_MOD : R_MOD + 1.1
        const a = angles[i]
        g.position.x = approach(g.position.x, Math.cos(a) * r, 5, dt)
        g.position.y = approach(g.position.y, Math.sin(a) * r, 5, dt)
        const sc = approach(g.scale.x, on ? 1 : 0.6, 5, dt)
        g.scale.setScalar(sc)
        const box = g.children[0] as THREE.Mesh
        ;(box.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 0.9 : 0.05
      }
      const b = beams.current[i]
      if (b) {
        const k = approach(b.scale.y, on ? 1 : 0.0001, 4, dt)
        b.scale.y = k
        b.visible = k > 0.01
        ;(b.material as THREE.MeshBasicMaterial).opacity = active ? 0.35 + 0.3 * Math.sin(time * 8 - i) : 0.18
      }
    })
    const k = done / N
    if (coreMat.current) {
      tmp.copy(ready ? cGold : cOn)
      coreMat.current.emissive.lerp(tmp, 1 - Math.exp(-4 * dt))
      coreMat.current.emissiveIntensity = 0.15 + k * 0.7 + (active ? 0.5 + 0.3 * Math.sin(time * 5) : 0)
    }
    if (coreHalo.current) {
      coreHalo.current.color.copy(ready ? cGold : cOn)
      coreHalo.current.opacity = approach(coreHalo.current.opacity, 0.1 + k * 0.4 + (active ? 0.35 : 0), 3, dt)
    }
    if (core.current && motion) core.current.rotation.y += dt * (active ? 1.6 : 0.25)
    if (cage.current && motion) {
      cage.current.rotation.x += dt * (active ? 0.9 : 0.1)
      cage.current.rotation.z -= dt * (active ? 0.6 : 0.05)
    }
    if (outer.current) {
      const sc = approach(outer.current.scale.x, ready ? 1 : 0.0001, 3, dt)
      outer.current.scale.setScalar(sc)
      outer.current.visible = sc > 0.01
      if (motion) outer.current.rotation.z -= dt * (active ? 0.8 : 0.15)
    }
    if (orbit.current) {
      orbit.current.visible = active
      if (motion) orbit.current.rotation.z += dt * 1.4
    }
  })

  return (
    <group ref={root}>
      {/* núcleo */}
      <group ref={core}>
        <mesh>
          <icosahedronGeometry args={[0.85, 1]} />
          <meshStandardMaterial ref={coreMat} color="#0c1426" emissive={C.cyan} emissiveIntensity={0.2} metalness={0.4} roughness={0.3} flatShading />
        </mesh>
      </group>
      <mesh ref={cage}>
        <icosahedronGeometry args={[1.3, 0]} />
        <meshBasicMaterial color={C.white} wireframe transparent opacity={0.25} toneMapped={false} />
      </mesh>
      <sprite scale={6}>
        <spriteMaterial ref={coreHalo} map={tex} color={C.cyan} transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>

      {/* segmentos */}
      {angles.map((a, i) => (
        <mesh key={i} ref={(m) => void (segs.current[i] = m)} rotation={[0, 0, a - arc / 2]}>
          <torusGeometry args={[R_SEG, 0.12, 8, 24, arc]} />
          <meshStandardMaterial color="#0d1428" emissive="#1b2440" emissiveIntensity={0.15} metalness={0.5} roughness={0.35} />
        </mesh>
      ))}

      {/* módulos acoplables + haces al núcleo */}
      {angles.map((a, i) => (
        <group key={i}>
          <mesh
            ref={(m) => void (beams.current[i] = m)}
            position={[Math.cos(a) * ((R_SEG + 1.2) / 2), Math.sin(a) * ((R_SEG + 1.2) / 2), 0]}
            rotation={[0, 0, a - Math.PI / 2]}
          >
            <boxGeometry args={[0.02, R_SEG - 1.2, 0.02]} />
            <meshBasicMaterial color={C.cyan} transparent opacity={0.2} depthWrite={false} toneMapped={false} />
          </mesh>
          <group ref={(g) => void (mods.current[i] = g)} position={[Math.cos(a) * (R_MOD + 1.1), Math.sin(a) * (R_MOD + 1.1), 0]}>
            <mesh geometry={unitBox} scale={0.34} rotation={[0, 0, a]}>
              <meshStandardMaterial color="#101a33" emissive={C.cyan} emissiveIntensity={0.05} metalness={0.5} roughness={0.3} />
            </mesh>
            <Label position={[Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0]} size={0.15} color="#8a93a8">
              {String(i + 1).padStart(2, '0')}
            </Label>
          </group>
        </group>
      ))}

      {/* anillo exterior (aparece con SYSTEM READY) */}
      <group ref={outer}>
        <mesh>
          <torusGeometry args={[4.25, 0.012, 6, 128]} />
          <meshBasicMaterial color={C.gold} transparent opacity={0.7} toneMapped={false} />
        </mesh>
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 4.25, Math.sin(a) * 4.25, 0]} rotation={[0, 0, a]} geometry={unitBox} scale={[0.14, 0.02, 0.02]}>
              <meshBasicMaterial color={C.gold} toneMapped={false} />
            </mesh>
          )
        })}
      </group>

      {/* paquetes en órbita al activar */}
      <group ref={orbit} visible={false}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <sprite key={i} position={[Math.cos(a) * R_SEG, Math.sin(a) * R_SEG, 0.25]} scale={0.7}>
              <spriteMaterial map={tex} color={i % 2 ? C.gold : C.cyan} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </sprite>
          )
        })}
      </group>

      <TechFloor y={-4.8} opacity={0.5} />
      <Particles count={60} opacity={0.25} />
    </group>
  )
}

export default function LaunchScene({ visible, checks, active }: { visible: boolean; checks: boolean[]; active: boolean }) {
  return (
    <Stage3D visible={visible} camera={{ position: [0, 0.9, 12], fov: 40 }}>
      <fog attach="fog" args={[C.bg, 14, 28]} />
      <Machine checks={checks} active={active} />
    </Stage3D>
  )
}
