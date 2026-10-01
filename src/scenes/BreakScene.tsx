import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { pipelineNodes, type FailureId } from '../data/courseContent'
import { Beam, C, Node3D, Particles, Stage3D, TechFloor, approach, getGlowTexture, isMotion, makeAnim, makeBeam, unitBox, unitSphere, useCameraRig, useStageFit } from './common/kit'

/**
 * HAPPY PATH → BREAK THE WORKFLOW → DEFENSIVE AUTOMATION
 * Un paquete recorre el sistema; según el fallo elegido el recorrido cambia.
 */
export type BreakMode = 'happy' | 'broken' | 'defended'

const X = [-6.25, -3.75, -1.25, 1.25, 3.75, 6.25]
const node = (i: number, y = 0) => new THREE.Vector3(X[i], y, 0)
type Style = 'sphere' | 'cube' | 'hollow'
interface WP {
  p: THREE.Vector3
  pause?: number
  style?: Style
  color?: string
  fade?: boolean
}

interface Plan {
  routes: WP[][]
  offsets: number[]
  breakAt: number | null
  guardAt: number | null
  top: { at: number; label: string } | null
  review: number | null
  spinner: number | null
  rows: number
  brokenBeam: number | null
  endPause: number
}

const pathTo = (n: number, style: Style = 'sphere', color: string = C.cyan): WP[] =>
  Array.from({ length: n + 1 }, (_, i) => ({ p: node(i), pause: 0.18, style, color }))

function makePlan(mode: BreakMode, f: FailureId | null): Plan {
  const base: Plan = { routes: [pathTo(5)], offsets: [0], breakAt: null, guardAt: null, top: null, review: null, spinner: null, rows: 0, brokenBeam: null, endPause: 1.1 }
  if (mode === 'happy' || !f) return { ...base, routes: [[...pathTo(5).slice(0, 5), { p: node(5), pause: 0.2, color: C.green }]] }
  const broken = mode === 'broken'
  switch (f) {
    case 'EMPTY_EMAIL':
      return broken
        ? { ...base, routes: [[...pathTo(2, 'hollow', '#8a93a8'), { p: node(3), pause: 0, style: 'hollow', color: C.red }]], breakAt: 3, endPause: 2.6 }
        : { ...base, routes: [[...pathTo(1, 'hollow', '#8a93a8'), { p: node(1, -1.9), pause: 0.2, style: 'hollow', color: C.gold }]], guardAt: 1, review: 1, endPause: 2 }
    case 'DUPLICATE':
      return broken
        ? { ...base, routes: [pathTo(5), pathTo(5)], offsets: [0, 0.45], breakAt: 3, rows: 2, endPause: 1.6 }
        : { ...base, routes: [pathTo(5), [...pathTo(3), { p: node(3, 0.01), fade: true }]], offsets: [0, 0.45], guardAt: 3, rows: 1, endPause: 1.6 }
    case 'API_TIMEOUT':
      return broken
        ? { ...base, routes: [[...pathTo(3), { p: node(4), pause: 0, color: C.red }]], breakAt: 4, spinner: 4, endPause: 3 }
        : { ...base, routes: [[...pathTo(3), { p: node(4), pause: 1.8, color: C.gold }, { p: node(5), pause: 0.2, color: C.green }]], guardAt: 4, spinner: 4, endPause: 1.4 }
    case 'CREDENTIAL_EXPIRED':
      return broken
        ? { ...base, routes: [[...pathTo(2), { p: new THREE.Vector3(0, 0, 0), pause: 0, color: C.red }]], breakAt: 3, brokenBeam: 2, endPause: 2.6 }
        : { ...base, routes: [[...pathTo(2), { p: new THREE.Vector3(0, 0, 0), pause: 0.25, color: C.gold }, { p: node(3, 1.9), pause: 0.2, color: C.gold }]], guardAt: 3, brokenBeam: 2, top: { at: 3, label: 'RESPONSABLE' }, endPause: 2 }
    case 'INVALID_FORMAT':
      return broken
        ? { ...base, routes: [[...pathTo(2, 'cube', C.red).map((w) => ({ ...w, color: C.cyan })), { p: node(1, 0), pause: 0, style: 'cube' as Style, color: C.red }]], breakAt: 2, endPause: 2.4 }
        : { ...base, routes: [[...pathTo(1, 'cube'), { p: node(2), pause: 0.4, style: 'sphere', color: C.cyan }, ...pathTo(5).slice(3)]], guardAt: 2, endPause: 1.2 }
    case 'HUMAN_REQUIRED':
      return broken
        ? { ...base, routes: [[...pathTo(1), { p: node(2), pause: 0, color: C.gold }]], breakAt: 2, endPause: 3 }
        : { ...base, routes: [[...pathTo(2), { p: node(2, 1.9), pause: 1.4, color: C.gold }, { p: node(2), pause: 0.1, color: C.cyan }, ...pathTo(5).slice(3)]], guardAt: 2, top: { at: 2, label: 'HUMANO' }, endPause: 1.2 }
  }
}

