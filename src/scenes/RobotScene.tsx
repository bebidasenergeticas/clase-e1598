import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { C, FloatTag, Particles, PulseRing, Stage3D, TechFloor, approach, getBox, getGlowTexture, isMotion, makePulse, makeTag, range, smooth, useCameraRig, useSceneClock, useStageFit, type PulseCtl, type TagCtl } from './common/kit'

/**
 * Brazo robótico abstracto que se ensambla pieza por pieza: una pieza por regla.
 * Stage 0..5 (5 = completo: el brazo trabaja moviendo un paquete de datos).
 */

/** Rótulo "REGLA 0n" + pulso que acompañan a la pieza recién ensamblada. */
function PartTag({ n, tag, pulse, at }: { n: number; tag: TagCtl; pulse: PulseCtl; at: [number, number, number] }) {
  return (
    <>
      <FloatTag ctl={tag} text={`REGLA ${String(n).padStart(2, '0')}`} icon="check" position={at} size={0.16} />
      <PulseRing ctl={pulse} color={C.gold} position={[0, at[1] * 0.4, 0]} radius={0.5} />
    </>
  )
}

function Part({ k, from, children }: { k: { current: number }; from: [number, number, number]; children: ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    const e = smooth(k.current)
    if (!g.current) return
    g.current.position.set(from[0] * (1 - e), from[1] * (1 - e), from[2] * (1 - e))
    g.current.rotation.set((1 - e) * 0.8, (1 - e) * 1.2, 0)
    g.current.scale.setScalar(Math.max(0.0001, 0.4 + 0.6 * e))
    g.current.visible = k.current > 0.01
  })
  return <group ref={g}>{children}</group>
}

function Block({ size, position, color = C.bodyHi, edge = C.cyan, edgeOpacity = 0.55 }: { size: [number, number, number]; position?: [number, number, number]; color?: string; edge?: string; edgeOpacity?: number }) {
  const geo = getBox(...size)
  return (
    <group position={position}>
      <mesh geometry={geo.box}>
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.28} />
      </mesh>
      <lineSegments geometry={geo.edges}>
        <lineBasicMaterial color={edge} transparent opacity={edgeOpacity} toneMapped={false} />
      </lineSegments>
    </group>
  )
}

function Joint({ r = 0.26, color = C.gold }: { r?: number; color?: string }) {
  return (
    <mesh>
      <sphereGeometry args={[r, 20, 14]} />
      <meshStandardMaterial color="#141c33" metalness={0.8} roughness={0.25} emissive={color} emissiveIntensity={0.25} />
    </mesh>
  )
}

