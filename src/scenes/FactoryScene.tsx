import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { limites } from '../data/courseContent'
import { Beam, C, FloatTag, Label, Node3D, Packet, Particles, PulseRing, Stage3D, TechFloor, approach, isMotion, makeAnim, makeBeam, makePulse, makeTag, range, useCameraRig, useSceneClock, useStageFit } from './common/kit'

/** Evento para sincronizar el DOM (chips y contador) con lo que pasa en 3D. */
export interface FactoryEvent {
  kind: 'ok' | 'lost' | 'routed'
  /** índice en limites.problems */
  problem?: number
}
/** Problemas que van a HUMANO (el resto va a EXCEPCIÓN). */
const TO_HUMAN = new Set(['human', 'branch'])

/**
 * Fábrica 3D: INPUT → PROCESS → OUTPUT.
 * Stage (0..5):
 *  0 lineal perfecto · 1 problemas (paquetes rojos caen) · 2 ramificación (humano / excepción)
 *  3 excepciones con destino (validar, retry, log) · 4 resiliencia · 5 pregunta (cámara atrás)
 */
const P_IN = new THREE.Vector3(-4.5, 0, 0)
const P_PROC = new THREE.Vector3(0, 0, 0)
const P_OUT = new THREE.Vector3(4.5, 0, 0)
const P_HUM = new THREE.Vector3(3.9, 2.4, -0.2)
const P_EXC = new THREE.Vector3(3.9, -2.4, 0.2)
const P_VAL = new THREE.Vector3(-2.25, 0, 0)
const P_LOG = new THREE.Vector3(0.2, -3.1, 0)
const P_FALL = new THREE.Vector3(0.9, -3.2, 0.6)
const C_HUM = new THREE.Vector3(1.8, 2.4, 0)
const C_EXC = new THREE.Vector3(1.8, -2.4, 0)

const N_PACKETS = 12
const curveHum = new THREE.QuadraticBezierCurve3(P_PROC, C_HUM, P_HUM)
const curveExc = new THREE.QuadraticBezierCurve3(P_PROC, C_EXC, P_EXC)
const tmp = new THREE.Vector3()
const colCyan = new THREE.Color(C.cyan)
const colRed = new THREE.Color(C.red)
const colGold = new THREE.Color(C.gold)
const colGreen = new THREE.Color(C.green)

