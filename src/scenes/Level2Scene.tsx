import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { nivel2 } from '../data/courseContent'
import { Beam, C, Node3D, Packet, Particles, Stage3D, TechFloor, approach, isMotion, makeAnim, makeBeam, range, useCameraRig, useSceneClock, useStageFit } from './common/kit'

/**
 * Nivel 1 → Nivel 2.
 * Stage 0: A → B → C (cinta) · 1: aparece condición · 2: árbol (B, C→D/E, HUMAN)
 * 3: la cámara retrocede y revela el ecosistema · 4: mensaje
 */
type V3 = [number, number, number]
const LINE: Record<string, V3> = { A: [-4, 0, 0], B: [0, 0, 0], C: [4, 0, 0], D: [4, 0, 0], E: [4, 0, 0], H: [0, 0, 0], IF: [-2, 0, 0] }
const TREE: Record<string, V3> = { A: [-5, 0, 0], IF: [-2.8, 0, 0], B: [0, 2.3, 0], C: [0, 0, 0], H: [0, -2.3, 0], D: [3.6, 1, 0], E: [3.6, -1, 0] }

const SAT_RADIUS: [number, number] = [7.2, 3.9]

function Level2({ progress, beats }: { progress: { current: number }; beats: number }) {
  const clock = useSceneClock()
  const root = useRef<THREE.Group>(null)
  const loop = useRef<THREE.Mesh>(null)
  const stageOf = () => progress.current * (beats - 1)

  const nodes = useMemo(
    () => ({
      A: makeAnim(C.white, 1, LINE.A),
      IF: makeAnim(C.gold, 0, LINE.IF),
      B: makeAnim(C.cyan, 1, LINE.B),
      C: makeAnim(C.cyan, 1, LINE.C),
      D: makeAnim(C.cyan, 0, LINE.D),
      E: makeAnim(C.cyan, 0, LINE.E),
      H: makeAnim(C.gold, 0, LINE.H),
    }),
    [],
  )
  const pos = useMemo(() => Object.fromEntries(Object.entries(nodes).map(([k, v]) => [k, v.pos!])) as Record<string, THREE.Vector3>, [nodes])
  // posiciones "vivas" (siguen al grupo del nodo) para que los haces acompañen el movimiento
  const live = useMemo(() => Object.fromEntries(Object.keys(nodes).map((k) => [k, new THREE.Vector3()])) as Record<string, THREE.Vector3>, [nodes])
  const groups = useRef<Record<string, THREE.Group | null>>({})

  const beams = useMemo(
    () => ({
      AB: makeBeam(C.cyan, 1, 0.5),
      BC: makeBeam(C.cyan, 1, 0.5),
      AIF: makeBeam(C.gold, 0, 0.5),
      IFB: makeBeam(C.cyan, 0, 0.5),
      IFC: makeBeam(C.cyan, 0, 0.5),
      IFH: makeBeam(C.gold, 0, 0.5),
      CD: makeBeam(C.cyan, 0, 0.5),
      CE: makeBeam(C.cyan, 0, 0.5),
    }),
    [],
  )

  const sats = useMemo(
    () =>
      nivel2.satellites.map((label, i) => {
        const a = (i / nivel2.satellites.length) * Math.PI * 2 + Math.PI / 8
        const p: V3 = [Math.cos(a) * SAT_RADIUS[0], Math.sin(a) * SAT_RADIUS[1], -1.2 + Math.sin(a * 2) * 0.6]
        return { label, anim: makeAnim(label === 'HUMAN APPROVAL' ? C.gold : label === 'EXCEPCIONES' ? C.red : C.violet, 0, p), beam: makeBeam(C.violet, 0, 0.18), v: new THREE.Vector3(...p) }
      }),
    [],
  )
  const center = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  const packetRefs = useMemo(() => Array.from({ length: 6 }, () => ({ current: null as THREE.Group | null })), [])
  const pst = useRef(Array.from({ length: 6 }, (_, i) => ({ u: i / 6, route: i % 3 })))

  useCameraRig(() => {
    const s = stageOf()
    const back = range(s, 2.4, 3.2)
    const msg = range(s, 3.5, 4)
    return {
      pos: new THREE.Vector3(1.5 - back * 1.5, 0.8 + back * 2.2, 10 + back * 7 + msg * 1.5),
      look: new THREE.Vector3(0, 0, 0),
    }
  }, 1.8)

  useStageFit(root, () => {
    const s = stageOf()
    const eco = range(s, 2.4, 3.2)
    const msg = range(s, 3.5, 4)
    return { w: 11.2 + eco * 5.6, h: 6.4 + eco * 3.2, left: 0.36 * (1 - msg), top: 0.17, bottom: 0.08 }
  })

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05)
    const t = clock.current
    const s = stageOf()
    const motion = isMotion()
    const cond = s > 0.6
    const tree = s > 1.5
    const eco = s > 2.5

    const target = tree ? TREE : LINE
    for (const k of Object.keys(nodes)) {
      const p = target[k]
      pos[k].set(p[0], p[1], p[2])
    }
    if (cond && !tree) pos.A.set(-5, 0, 0)
    nodes.IF.show = cond ? 1 : 0
    nodes.D.show = tree ? 1 : 0
    nodes.E.show = tree ? 1 : 0
    nodes.H.show = tree ? 1 : 0
    for (const k of Object.keys(nodes)) nodes[k as keyof typeof nodes].glow = 0.45 + 0.15 * Math.sin(t * 2 + k.charCodeAt(0))

    beams.AB.grow = cond ? 0 : 1
    beams.BC.grow = tree ? 0 : 1
    beams.AIF.grow = cond ? 1 : 0
    beams.IFB.grow = cond ? 1 : 0
    beams.IFC.grow = tree ? 1 : 0
    beams.IFH.grow = tree ? 1 : 0
    beams.CD.grow = tree ? 1 : 0
    beams.CE.grow = tree ? 1 : 0

    sats.forEach((sat, i) => {
      sat.anim.show = eco ? 1 : 0
      sat.anim.glow = 0.35 + 0.25 * Math.sin(t * 1.5 + i)
      sat.beam.grow = eco ? 1 : 0
    })

    // copiar posiciones vivas desde los grupos de nodos
    for (const k of Object.keys(nodes)) {
      const g = groups.current[k]
      if (g) live[k].copy(g.position)
    }

    if (loop.current) {
      const k = approach(loop.current.scale.x, eco ? 1 : 0, 4, dt)
      loop.current.scale.setScalar(Math.max(0.0001, k))
      loop.current.visible = k > 0.01
      loop.current.position.copy(live.C)
      if (motion) loop.current.rotation.z += dt * 1.6
    }

    // paquetes: en lineal A→B→C; en árbol se reparten por las ramas
    pst.current.forEach((p, i) => {
      const g = packetRefs[i].current
      if (!g) return
      if (motion) p.u = (p.u + dt * 0.22) % 1
      const u = p.u
      let a: THREE.Vector3, b: THREE.Vector3, k: number
      if (!cond) {
        if (u < 0.5) [a, b, k] = [live.A, live.B, u / 0.5]
        else [a, b, k] = [live.B, live.C, (u - 0.5) / 0.5]
      } else if (!tree) {
        if (u < 0.5) [a, b, k] = [live.A, live.IF, u / 0.5]
        else [a, b, k] = [live.IF, live.B, (u - 0.5) / 0.5]
      } else {
        const r = p.route
        if (u < 0.33) [a, b, k] = [live.A, live.IF, u / 0.33]
        else if (u < 0.66) [a, b, k] = [live.IF, r === 0 ? live.B : r === 1 ? live.C : live.H, (u - 0.33) / 0.33]
        else if (r === 1) [a, b, k] = [live.C, i % 2 ? live.D : live.E, (u - 0.66) / 0.34]
        else [a, b, k] = r === 0 ? [live.B, live.B, 1] : [live.H, live.H, 1]
      }
      g.position.lerpVectors(a, b, k)
      g.visible = !(tree && u > 0.66 && p.route !== 1)
    })
  })

  const bind = (k: string) => (g: THREE.Group | null) => {
    groups.current[k] = g
  }

  return (
    <group ref={root}>
      <Beam from={live.A} to={live.B} anim={beams.AB} thickness={0.04} />
      <Beam from={live.B} to={live.C} anim={beams.BC} thickness={0.04} />
      <Beam from={live.A} to={live.IF} anim={beams.AIF} />
      <Beam from={live.IF} to={live.B} anim={beams.IFB} />
      <Beam from={live.IF} to={live.C} anim={beams.IFC} />
      <Beam from={live.IF} to={live.H} anim={beams.IFH} />
      <Beam from={live.C} to={live.D} anim={beams.CD} />
      <Beam from={live.C} to={live.E} anim={beams.CE} />

      <NodeG bindRef={bind('A')} anim={nodes.A} label="A" />
      <NodeG bindRef={bind('IF')} anim={nodes.IF} label="IF" diamond />
      <NodeG bindRef={bind('B')} anim={nodes.B} label="B" />
      <NodeG bindRef={bind('C')} anim={nodes.C} label="C" />
      <NodeG bindRef={bind('D')} anim={nodes.D} label="D" />
      <NodeG bindRef={bind('E')} anim={nodes.E} label="E" />
      <NodeG bindRef={bind('H')} anim={nodes.H} label="HUMAN" />

      <mesh ref={loop}>
        <torusGeometry args={[0.95, 0.014, 6, 48, Math.PI * 1.5]} />
        <meshBasicMaterial color={C.violet} transparent opacity={0.85} toneMapped={false} />
      </mesh>

      {sats.map((sat) => (
        <group key={sat.label}>
          <Beam from={center} to={sat.v} anim={sat.beam} thickness={0.01} />
          <Node3D anim={sat.anim} label={sat.label} size={[0.5, 0.5, 0.5]} />
        </group>
      ))}

      {packetRefs.map((r, i) => (
        <Packet key={i} packetRef={r} size={0.09} />
      ))}
      <TechFloor y={-3.6} opacity={0.5} />
      <Particles count={80} opacity={0.3} />
    </group>
  )
}

/** Nodo con acceso a su grupo (para seguir su posición animada). */
function NodeG({ anim, label, bindRef, diamond }: { anim: ReturnType<typeof makeAnim>; label: string; bindRef: (g: THREE.Group | null) => void; diamond?: boolean }) {
  const holder = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = holder.current?.children[0] as THREE.Group | undefined
    if (g) bindRef(g)
  })
  return (
    <group ref={holder}>
      <Node3D anim={anim} label={label} labelBelow={label === 'HUMAN'} diamond={diamond} size={diamond ? [0.55, 0.55, 0.55] : [0.9, 0.62, 0.62]} />
    </group>
  )
}

export default function Level2Scene({ visible, progress, beats }: { visible: boolean; progress: { current: number }; beats: number }) {
  return (
    <Stage3D visible={visible} camera={{ position: [1.5, 0.8, 10], fov: 40 }}>
      <fog attach="fog" args={[C.bg, 16, 34]} />
      <Level2 progress={progress} beats={beats} />
    </Stage3D>
  )
}