function Robot({ progress, beats }: { progress: { current: number }; beats: number }) {
  const t = useSceneClock()
  const root = useRef<THREE.Group>(null)
  const turret = useRef<THREE.Group>(null)
  const shoulder = useRef<THREE.Group>(null)
  const elbow = useRef<THREE.Group>(null)
  const wrist = useRef<THREE.Group>(null)
  const fingerL = useRef<THREE.Group>(null)
  const fingerR = useRef<THREE.Group>(null)
  const eye = useRef<THREE.SpriteMaterial>(null)
  const ring = useRef<THREE.MeshBasicMaterial>(null)
  const packet = useRef<THREE.Group>(null)
  const ks = useMemo(() => Array.from({ length: 5 }, () => ({ current: 0 })), [])
  const partTags = useMemo(() => Array.from({ length: 5 }, () => makeTag(C.gold)), [])
  const partPulses = useMemo(() => Array.from({ length: 5 }, () => makePulse()), [])
  const landed = useRef([false, false, false, false, false])
  const tex = getGlowTexture()
  const stageOf = () => progress.current * (beats - 1)

  useCameraRig(() => {
    const s = stageOf()
    const done = range(s, 4.5, 5)
    return { pos: new THREE.Vector3(4.2 - done * 1.2, 1.3 + done * 0.4, 10.5 - done * 0.8), look: new THREE.Vector3(0, 0, 0) }
  }, 1.8)
  // Las reglas ocupan la mitad izquierda
  useStageFit(root, () => ({ w: 6, h: 7.4, left: 0.5, top: 0.12, bottom: 0.1 }))

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05)
    const s = stageOf()
    const time = t.current
    const complete = range(s, 4.6, 5)
    // la pieza de la regla actual muestra su número; al encajar, pulsa
    const beatNow = Math.round(s)
    partTags.forEach((tg, i) => (tg.on = beatNow === i && s < 4.6 ? 1 : 0))
    ks.forEach((k, i) => {
      const isIn = k.current > 0.95
      if (isIn && !landed.current[i]) partPulses[i].n++
      landed.current[i] = isIn
      k.current = approach(k.current, range(s, i - 0.85, i - 0.15), 6, dt)
    })
    // Pose: recogida → brazo trabajando cuando está completo
    const work = complete > 0 && isMotion() ? time : 0
    const cyc = (Math.sin(work * 0.9) + 1) / 2
    if (turret.current) turret.current.rotation.y = approach(turret.current.rotation.y, complete ? -0.6 + cyc * 1.2 : 0.35, 3, dt)
    if (shoulder.current) shoulder.current.rotation.z = approach(shoulder.current.rotation.z, complete ? 0.35 + cyc * 0.25 : 0.15, 3, dt)
    if (elbow.current) elbow.current.rotation.z = approach(elbow.current.rotation.z, complete ? -1.35 + cyc * 0.35 : -1.1, 3, dt)
    if (wrist.current) wrist.current.rotation.z = approach(wrist.current.rotation.z, complete ? -0.5 - cyc * 0.2 : -0.4, 3, dt)
    const grip = complete ? 0.06 + (1 - cyc) * 0.08 : 0.16
    if (fingerL.current) fingerL.current.position.x = approach(fingerL.current.position.x, -grip, 6, dt)
    if (fingerR.current) fingerR.current.position.x = approach(fingerR.current.position.x, grip, 6, dt)
    if (eye.current) {
      eye.current.color.set(complete ? C.gold : C.cyan)
      eye.current.opacity = 0.3 + ks[4].current * 0.5 + complete * 0.2 * (1 + Math.sin(time * 4))
    }
    if (ring.current) ring.current.opacity = 0.2 + complete * 0.6
    if (packet.current) {
      packet.current.visible = complete > 0.5
      packet.current.rotation.set(time, time * 1.3, 0)
    }
  })

  return (
    <group ref={root}>
     <group position={[0, -2.7, 0]}>
      {/* 01 · base */}
      <Part k={ks[0]} from={[0, -2.5, 0]}>
        <PartTag n={1} tag={partTags[0]} pulse={partPulses[0]} at={[2.25, 0.35, 0.5]} />
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[1.45, 1.6, 0.3, 48]} />
          <meshStandardMaterial color={C.bodyHi} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.31, 0]}>
          <ringGeometry args={[1.25, 1.32, 64]} />
          <meshBasicMaterial ref={ring} color={C.gold} transparent opacity={0.2} toneMapped={false} />
        </mesh>
      </Part>

      {/* 02 · torreta */}
      <Part k={ks[1]} from={[0, 3, 0]}>
        <PartTag n={2} tag={partTags[1]} pulse={partPulses[1]} at={[1.75, 0.75, 0.5]} />
        <group ref={turret} position={[0, 0.3, 0]}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.72, 0.85, 0.7, 32]} />
            <meshStandardMaterial color={C.body} metalness={0.75} roughness={0.25} emissive={C.cyan} emissiveIntensity={0.05} />
          </mesh>
          {/* 03 · brazo inferior */}
          <group ref={shoulder} position={[0, 0.85, 0]}>
            <Part k={ks[2]} from={[-2.5, 1, 0]}>
              <PartTag n={3} tag={partTags[2]} pulse={partPulses[2]} at={[1.05, 1.1, 0.5]} />
              <Joint r={0.32} />
              <Block size={[0.38, 2.1, 0.42]} position={[0, 1.05, 0]} />
              {/* 04 · brazo superior */}
              <group ref={elbow} position={[0, 2.1, 0]}>
                <Part k={ks[3]} from={[2.5, 1.5, 0]}>
                  <PartTag n={4} tag={partTags[3]} pulse={partPulses[3]} at={[0.95, 0.85, 0.5]} />
                  <Joint r={0.26} />
                  <Block size={[0.32, 1.7, 0.36]} position={[0, 0.85, 0]} edge={C.gold} edgeOpacity={0.45} />
                  {/* 05 · muñeca + pinza + sensor */}
                  <group ref={wrist} position={[0, 1.7, 0]}>
                    <Part k={ks[4]} from={[0, 2.5, 1.5]}>
                      <PartTag n={5} tag={partTags[4]} pulse={partPulses[4]} at={[0.95, 0.35, 0.5]} />
                      <Joint r={0.2} color={C.cyan} />
                      <Block size={[0.5, 0.18, 0.4]} position={[0, 0.22, 0]} />
                      <group ref={fingerL} position={[-0.16, 0.48, 0]}>
                        <Block size={[0.07, 0.36, 0.22]} edge={C.white} edgeOpacity={0.4} />
                      </group>
                      <group ref={fingerR} position={[0.16, 0.48, 0]}>
                        <Block size={[0.07, 0.36, 0.22]} edge={C.white} edgeOpacity={0.4} />
                      </group>
                      <sprite position={[0, 0.22, 0.25]} scale={0.9}>
                        <spriteMaterial ref={eye} map={tex} color={C.cyan} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
                      </sprite>
                      <group ref={packet} position={[0, 0.55, 0]} visible={false}>
                        <mesh scale={0.16}>
                          <boxGeometry args={[1, 1, 1]} />
                          <meshBasicMaterial color={C.gold} toneMapped={false} />
                        </mesh>
                        <sprite scale={0.9}>
                          <spriteMaterial map={tex} color={C.gold} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
                        </sprite>
                      </group>
                    </Part>
                  </group>
                </Part>
              </group>
            </Part>
          </group>
        </group>
      </Part>

      <TechFloor y={0} opacity={0.6} />
      <Particles count={60} opacity={0.25} spread={[18, 10, 10]} />
     </group>
    </group>
  )
}

export default function RobotScene({ visible, progress, beats }: { visible: boolean; progress: { current: number }; beats: number }) {
  return (
    <Stage3D visible={visible} camera={{ position: [4.2, 3, 10.5], fov: 40 }}>
      <fog attach="fog" args={[C.bg, 12, 26]} />
      <Robot progress={progress} beats={beats} />
    </Stage3D>
  )
}
