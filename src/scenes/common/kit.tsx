import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor, Text } from '@react-three/drei'
import * as THREE from 'three'
import monoFont from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff?url'
import displayFont from '@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff?url'
import { scenesShouldRun, useUI } from '../../store/ui'

/* ------------------------------------------------------------------ */
/* Paleta                                                               */
/* ------------------------------------------------------------------ */
export const C = {
  bg: '#05070d',
  body: '#0b1224',
  bodyHi: '#121b35',
  white: '#eef1f7',
  dim: '#3a4566',
  cyan: '#6fd3ff',
  blue: '#4d8dff',
  gold: '#f5a524',
  red: '#ff5d5d',
  green: '#45e0a0',
  violet: '#a996ff',
}

/* ------------------------------------------------------------------ */
/* Utilidades de animación                                              */
/* ------------------------------------------------------------------ */
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
/** 0..1 según x en [a,b] */
export const range = (x: number, a: number, b: number) => clamp01((x - a) / (b - a))
export const smooth = (x: number) => x * x * (3 - 2 * x)
export const isMotion = () => useUI.getState().motion

/** Amortiguación hacia target; con animaciones desactivadas, salta directo. */
export function approach(current: number, target: number, lambda: number, dt: number) {
  if (!isMotion()) return target
  return THREE.MathUtils.damp(current, target, lambda, dt)
}

/** Reloj de escena que se congela cuando las animaciones están desactivadas. */
export function useSceneClock() {
  const t = useRef(0)
  useFrame((_, d) => {
    if (isMotion()) t.current += Math.min(d, 0.05)
  })
  return t
}

/* ------------------------------------------------------------------ */
/* Canvas                                                               */
/* ------------------------------------------------------------------ */
function DemandTicker({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!active) return
    invalidate()
    const id = window.setInterval(() => invalidate(), 200)
    return () => window.clearInterval(id)
  }, [active, invalidate])
  return null
}

/**
 * Canvas optimizado para gráficos integrados:
 * - dpr limitado (baja a 1 si el rendimiento cae)
 * - frameloop "always" solo si la sección es visible y no hay overlays
 * - con animaciones desactivadas: render a baja frecuencia para reflejar cambios de estado
 */
export function Stage3D({
  visible,
  children,
  camera = { position: [0, 0, 10], fov: 38 },
  interactive = false,
}: {
  visible: boolean
  children: ReactNode
  camera?: { position: [number, number, number]; fov?: number }
  interactive?: boolean
}) {
  const run = useUI(scenesShouldRun)
  const motion = useUI((s) => s.motion)
  const [dpr, setDpr] = useState(1.5)
  const live = visible && run
  return (
    <Canvas
      frameloop={live ? 'always' : 'demand'}
      dpr={[1, dpr]}
      camera={{ position: camera.position, fov: camera.fov ?? 38, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      style={{ position: 'absolute', inset: 0, pointerEvents: interactive ? 'auto' : 'none' }}
      flat
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <DemandTicker active={visible && !motion} />
      <LabLights />
      {children}
    </Canvas>
  )
}

export function LabLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 8, 6]} intensity={1.1} color="#dfe8ff" />
      <directionalLight position={[-8, 2, -4]} intensity={0.6} color={C.gold} />
      <pointLight position={[0, -3, 5]} intensity={8} distance={18} color={C.blue} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Texturas procedurales                                                */
/* ------------------------------------------------------------------ */
let glowTex: THREE.Texture | null = null
export function getGlowTexture() {
  if (glowTex) return glowTex
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.18, 'rgba(255,255,255,0.55)')
  grd.addColorStop(0.45, 'rgba(255,255,255,0.12)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, s, s)
  glowTex = new THREE.CanvasTexture(c)
  glowTex.colorSpace = THREE.SRGBColorSpace
  return glowTex
}

const boxGeoCache = new Map<string, { box: THREE.BoxGeometry; edges: THREE.EdgesGeometry }>()
export function getBox(w: number, h: number, d: number) {
  const key = `${w}|${h}|${d}`
  let v = boxGeoCache.get(key)
  if (!v) {
    const box = new THREE.BoxGeometry(w, h, d)
    v = { box, edges: new THREE.EdgesGeometry(box) }
    boxGeoCache.set(key, v)
  }
  return v
}
export const unitBox = new THREE.BoxGeometry(1, 1, 1)
export const unitSphere = new THREE.SphereGeometry(1, 16, 12)

