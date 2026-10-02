import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Beam, C, Node3D, Packet, Particles, Stage3D, isMotion, makeAnim, makeBeam, range, useCameraRig, useSceneClock, type NodeAnim } from './common/kit'

/**
 * Red de nodos que se enciende y forma una arquitectura.
 * - variant "boot": secuencia de encendido (tiempo) + beat de recap
 * - variant "closing": red completa → pulsos → se apaga el flujo → aparecen nodos de decisión (teaser)
 */
const POS: [number, number, number][] = [
  [-6, 0, 0],
  [-3.6, 1.4, -0.6],
  [-3.6, -1.3, 0.5],
  [-1.2, 2.3, 0.2],
  [-1.2, 0.1, -0.8],
  [-1.2, -2.1, 0.4],
  [1.2, 1.5, -0.4],
  [1.2, -0.7, 0.6],
  [1.2, -2.6, -0.5],
  [3.6, 0.9, 0.3],
  [3.6, -1.6, -0.3],
  [6, 0, 0],
]
const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 8], [6, 9], [7, 9], [7, 10], [8, 10], [9, 11], [10, 11],
]
const DECISION: [number, number, number][] = [
  [8.6, 2.0, -0.4],
  [8.9, 0, 0.4],
  [8.6, -2.0, -0.2],
]
const PACKETS = 7

/** Capa (columna) de cada nodo: 0 (inicio) … 5 (final). */
const layerOf = (i: number) => Math.round((POS[i][0] + 6) / 2.4)

function layerDelay(i: number) {
  return 0.6 + ((POS[i][0] + 6) / 12) * 3.2 + (i % 2) * 0.12
}

function randomPath(): number[] {
  const path = [0]
  let cur = 0
  while (cur !== 11) {
    const outs = EDGES.filter((e) => e[0] === cur)
    cur = outs[(Math.random() * outs.length) | 0][1]
    path.push(cur)
  }
  return path
}