function Factory({ progress, beats, onEvent }: { progress: { current: number }; beats: number; onEvent?: (e: FactoryEvent) => void }) {
  const clock = useSceneClock()
  const root = useRef<THREE.Group>(null)
  const ring = useRef<THREE.Mesh>(null)
  const ringGroup = useRef<THREE.Group>(null)
  const stageOf = () => progress.current * (beats - 1)

  const n = useMemo(
    () => ({
      input: makeAnim(C.white, 1, P_IN.toArray()),
      proc: makeAnim(C.cyan, 1, P_PROC.toArray()),
      out: makeAnim(C.green, 1, P_OUT.toArray()),
      hum: makeAnim(C.gold, 0, P_HUM.toArray()),
      exc: makeAnim(C.red, 0, P_EXC.toArray()),
      val: makeAnim(C.cyan, 0, P_VAL.toArray()),
      log: makeAnim(C.violet, 0, P_LOG.toArray()),
    }),
    [],
  )
  const b = useMemo(
    () => ({
      a: makeBeam(C.cyan, 1, 0.55),
      c: makeBeam(C.cyan, 1, 0.55),
      h1: makeBeam(C.gold, 0, 0.5),
      e1: makeBeam(C.red, 0, 0.5),
      l1: makeBeam(C.violet, 0, 0.35),
      l2: makeBeam(C.violet, 0, 0.35),
    }),
    [],
  )
  const packets = useMemo(() => Array.from({ length: N_PACKETS }, () => ({ current: null as THREE.Group | null })), [])
  const pstate = useRef(Array.from({ length: N_PACKETS }, (_, i) => ({ u: i / N_PACKETS, problem: i % 3 === 1, type: Math.floor(i / 3) % limites.problems.length, fired: false })))
  const nextType = useRef(4)
  // Rótulos de lectura
  const tags = useMemo(
    () => ({
      problem: limites.problems.map(() => makeTag(C.red, 0, true)),
      lost: makeTag(C.red),
      ok: makeTag(C.green),
      toHum: makeTag(C.gold),
      toExc: makeTag(C.red),
      log: makeTag(C.violet),
    }),
    [],
  )
  const tagUntil = useRef(0)
  const pulses = useMemo(() => ({ hum: makePulse(), exc: makePulse(), val: makePulse(), log: makePulse() }), [])
  const prev = useRef({ branching: false, exceptions: false })

  useCameraRig(() => {
    const s = stageOf()
    const q = range(s, 4.2, 5)
    return {
      pos: new THREE.Vector3(1.2 - s * 0.45, 1.4 + s * 0.25 + q * 0.6, 11.5 + q * 2),
      look: new THREE.Vector3(0, -0.2, 0),
    }
  }, 2)

  // Texto + diapositiva oficial a la izquierda, chips de problemas abajo; en la pregunta, centrado
  useStageFit(root, () => {
    const q = range(stageOf(), 4.2, 5)
    return { w: 11.4, h: 7, left: 0.36 * (1 - q), top: 0.17, bottom: 0.22 * (1 - q) + 0.08 }
  })

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05)
    const t = clock.current
    const s = stageOf()
    const motion = isMotion()
    const problems = s > 0.6
    const branching = s > 1.6
    const exceptions = s > 2.6
    const resilient = s > 3.5

    // Pulsos cuando aparece algo nuevo
    if (branching && !prev.current.branching) {
      pulses.hum.n++
      pulses.exc.n++
    }
    if (exceptions && !prev.current.exceptions) {
      pulses.val.n++
      pulses.log.n++
    }
    prev.current = { branching, exceptions }

    // Rótulos fijos según la etapa
    tags.lost.on = problems && !branching ? 1 : 0
    tags.ok.on = !problems || resilient ? 1 : 0
    tags.toHum.on = branching ? 1 : 0
    tags.toExc.on = branching ? 1 : 0
    tags.toExc.color.copy(resilient ? colGold : colRed)
    tags.log.on = exceptions ? 1 : 0
    // El rótulo del problema se apaga solo después de un momento
    if (t > tagUntil.current) tags.problem.forEach((tg) => (tg.on = 0))

    // Nodos
    n.proc.color.copy(problems && !branching ? colRed : resilient ? colGreen : colCyan)
    n.proc.glow = problems && !branching ? 0.6 + 0.4 * Math.sin(t * 9) : 0.55
    n.proc.shake = problems && !branching ? 1 : 0
    n.out.glow = problems && !branching ? 0.15 : 0.6
    n.input.glow = 0.4
    n.hum.show = branching ? 1 : 0
    n.exc.show = branching ? 1 : 0
    n.exc.color.copy(resilient ? colGold : colRed)
    n.hum.glow = 0.5
    n.exc.glow = 0.5
    n.val.show = exceptions ? 1 : 0
    n.log.show = exceptions ? 1 : 0
    n.val.glow = 0.4
    n.log.glow = 0.35 + 0.3 * Math.sin(t * 3)
    b.h1.grow = branching ? 1 : 0
    b.e1.grow = branching ? 1 : 0
    b.l1.grow = exceptions ? 1 : 0
    b.l2.grow = exceptions ? 1 : 0
    b.c.color.copy(problems && !branching ? colRed : colCyan)
    b.c.opacity = problems && !branching ? 0.25 : 0.55

    if (ringGroup.current && ring.current) {
      const target = exceptions ? 1 : 0
      const sc = approach(ringGroup.current.scale.x, target, 5, dt)
      ringGroup.current.scale.setScalar(Math.max(0.0001, sc))
      ringGroup.current.visible = sc > 0.01
      if (motion) ring.current.rotation.z -= dt * 1.4
    }

    // Paquetes
    const speed = problems && !branching ? 0.2 : 0.14
    pstate.current.forEach((p, i) => {
      const g = packets[i].current
      if (!g) return
      if (motion) p.u += dt * speed
      if (p.u >= 1) {
        p.u -= 1
        // al completar el recorrido: los que llegaron a OUTPUT cuentan como "ok"
        if (!p.problem || !problems) onEvent?.({ kind: 'ok' })
        p.fired = false
        if (p.problem) p.type = nextType.current++ % limites.problems.length
      }
      const u = p.u
      // El paquete con problema llega a PROCESS: se nombra el problema
      if (p.problem && problems && u >= 0.5 && !p.fired) {
        p.fired = true
        const routed = branching
        tags.problem.forEach((tg, j) => {
          tg.on = j === p.type ? 1 : 0
          tg.color.copy(routed ? colGold : colRed)
        })
        tagUntil.current = t + 1.8
        onEvent?.({ kind: routed ? 'routed' : 'lost', problem: p.type })
      }
      let color = colCyan
      let scale = 1
      if (u < 0.5) {
        g.position.lerpVectors(P_IN, P_PROC, u / 0.5)
      } else {
        const k = (u - 0.5) / 0.5
        if (!p.problem || !problems) {
          g.position.lerpVectors(P_PROC, P_OUT, k)
        } else if (!branching) {
          // Sin ramas: el paquete problemático se cae del flujo
          g.position.lerpVectors(P_PROC, P_FALL, Math.min(1, k * 1.4))
          color = colRed
          scale = 1 - range(k, 0.55, 0.75)
        } else {
          const toHuman = TO_HUMAN.has(limites.problems[p.type].id)
          const curve = toHuman ? curveHum : curveExc
          curve.getPoint(k, tmp)
          g.position.copy(tmp)
          color = resilient || toHuman ? colGold : colRed
          scale = 1 - range(k, 0.92, 1)
        }
      }
      g.scale.setScalar(Math.max(0.0001, scale))
      g.visible = scale > 0.02
      const mesh = g.children[0] as THREE.Mesh
      const spr = g.children[1] as THREE.Sprite
      ;(mesh.material as THREE.MeshBasicMaterial).color.copy(color)
      ;(spr.material as THREE.SpriteMaterial).color.copy(color)
    })
  })

  return (
    <group ref={root}>
      <Beam from={P_IN} to={P_PROC} anim={b.a} thickness={0.035} />
      <Beam from={P_PROC} to={P_OUT} anim={b.c} thickness={0.035} />
      <Beam from={P_PROC} to={P_HUM} anim={b.h1} thickness={0.025} />
      <Beam from={P_PROC} to={P_EXC} anim={b.e1} thickness={0.025} />
      <Beam from={P_EXC} to={P_LOG} anim={b.l1} thickness={0.016} />
      <Beam from={P_PROC} to={P_LOG} anim={b.l2} thickness={0.016} />

      <Node3D anim={n.input} label="INPUT" labelBelow size={[1.1, 0.8, 0.8]} />
      <Node3D anim={n.proc} label="PROCESS" labelBelow size={[1.4, 1, 1]} />
      <Node3D anim={n.out} label="OUTPUT" labelBelow size={[1.1, 0.8, 0.8]} />
      <Node3D anim={n.hum} label="HUMANO" size={[0.9, 0.6, 0.6]} />
      <Node3D anim={n.exc} label="EXCEPCIÓN" labelBelow size={[0.9, 0.6, 0.6]} />
      <Node3D anim={n.val} label="VALIDAR" size={[0.5, 0.5, 0.5]} />
      <Node3D anim={n.log} label="LOG" labelBelow size={[0.6, 0.4, 0.4]} />

      {/* Anillo de reintento sobre PROCESS */}
      <group ref={ringGroup}>
        <mesh ref={ring}>
          <torusGeometry args={[1.05, 0.012, 6, 64, Math.PI * 1.6]} />
          <meshBasicMaterial color={C.gold} transparent opacity={0.8} toneMapped={false} />
        </mesh>
        <Label position={[0, 1.32, 0]} size={0.14} color={C.gold}>
          RETRY
        </Label>
      </group>

      {packets.map((r, i) => (
        <Packet key={i} packetRef={r} size={0.1} />
      ))}

      {/* Capas de lectura */}
      {limites.problems.map((pr, j) => (
        <FloatTag key={pr.id} ctl={tags.problem[j]} text={pr.label.toUpperCase()} icon="dot" position={[0.25, 2.0, 0.4]} size={0.17} />
      ))}
      <FloatTag ctl={tags.lost} text="se pierden" icon="x" position={[1.9, -2.7, 0.6]} />
      <FloatTag ctl={tags.ok} text="llegan bien" icon="check" position={[P_OUT.x, 1.05, 0.4]} />
      <FloatTag ctl={tags.toHum} text="necesita a una persona" icon="arrow" position={[2.15, 1.45, 0.3]} />
      <FloatTag ctl={tags.toExc} text="dato inválido o error" icon="arrow" position={[1.55, -1.75, 0.3]} />
      <FloatTag ctl={tags.log} text="registra todo" icon="dot" position={[1.75, -3.1, 0.3]} />
      <PulseRing ctl={pulses.hum} color={C.gold} position={P_HUM.toArray()} />
      <PulseRing ctl={pulses.exc} color={C.red} position={P_EXC.toArray()} />
      <PulseRing ctl={pulses.val} color={C.cyan} position={P_VAL.toArray()} radius={0.45} />
      <PulseRing ctl={pulses.log} color={C.violet} position={P_LOG.toArray()} radius={0.45} />
      <TechFloor y={-4} opacity={0.6} />
      <Particles count={90} opacity={0.3} />
    </group>
  )
}

export default function FactoryScene({ visible, progress, beats, onEvent }: { visible: boolean; progress: { current: number }; beats: number; onEvent?: (e: FactoryEvent) => void }) {
  return (
    <Stage3D visible={visible} camera={{ position: [1.2, 1.4, 11.5], fov: 40 }}>
      <fog attach="fog" args={[C.bg, 14, 28]} />
      <Factory progress={progress} beats={beats} onEvent={onEvent} />
    </Stage3D>
  )
}
