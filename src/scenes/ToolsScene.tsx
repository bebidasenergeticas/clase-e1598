import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ToolId } from '../data/courseContent'
import { tools } from '../data/courseContent'
import { C, Label, Particles, Stage3D, TechFloor, approach, getGlowTexture, isMotion, unitBox, useCameraRig, useSceneClock, useStageFit } from './common/kit'

export type ToolsFocus = 'overview' | ToolId | 'table' | 'statement'

const X: Record<ToolId, number> = { zapier: -4.6, make: 0, n8n: 4.6 }
const ACCENT: Record<ToolId, string> = { zapier: '#ff8a3d', make: C.violet, n8n: '#ff7a9c' }

function Pedestal({ color, active }: { color: string; active: { current: number } }) {
  const ring = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    if (ring.current) ring.current.opacity = 0.25 + active.current * 0.6
  })
  return (
    <group position={[0, -1.35, 0]}>
      <mesh>
        <cylinderGeometry args={[1.6, 1.75, 0.16, 48]} />
        <meshStandardMaterial color={C.body} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.085, 0]}>
        <ringGeometry args={[1.48, 1.56, 64]} />
        <meshBasicMaterial ref={ring} color={color} transparent opacity={0.3} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** ZAPIER · velocidad / simplicidad: bloque compacto con anillo de conectores. */
function ZapierModule({ t }: { t: { current: number } }) {
  const pins = useRef<THREE.Group>(null)
  const pinPos = useMemo(() => Array.from({ length: 28 }, (_, i) => (i / 28) * Math.PI * 2), [])
  useFrame(() => {
    if (pins.current) pins.current.rotation.y = t.current * 0.9
  })
  return (
    <group>
      <mesh geometry={unitBox} scale={[1.3, 0.9, 0.9]}>
        <meshStandardMaterial color={C.bodyHi} metalness={0.6} roughness={0.25} emissive={ACCENT.zapier} emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0, 0, 0.46]} scale={[0.7, 0.06, 0.01]} geometry={unitBox}>
        <meshBasicMaterial color={ACCENT.zapier} toneMapped={false} />
      </mesh>
      <group ref={pins}>
        {pinPos.map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 1.25, (i % 3) * 0.18 - 0.18, Math.sin(a) * 1.25]} geometry={unitBox} scale={0.08}>
            <meshBasicMaterial color={i % 4 === 0 ? ACCENT.zapier : '#cfd6e6'} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** MAKE · visual / flexibilidad: lienzo con módulos circulares multidireccionales. */
function MakeModule({ t }: { t: { current: number } }) {
  const nodes: [number, number][] = [
    [-0.8, 0.45],
    [0, 0.65],
    [0.8, 0.3],
    [-0.5, -0.4],
    [0.35, -0.35],
    [0.95, -0.55],
  ]
  const links: [number, number][] = [
    [0, 1], [1, 2], [0, 3], [3, 4], [1, 4], [4, 5], [2, 5],
  ]
  const lines = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pts: number[] = []
    links.forEach(([a, b]) => pts.push(nodes[a][0], nodes[a][1], 0.06, nodes[b][0], nodes[b][1], 0.06))
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: ACCENT.make, transparent: true, opacity: 0.8, toneMapped: false }))
  }, [])
  const iter = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (iter.current) iter.current.rotation.z = -t.current * 1.6
  })
  return (
    <group rotation={[-0.25, 0, 0]}>
      <mesh geometry={unitBox} scale={[2.5, 1.7, 0.08]}>
        <meshStandardMaterial color={C.bodyHi} metalness={0.5} roughness={0.35} />
      </mesh>
      <primitive object={lines} />
      {nodes.map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.08, 20]} />
          <meshStandardMaterial color="#1b1640" emissive={ACCENT.make} emissiveIntensity={i === 4 ? 1 : 0.45} />
        </mesh>
      ))}
      <mesh ref={iter} position={[nodes[4][0], nodes[4][1], 0.12]}>
        <torusGeometry args={[0.26, 0.012, 6, 32, Math.PI * 1.5]} />
        <meshBasicMaterial color={C.white} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** N8N · control / extensibilidad: rack auto-hospedado con jaula y módulos enchufables. */
function N8nModule({ t }: { t: { current: number } }) {
  const leds = useRef<THREE.Group>(null)
  const plug = useRef<THREE.Group>(null)
  useFrame(() => {
    leds.current?.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial
      m.opacity = 0.35 + 0.65 * (Math.sin(t.current * 4 + i * 1.7) > 0.2 ? 1 : 0)
    })
    if (plug.current) plug.current.position.x = 1.05 + Math.max(0, Math.sin(t.current * 0.8)) * 0.25
  })
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, -0.5 + i * 0.32, 0]} geometry={unitBox} scale={[1.35, 0.24, 0.95]}>
          <meshStandardMaterial color={C.bodyHi} metalness={0.65} roughness={0.28} />
        </mesh>
      ))}
      <group ref={leds}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0.45, -0.5 + i * 0.32, 0.48]} geometry={unitBox} scale={[0.22, 0.04, 0.01]}>
            <meshBasicMaterial color={ACCENT.n8n} transparent toneMapped={false} />
          </mesh>
        ))}
      </group>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.75, 1.6, 1.3)]} />
        <lineBasicMaterial color={ACCENT.n8n} transparent opacity={0.6} toneMapped={false} />
      </lineSegments>
      <group ref={plug} position={[1.05, 0.1, 0]}>
        <mesh geometry={unitBox} scale={[0.32, 0.32, 0.32]}>
          <meshStandardMaterial color="#2a1420" emissive={ACCENT.n8n} emissiveIntensity={0.5} />
        </mesh>
      </group>
      <Label position={[-0.3, 0.95, 0]} size={0.2} color={ACCENT.n8n}>
        {'{ }'}
      </Label>
    </group>
  )
}