function Network({ variant, progress, beats }: { variant: 'boot' | 'closing'; progress: { current: number }; beats: number }) {
  const vecs = useMemo(() => POS.map((p) => new THREE.Vector3(...p)), [])
  const dvecs = useMemo(() => DECISION.map((p) => new THREE.Vector3(...p)), [])
  const nodes = useMemo<NodeAnim[]>(
    () => POS.map((p, i) => makeAnim(i === 0 ? C.gold : i === 11 ? C.white : C.cyan, variant === 'closing' ? 1 : 0, p)),
    [variant],
  )
  const beams = useMemo(() => EDGES.map(() => makeBeam(C.cyan, variant === 'closing' ? 1 : 0, 0.45)), [variant])
  const dNodes = useMemo(() => DECISION.map((p) => makeAnim(C.gold, 0, p)), [])
  const dBeams = useMemo(() => DECISION.map(() => makeBeam(C.gold, 0, 0.6)), [])
  const packetRefs = useMemo(() => Array.from({ length: PACKETS }, () => ({ current: null as THREE.Group | null })), [])
  const packetState = useRef(Array.from({ length: PACKETS }, (_, i) => ({ path: randomPath(), seg: 0, u: -i * 0.6, speed: 1.4 + Math.random() * 0.6 })))
  const clock = useSceneClock()
  const root = useRef<THREE.Group>(null)

  const stage = () => progress.current * (beats - 1)
  const verbT = useRef(0)
  const verbStart = useRef<number | null>(null)

  useCameraRig((t) => {
    const s = stage()
    if (variant === 'boot') {
      const intro = range(t, 0, 5)
      const z = 8 + intro * 6 + s * 1.5
      return {
        pos: new THREE.Vector3(Math.sin(t * 0.12) * 1.2 + s * 2.4, 0.6 + s * 1.2, z),
        look: new THREE.Vector3(s * 1.6, 0, 0),
      }
    }
    const back = range(s, 2.5, 4)
    return {
      pos: new THREE.Vector3(Math.sin(t * 0.1) * 2 + 1.2 * range(s, 2.4, 3.2), 0.8, 15 + back * 3),
      look: new THREE.Vector3(1.2 * range(s, 2.4, 3.2), 0, 0),
    }
  }, 1.6)

  useFrame((_, d) => {
    const t = clock.current
    const s = stage()
    const motion = isMotion()

    // reloj real (no el de la escena) para ir al mismo ritmo que el texto CSS aunque bajen los fps
    const inVerbs = variant === 'closing' && Math.round(s) === 1
    if (inVerbs && verbStart.current === null) verbStart.current = performance.now()
    if (!inVerbs) verbStart.current = null
    verbT.current = !inVerbs ? 0 : motion ? (performance.now() - (verbStart.current ?? 0)) / 1000 : 99

    // Encendido de nodos y haces
    nodes.forEach((n, i) => {
      if (variant === 'boot') {
        const on = motion ? (t > layerDelay(i) ? 1 : 0) : 1
        n.show = on
        n.glow = on ? 0.35 + 0.25 * Math.sin(t * 2 + i) * 0.5 : 0
        if (s > 0.5) n.glow *= 0.6
      } else {
        n.show = 1
        // beat 1: pulsos secuenciales (verbos); beat 2: el flujo se apaga
        // beat 1: cada verbo enciende su tramo de la red, en el mismo ritmo que el texto
        const verbs = Math.max(0, Math.min(5, Math.floor((verbT.current - 0.2) / 0.6) + 1))
        const lit = layerOf(i) <= verbs
        const newest = layerOf(i) === verbs || (verbs === 1 && layerOf(i) === 0)
        n.glow = Math.round(s) === 1 ? (lit ? (newest ? 1 : 0.6) : 0.04) : s < 1.6 ? 0.45 : 0.12
        n.color.set(Math.round(s) === 1 && lit && newest ? C.gold : i === 11 && s > 2.4 ? C.gold : i === 0 ? C.gold : i === 11 ? C.white : C.cyan)
      }
    })
    EDGES.forEach(([a], i) => {
      const b = beams[i]
      if (variant === 'boot') {
        b.grow = motion ? (t > layerDelay(a) + 0.25 ? 1 : 0) : 1
        b.opacity = s > 0.5 ? 0.25 : 0.45
      } else {
        b.grow = 1
        const verbs = Math.max(0, Math.min(5, Math.floor((verbT.current - 0.2) / 0.6) + 1))
        const bothLit = layerOf(EDGES[i][0]) <= verbs && layerOf(EDGES[i][1]) <= verbs
        b.opacity = Math.round(s) === 1 ? (bothLit ? 0.75 : 0.06) : s > 1.6 ? 0.14 : 0.42
      }
    })

    // Nodos de decisión (teaser)
    const dk = variant === 'closing' ? range(s, 2.4, 3.1) : 0
    dNodes.forEach((n, i) => {
      n.show = dk > i * 0.25 ? 1 : 0
      n.glow = 0.5 + 0.4 * Math.sin(t * 2 + i)
    })
    dBeams.forEach((b, i) => {
      b.grow = dk > i * 0.25 ? 1 : 0
    })

    // Paquetes
    const flowOn = variant === 'boot' ? (motion ? t > 3.6 : true) : s < 1.7 || s > 3.4
    const dt = Math.min(d, 0.05)
    packetState.current.forEach((p, i) => {
      const g = packetRefs[i].current
      if (!g) return
      if (!flowOn) {
        g.visible = false
        return
      }
      if (motion) p.u += dt * p.speed
      if (p.u < 0) {
        g.visible = false
        return
      }
      if (p.u >= 1) {
        p.u = 0
        p.seg++
        if (p.seg >= p.path.length - 1) {
          p.path = randomPath()
          p.seg = 0
        }
      }
      const a = vecs[p.path[p.seg]]
      const b = vecs[p.path[p.seg + 1]]
      g.visible = true
      g.position.lerpVectors(a, b, p.u)
    })

    if (root.current && motion) root.current.rotation.y = Math.sin(t * 0.08) * 0.08
  })

  return (
    <group ref={root}>
      {EDGES.map(([a, b], i) => (
        <Beam key={i} from={vecs[a]} to={vecs[b]} anim={beams[i]} thickness={0.022} />
      ))}
      {nodes.map((n, i) => (
        <Node3D key={i} anim={n} size={i === 0 || i === 11 ? [0.62, 0.62, 0.62] : [0.4, 0.4, 0.4]} />
      ))}
      {variant === 'closing' &&
        DECISION.map((_, i) => (
          <group key={i}>
            <Beam from={vecs[11]} to={dvecs[i]} anim={dBeams[i]} thickness={0.026} />
            <Node3D anim={dNodes[i]} size={[0.46, 0.46, 0.46]} />
          </group>
        ))}
      {packetRefs.map((r, i) => (
        <Packet key={i} packetRef={r} color={i % 3 === 0 ? C.gold : C.cyan} size={0.075} />
      ))}
      <Particles count={120} spread={[30, 16, 12]} opacity={0.35} />
    </group>
  )
}

export default function NetworkScene({ visible, variant, progress, beats }: { visible: boolean; variant: 'boot' | 'closing'; progress: { current: number }; beats: number }) {
  return (
    <Stage3D visible={visible} camera={{ position: [0, 0.6, 8], fov: 42 }}>
      <fog attach="fog" args={[C.bg, 12, 30]} />
      <Network variant={variant} progress={progress} beats={beats} />
    </Stage3D>
  )
}