/* ------------------------------------------------------------------ */
/* Glow                                                                 */
/* ------------------------------------------------------------------ */
export function Glow({ color = C.cyan, scale = 1, opacity = 1, position }: { color?: string; scale?: number; opacity?: number; position?: [number, number, number] }) {
  const tex = getGlowTexture()
  return (
    <sprite scale={scale} position={position}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

/* ------------------------------------------------------------------ */
/* Texto 3D (fuentes locales, sin CDN)                                  */
/* ------------------------------------------------------------------ */
export function Label({
  children,
  size = 0.22,
  color = C.white,
  position,
  display = false,
  anchorX = 'center',
  anchorY = 'middle',
  opacity = 1,
  letterSpacing = 0.12,
  rotation,
}: {
  children: string
  size?: number
  color?: string
  position?: [number, number, number]
  display?: boolean
  anchorX?: 'left' | 'center' | 'right'
  anchorY?: 'top' | 'middle' | 'bottom'
  opacity?: number
  letterSpacing?: number
  rotation?: [number, number, number]
}) {
  return (
    <Text
      font={display ? displayFont : monoFont}
      fontSize={size}
      color={color}
      position={position}
      rotation={rotation}
      anchorX={anchorX}
      anchorY={anchorY}
      letterSpacing={display ? -0.01 : letterSpacing}
      fillOpacity={opacity}
    >
      {children}
    </Text>
  )
}

/* ------------------------------------------------------------------ */
/* Nodo / módulo animable                                               */
/* ------------------------------------------------------------------ */
export interface NodeAnim {
  show: number
  glow: number
  color: THREE.Color
  /** Posición objetivo (si se define, el nodo se desplaza suavemente) */
  pos?: THREE.Vector3
  shake?: number
  _show: number
  _glow: number
}

export function makeAnim(color: string, show = 0, pos?: [number, number, number]): NodeAnim {
  return { show, glow: 0, color: new THREE.Color(color), pos: pos ? new THREE.Vector3(...pos) : undefined, shake: 0, _show: show, _glow: 0 }
}

const tmpColor = new THREE.Color()

export function Node3D({
  anim,
  size = [1.2, 0.72, 0.72],
  label,
  sub,
  labelBelow = false,
  onClick,
  onHover,
  diamond = false,
  children,
}: {
  anim: NodeAnim
  diamond?: boolean
  size?: [number, number, number]
  label?: string
  sub?: string
  labelBelow?: boolean
  onClick?: () => void
  onHover?: (v: boolean) => void
  children?: ReactNode
}) {
  const group = useRef<THREE.Group>(null)
  const edge = useRef<THREE.LineBasicMaterial>(null)
  const strip = useRef<THREE.MeshBasicMaterial>(null)
  const halo = useRef<THREE.SpriteMaterial>(null)
  const body = useRef<THREE.MeshStandardMaterial>(null)
  const geo = useMemo(() => getBox(...size), [size])
  const tex = getGlowTexture()

  useFrame((state, d) => {
    const dt = Math.min(d, 0.05)
    anim._show = approach(anim._show, anim.show, 7, dt)
    anim._glow = approach(anim._glow, anim.glow, 6, dt)
    const g = group.current
    if (!g) return
    const s = Math.max(0.0001, anim._show)
    g.scale.setScalar(s)
    g.visible = anim._show > 0.01
    if (anim.pos) {
      g.position.x = approach(g.position.x, anim.pos.x, 4, dt)
      g.position.y = approach(g.position.y, anim.pos.y, 4, dt)
      g.position.z = approach(g.position.z, anim.pos.z, 4, dt)
    }
    if (anim.shake && isMotion()) {
      g.rotation.z = Math.sin(state.clock.elapsedTime * 40) * 0.04 * anim.shake
    } else g.rotation.z = 0
    const gl = anim._glow
    if (edge.current) {
      edge.current.color.copy(anim.color)
      edge.current.opacity = 0.35 + 0.65 * Math.min(1, gl + 0.2)
    }
    if (strip.current) strip.current.color.copy(tmpColor.copy(anim.color).multiplyScalar(0.35 + 0.65 * gl))
    if (halo.current) {
      halo.current.color.copy(anim.color)
      halo.current.opacity = 0.55 * gl * anim._show
    }
    if (body.current) body.current.emissive.copy(tmpColor.copy(anim.color).multiplyScalar(0.12 * gl))
  })

  const labelY = labelBelow ? -size[1] / 2 - 0.32 : size[1] / 2 + 0.34
  return (
    <group
      ref={group}
      position={anim.pos ? anim.pos.toArray() : undefined}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation()
              onClick()
            }
          : undefined
      }
      onPointerOver={
        onHover
          ? (e) => {
              e.stopPropagation()
              onHover(true)
              document.body.style.cursor = 'pointer'
            }
          : undefined
      }
      onPointerOut={
        onHover
          ? () => {
              onHover(false)
              document.body.style.cursor = ''
            }
          : undefined
      }
    >
      <group rotation={diamond ? [0, 0, Math.PI / 4] : undefined}>
        <mesh geometry={geo.box}>
          <meshStandardMaterial ref={body} color={C.body} metalness={0.55} roughness={0.32} />
        </mesh>
        <lineSegments geometry={geo.edges}>
          <lineBasicMaterial ref={edge} transparent toneMapped={false} />
        </lineSegments>
        {!diamond && (
          <mesh position={[0, -size[1] * 0.22, size[2] / 2 + 0.002]}>
            <planeGeometry args={[size[0] * 0.62, 0.045]} />
            <meshBasicMaterial ref={strip} toneMapped={false} />
          </mesh>
        )}
      </group>
      <sprite scale={[size[0] * 3.2, size[0] * 3.2, 1]} position={[0, 0, -0.2]}>
        <spriteMaterial ref={halo} map={tex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      {label && (
        <Label position={[0, labelY, 0]} size={0.19}>
          {label}
        </Label>
      )}
      {sub && (
        <Label position={[0, labelY + (labelBelow ? -0.26 : 0.26), 0]} size={0.13} color="#8a93a8" letterSpacing={0.06}>
          {sub}
        </Label>
      )}
      {children}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Haz (línea gruesa) entre dos puntos, con crecimiento 0..1            */
/* ------------------------------------------------------------------ */
export interface BeamAnim {
  grow: number
  opacity: number
  color: THREE.Color
  _grow: number
  _opacity: number
}
export function makeBeam(color: string, grow = 0, opacity = 0.7): BeamAnim {
  return { grow, opacity, color: new THREE.Color(color), _grow: grow, _opacity: opacity }
}

const zAxis = new THREE.Vector3(0, 0, 1)
const tmpDir = new THREE.Vector3()

export function Beam({ from, to, anim, thickness = 0.028 }: { from: THREE.Vector3; to: THREE.Vector3; anim: BeamAnim; thickness?: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame((_, d) => {
    const dt = Math.min(d, 0.05)
    anim._grow = approach(anim._grow, anim.grow, 5, dt)
    anim._opacity = approach(anim._opacity, anim.opacity, 6, dt)
    const m = mesh.current
    if (!m) return
    tmpDir.subVectors(to, from)
    const len = tmpDir.length()
    const k = anim._grow
    m.visible = k > 0.005 && len > 0.001
    if (!m.visible) return
    tmpDir.normalize()
    m.quaternion.setFromUnitVectors(zAxis, tmpDir)
    m.position.copy(from).addScaledVector(tmpDir, (len * k) / 2)
    m.scale.set(thickness, thickness, len * k)
    if (mat.current) {
      mat.current.color.copy(anim.color)
      mat.current.opacity = anim._opacity
    }
  })
  return (
    <mesh ref={mesh} geometry={unitBox}>
      <meshBasicMaterial ref={mat} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Paquete de datos                                                     */
/* ------------------------------------------------------------------ */
export function Packet({ packetRef, color = C.cyan, size = 0.11 }: { packetRef: React.RefObject<THREE.Group | null>; color?: string; size?: number }) {
  const tex = getGlowTexture()
  return (
    <group ref={packetRef}>
      <mesh geometry={unitSphere} scale={size}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <sprite scale={size * 9}>
        <spriteMaterial map={tex} color={color} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Partículas (pocas, lentas)                                           */
/* ------------------------------------------------------------------ */
export function Particles({ count = 140, spread = [22, 12, 10], color = '#9fc4ff', size = 0.07, opacity = 0.5 }: { count?: number; spread?: [number, number, number]; color?: string; size?: number; opacity?: number }) {
  const points = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread[0]
      arr[i * 3 + 1] = (Math.random() - 0.5) * spread[1]
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread[2] - 2
    }
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [count, spread])
  useEffect(() => () => geo.dispose(), [geo])
  useFrame((_, d) => {
    if (!isMotion() || !points.current) return
    const dt = Math.min(d, 0.05)
    const a = geo.attributes.position as THREE.BufferAttribute
    const arr = a.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += dt * 0.12 * (0.4 + ((i * 7) % 10) / 10)
      if (arr[i * 3 + 1] > spread[1] / 2) arr[i * 3 + 1] = -spread[1] / 2
    }
    a.needsUpdate = true
  })
  return (
    <points ref={points} geometry={geo}>
      <pointsMaterial map={getGlowTexture()} color={color} size={size} sizeAttenuation transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </points>
  )
}

/* ------------------------------------------------------------------ */
/* Suelo técnico                                                        */
/* ------------------------------------------------------------------ */
export function TechFloor({ y = -2.2, size = 40, opacity = 0.5 }: { y?: number; size?: number; opacity?: number }) {
  const geo = useMemo(() => {
    const div = 40
    const g = new THREE.BufferGeometry()
    const pts: number[] = []
    const h = size / 2
    for (let i = 0; i <= div; i++) {
      const p = -h + (i / div) * size
      pts.push(p, 0, -h, p, 0, h, -h, 0, p, h, 0, p)
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [size])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <lineSegments geometry={geo} position={[0, y, 0]}>
      <lineBasicMaterial color="#2a3a66" transparent opacity={opacity * 0.5} depthWrite={false} />
    </lineSegments>
  )
}

/* ------------------------------------------------------------------ */
/* Cámara con amortiguación                                             */
/* ------------------------------------------------------------------ */
export function useCameraRig(getTarget: (t: number) => { pos: THREE.Vector3; look: THREE.Vector3 }, lambda = 2.5) {
  const look = useRef(new THREE.Vector3())
  const clock = useSceneClock()
  useFrame((state, d) => {
    const dt = Math.min(d, 0.05)
    const { pos, look: target } = getTarget(clock.current)
    const cam = state.camera
    cam.position.x = approach(cam.position.x, pos.x, lambda, dt)
    cam.position.y = approach(cam.position.y, pos.y, lambda, dt)
    cam.position.z = approach(cam.position.z, pos.z, lambda, dt)
    look.current.x = approach(look.current.x, target.x, lambda, dt)
    look.current.y = approach(look.current.y, target.y, lambda, dt)
    look.current.z = approach(look.current.z, target.z, lambda, dt)
    cam.lookAt(look.current)
  })
}

/* ------------------------------------------------------------------ */
/* Encaje de la escena en el área libre de la pantalla                  */
/* ------------------------------------------------------------------ */
export interface FitLayout {
  /** ancho/alto de la escena (unidades de mundo) */
  w: number
  h: number
  /** fracción de pantalla ocupada por DOM a cada lado (0..1) */
  left?: number
  right?: number
  top?: number
  bottom?: number
  max?: number
}
const _origin = new THREE.Vector3()

/**
 * Escala el grupo raíz para que la escena quepa en el área libre y desplaza la
 * proyección de la cámara (setViewOffset) para centrarla ahí. Así ningún
 * elemento 3D queda debajo de la diapositiva oficial, tarjetas o controles.
 * En pantallas estrechas (<1100px) el layout es de una columna: sin margen lateral.
 */
export function useStageFit(root: React.RefObject<THREE.Group | null>, getLayout: () => FitLayout, lambda = 3) {
  const off = useRef({ x: 0, y: 0 })
  useFrame((state, d) => {
    const dt = Math.min(d, 0.05)
    const L = getLayout()
    const narrow = state.size.width < 1100
    const left = narrow ? 0.02 : (L.left ?? 0)
    const right = narrow ? 0.02 : (L.right ?? 0.02)
    const top = L.top ?? 0.1
    const bottom = L.bottom ?? 0.12
    const vp = state.viewport.getCurrentViewport(state.camera, _origin)
    const s = Math.min(L.max ?? 1, (vp.width * (1 - left - right)) / L.w, (vp.height * (1 - top - bottom)) / L.h)
    if (root.current) root.current.scale.setScalar(approach(root.current.scale.x, s, lambda, dt))
    off.current.x = approach(off.current.x, (left - right) / 2, lambda, dt)
    off.current.y = approach(off.current.y, (top - bottom) / 2, lambda, dt)
    const { width: W, height: H } = state.size
    ;(state.camera as THREE.PerspectiveCamera).setViewOffset(W, H, -off.current.x * W, -off.current.y * H, W, H)
  })
}