function Tool({ id, focus, onSelect, t }: { id: ToolId; focus: ToolsFocus; onSelect: (id: ToolId) => void; t: { current: number } }) {
  const g = useRef<THREE.Group>(null)
  const [hover, setHover] = useState(false)
  const active = useRef(0)
  const info = tools.find((x) => x.id === id)!
  const tex = getGlowTexture()
  const halo = useRef<THREE.SpriteMaterial>(null)

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05)
    const isFocus = focus === id
    const dimmed = (focus === 'zapier' || focus === 'make' || focus === 'n8n') && !isFocus
    active.current = approach(active.current, isFocus || hover ? 1 : dimmed ? 0 : 0.35, 5, dt)
    if (g.current) {
      const s = 1 + (hover ? 0.05 : 0) + (isFocus ? 0.06 : 0)
      g.current.scale.setScalar(approach(g.current.scale.x, s, 6, dt))
      g.current.position.y = Math.sin(t.current * 0.9 + X[id]) * 0.06
      if (isMotion()) g.current.rotation.y = approach(g.current.rotation.y, isFocus ? 0.35 : Math.sin(t.current * 0.3 + X[id]) * 0.2, 2, dt)
    }
    if (halo.current) halo.current.opacity = 0.12 + active.current * 0.4
  })

  return (
    <group
      position={[X[id], 0, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHover(false)
        document.body.style.cursor = ''
      }}
    >
      <sprite scale={5} position={[0, 0, -1]}>
        <spriteMaterial ref={halo} map={tex} color={ACCENT[id]} transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <group ref={g}>
        {id === 'zapier' && <ZapierModule t={t} />}
        {id === 'make' && <MakeModule t={t} />}
        {id === 'n8n' && <N8nModule t={t} />}
      </group>
      <Pedestal color={ACCENT[id]} active={active} />
      <Label position={[0, -2.0, 0.6]} size={0.42} display>
        {info.name}
      </Label>
      <Label position={[0, -2.5, 0.6]} size={0.15} color={ACCENT[id]}>
        {`${info.tradeoff[0]} / ${info.tradeoff[1]}`}
      </Label>
      {/* zona de clic amplia */}
      <mesh visible={false} position={[0, -0.4, 0]}>
        <boxGeometry args={[3, 4, 2]} />
      </mesh>
    </group>
  )
}

function Tools({ focus, onSelect }: { focus: ToolsFocus; onSelect: (id: ToolId) => void }) {
  const t = useSceneClock()
  const root = useRef<THREE.Group>(null)
  // Columna oficial a la izquierda y pasos arriba; en la conclusión, centrado
  useStageFit(root, () => ({ w: 13.6, h: 5.4, left: focus === 'statement' ? 0 : 0.36, top: 0.2, bottom: 0.08 }))

  useCameraRig(() => {
    if (focus === 'zapier' || focus === 'make' || focus === 'n8n') {
      const k = root.current?.scale.x ?? 1
      const x = X[focus] * k
      return { pos: new THREE.Vector3(x + 1.4 * k, 0.9 * k, 7.6 * k), look: new THREE.Vector3(x, 0, 0) }
    }
    if (focus === 'table') return { pos: new THREE.Vector3(0, 4.2, 12.5), look: new THREE.Vector3(0, -0.8, 0) }
    if (focus === 'statement') return { pos: new THREE.Vector3(0, 1.5, 17), look: new THREE.Vector3(0, -0.6, 0) }
    return { pos: new THREE.Vector3(0.6, 1.4, 12.5), look: new THREE.Vector3(0, -0.6, 0) }
  }, 1.8)

  return (
    <group ref={root}>
      <group position={[0, 0.6, 0]}>
      {(Object.keys(X) as ToolId[]).map((id) => (
        <Tool key={id} id={id} focus={focus} onSelect={onSelect} t={t} />
      ))}
      <TechFloor y={-1.45} opacity={0.6} />
      <Particles count={70} opacity={0.25} />
      </group>
    </group>
  )
}

export default function ToolsScene({ visible, focus, onSelect }: { visible: boolean; focus: ToolsFocus; onSelect: (id: ToolId) => void }) {
  return (
    <Stage3D visible={visible} camera={{ position: [0.6, 1.4, 12.5], fov: 40 }} interactive>
      <fog attach="fog" args={[C.bg, 14, 30]} />
      <Tools focus={focus} onSelect={onSelect} />
    </Stage3D>
  )
}