const SPEED = 3.4

function sample(route: WP[], t: number, out: THREE.Vector3) {
  // devuelve índice del último waypoint alcanzado
  let acc = 0
  out.copy(route[0].p)
  if (t <= 0) return 0
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i].p
    const b = route[i + 1].p
    const travel = a.distanceTo(b) / SPEED
    if (t < acc + travel) {
      out.lerpVectors(a, b, (t - acc) / travel)
      return i
    }
    acc += travel
    const pause = route[i + 1].pause ?? 0.15
    if (t < acc + pause) {
      out.copy(b)
      return i + 1
    }
    acc += pause
  }
  out.copy(route[route.length - 1].p)
  return route.length - 1
}

function routeDuration(route: WP[]) {
  let acc = 0
  for (let i = 0; i < route.length - 1; i++) acc += route[i].p.distanceTo(route[i + 1].p) / SPEED + (route[i + 1].pause ?? 0.15)
  return acc
}

function PacketMesh({ gRef }: { gRef: React.RefObject<THREE.Group | null> }) {
  const tex = getGlowTexture()
  return (
    <group ref={gRef}>
      <mesh geometry={unitSphere} scale={0.13}>
        <meshBasicMaterial color={C.cyan} toneMapped={false} />
      </mesh>
      <mesh geometry={unitBox} scale={0.24}>
        <meshBasicMaterial color={C.red} toneMapped={false} />
      </mesh>
      <mesh geometry={unitSphere} scale={0.15}>
        <meshBasicMaterial color="#8a93a8" wireframe toneMapped={false} />
      </mesh>
      <sprite scale={1.1}>
        <spriteMaterial map={tex} color={C.cyan} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  )
}

const tmpCol = new THREE.Color()
const colors = {
  cyan: new THREE.Color(C.cyan),
  red: new THREE.Color(C.red),
  gold: new THREE.Color(C.gold),
  green: new THREE.Color(C.green),
  dim: new THREE.Color('#3a4566'),
  violet: new THREE.Color(C.violet),
}

function Pipeline({ mode, failure, runKey }: { mode: BreakMode; failure: FailureId | null; runKey: number }) {
  const plan = useMemo(() => makePlan(mode, failure), [mode, failure])
  const elapsed = useRef(0)
  useEffect(() => {
    elapsed.current = 0
  }, [plan, runKey])

  const nodes = useMemo(() => pipelineNodes.map((_, i) => makeAnim(i === 0 ? C.white : i === 5 ? C.violet : C.cyan, 1, node(i).toArray())), [])
  const beams = useMemo(() => X.slice(0, -1).map(() => makeBeam(C.cyan, 1, 0.5)), [])
  const ends = useMemo(() => X.map((_, i) => node(i)), [])
  const topAnim = useMemo(() => makeAnim(C.gold, 0, [X[2], 1.9, 0]), [])
  const reviewAnim = useMemo(() => makeAnim(C.gold, 0, [X[1], -1.9, 0]), [])
  const topBeam = useMemo(() => makeBeam(C.gold, 0, 0.45), [])
  const reviewBeam = useMemo(() => makeBeam(C.gold, 0, 0.45), [])
  const topFrom = useMemo(() => new THREE.Vector3(), [])
  const topTo = useMemo(() => new THREE.Vector3(), [])
  const revFrom = useMemo(() => new THREE.Vector3(), [])
  const revTo = useMemo(() => new THREE.Vector3(), [])
  const packets = useMemo(() => [{ current: null as THREE.Group | null }, { current: null as THREE.Group | null }], [])
  const guard = useRef<THREE.Mesh>(null)
  const spinner = useRef<THREE.Mesh>(null)
  const rows = useRef<THREE.Group>(null)
  const root = useRef<THREE.Group>(null)
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useCameraRig(() => ({ pos: new THREE.Vector3(0, 2.2, 13.5), look: new THREE.Vector3(0, 0, 0) }), 2)
  // Título arriba, controles abajo y tarjeta de fallo/defensa a la derecha
  useStageFit(root, () => ({ w: 15.4, h: 5.6, top: 0.29, bottom: 0.25, right: mode === 'happy' ? 0.02 : 0.3 }))

  useFrame((state, d) => {
    const dt = Math.min(d, 0.05)
    if (isMotion()) elapsed.current += dt
    const t = elapsed.current
    const tt = state.clock.elapsedTime

    // duración total del ciclo (repite)
    const durs = plan.routes.map((r, i) => routeDuration(r) + plan.offsets[i])
    const cycle = Math.max(...durs) + plan.endPause
    const local = isMotion() ? t % cycle : cycle - plan.endPause * 0.5

    let reached = 0
    packets.forEach((p, i) => {
      if (p.current && i >= plan.routes.length) p.current.visible = false
    })
    plan.routes.forEach((route, i) => {
      const g = packets[i].current
      if (!g) return
      const lt = local - plan.offsets[i]
      g.visible = lt >= 0
      if (lt < 0) return
      const idx = sample(route, lt, tmp)
      // ligeramente por delante de los nodos: el paquete se ve también mientras "procesa"
      g.position.copy(tmp).setZ(tmp.z + 0.55)
      if (i === 0) reached = idx
      const wp = route[idx]
      const style: Style = wp.style ?? 'sphere'
      const col = tmpCol.set(wp.color ?? C.cyan)
      const [sphere, cube, hollow, glow] = g.children as [THREE.Mesh, THREE.Mesh, THREE.Mesh, THREE.Sprite]
      sphere.visible = style === 'sphere'
      cube.visible = style === 'cube'
      hollow.visible = style === 'hollow'
      ;(sphere.material as THREE.MeshBasicMaterial).color.copy(col)
      ;(cube.material as THREE.MeshBasicMaterial).color.copy(col)
      ;(hollow.material as THREE.MeshBasicMaterial).color.copy(col)
      ;(glow.material as THREE.SpriteMaterial).color.copy(col)
      ;(glow.material as THREE.SpriteMaterial).opacity = style === 'hollow' ? 0.35 : 0.85
      if (style === 'cube') cube.rotation.set(tt * 1.5, tt, 0)
      const fade = wp.fade && idx === route.length - 1 ? 0 : 1
      g.scale.setScalar(approach(g.scale.x, Math.max(0.0001, fade), 6, dt))
    })

    // nodos
    const failed = plan.breakAt !== null && reached >= Math.min(plan.breakAt, plan.routes[0].length - 1) && mode === 'broken'
    nodes.forEach((n, i) => {
      const near = packets.some((p) => p.current?.visible && Math.abs(p.current.position.x - X[i]) < 0.5 && Math.abs(p.current.position.y) < 0.4)
      let color = i === 0 ? colors.cyan : i === 5 ? colors.violet : colors.cyan
      let glow = near ? 1 : 0.32
      n.shake = 0
      if (mode === 'broken' && plan.breakAt !== null) {
        if (i === plan.breakAt && failed) {
          color = failure === 'HUMAN_REQUIRED' ? colors.gold : colors.red
          glow = 0.6 + 0.4 * Math.sin(tt * 8)
          n.shake = 1
        } else if (i > plan.breakAt && failed) {
          color = colors.dim
          glow = 0.05
        }
      }
      if (mode === 'defended' && i === 5 && reached >= 1) glow = Math.max(glow, 0.55 + 0.35 * Math.sin(tt * 4))
      if (mode === 'happy' && i === 5 && reached >= 5) color = colors.green
      n.color.copy(color)
      n.glow = glow
    })
    beams.forEach((b, i) => {
      const brokenBeam = plan.brokenBeam === i
      b.color.copy(brokenBeam && mode === 'broken' ? colors.red : brokenBeam ? colors.gold : failed && plan.breakAt !== null && i >= plan.breakAt ? colors.dim : colors.cyan)
      b.grow = brokenBeam && mode === 'broken' ? 0.48 : 1
      b.opacity = brokenBeam && mode === 'broken' ? 0.4 + 0.4 * Math.abs(Math.sin(tt * 10)) : 0.5
    })

    // nodo superior (humano / responsable) y revisión
    if (plan.top) {
      topAnim.pos!.set(X[plan.top.at], 1.9, 0)
      topFrom.set(X[plan.top.at], 0.4, 0)
      topTo.set(X[plan.top.at], 1.6, 0)
    }
    topAnim.show = plan.top ? 1 : 0
    topAnim.glow = 0.5 + 0.4 * Math.sin(tt * 3)
    topBeam.grow = plan.top ? 1 : 0
    if (plan.review !== null) {
      reviewAnim.pos!.set(X[plan.review], -1.9, 0)
      revFrom.set(X[plan.review], -0.4, 0)
      revTo.set(X[plan.review], -1.6, 0)
    }
    reviewAnim.show = plan.review !== null ? 1 : 0
    reviewAnim.glow = 0.6
    reviewBeam.grow = plan.review !== null ? 1 : 0

    // escudo de defensa
    if (guard.current) {
      const on = mode === 'defended' && plan.guardAt !== null
      if (plan.guardAt !== null) guard.current.position.set(X[plan.guardAt], 0, 0)
      const k = approach(guard.current.scale.x, on ? 1 : 0, 5, dt)
      guard.current.scale.setScalar(Math.max(0.0001, k))
      guard.current.visible = k > 0.01
      guard.current.rotation.y = tt * 1.2
    }
    if (spinner.current) {
      const on = plan.spinner !== null
      if (plan.spinner !== null) spinner.current.position.set(X[plan.spinner], 0, 0.1)
      const k = approach(spinner.current.scale.x, on && reached >= (plan.spinner ?? 99) - 0 ? 1 : 0, 6, dt)
      spinner.current.scale.setScalar(Math.max(0.0001, k))
      spinner.current.visible = k > 0.01
      spinner.current.rotation.z -= dt * (mode === 'broken' ? 2 : 5)
      ;(spinner.current.material as THREE.MeshBasicMaterial).color.set(mode === 'broken' ? C.red : C.gold)
    }
    if (rows.current) {
      rows.current.children.forEach((r, i) => {
        const on = i < plan.rows && reached >= 3
        r.scale.x = approach(r.scale.x, on ? 1 : 0.0001, 6, dt)
        r.visible = r.scale.x > 0.01
        ;((r as THREE.Mesh).material as THREE.MeshBasicMaterial).color.set(plan.rows > 1 && mode === 'broken' ? C.red : C.green)
      })
    }
  })

  return (
    <group ref={root}>
      {beams.map((b, i) => (
        <Beam key={i} from={ends[i]} to={ends[i + 1]} anim={b} thickness={0.035} />
      ))}
      {pipelineNodes.map((p, i) => (
        <Node3D key={p.id} anim={nodes[i]} label={p.label} sub={p.sub} labelBelow />
      ))}
      <Beam from={topFrom} to={topTo} anim={topBeam} thickness={0.02} />
      <Node3D anim={topAnim} label={plan.top?.label ?? 'HUMANO'} size={[0.95, 0.6, 0.6]} />
      <Beam from={revFrom} to={revTo} anim={reviewBeam} thickness={0.02} />
      <Node3D anim={reviewAnim} label="REVISIÓN" labelBelow size={[0.95, 0.6, 0.6]} />

      <mesh ref={guard} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.82, 0.018, 8, 64]} />
        <meshBasicMaterial color={C.cyan} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <mesh ref={spinner}>
        <torusGeometry args={[0.72, 0.025, 6, 48, Math.PI * 1.3]} />
        <meshBasicMaterial color={C.red} toneMapped={false} />
      </mesh>
      <group ref={rows} position={[X[3], 0.62, 0]}>
        <mesh position={[0, 0, 0]} scale={[1, 1, 1]}>
          <boxGeometry args={[0.9, 0.06, 0.4]} />
          <meshBasicMaterial color={C.green} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.14, 0]} scale={[1, 1, 1]}>
          <boxGeometry args={[0.9, 0.06, 0.4]} />
          <meshBasicMaterial color={C.red} toneMapped={false} />
        </mesh>
      </group>

      <PacketMesh gRef={packets[0]} />
      <PacketMesh gRef={packets[1]} />
      <TechFloor y={-3.8} opacity={0.55} />
      <Particles count={70} opacity={0.25} />
    </group>
  )
}

export default function BreakScene({ visible, mode, failure, runKey }: { visible: boolean; mode: BreakMode; failure: FailureId | null; runKey: number }) {
  return (
    <Stage3D visible={visible} camera={{ position: [0, 2.2, 13.5], fov: 40 }}>
      <fog attach="fog" args={[C.bg, 16, 30]} />
      <Pipeline mode={mode} failure={failure} runKey={runKey} />
    </Stage3D>
  )
}
