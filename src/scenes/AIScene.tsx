import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Beam, C, Label, Node3D, Particles, Stage3D, approach, getGlowTexture, isMotion, makeAnim, makeBeam, range, unitBox, useCameraRig, useSceneClock, useStageFit, FloatTag, makeTag, stepTimer } from './common/kit'
import { see } from '../data/courseContent'

/**
 * Bifurcación DETERMINISTIC (rejilla de cubos, rutas rectas) vs INTERPRETATIVE
 * (núcleo orgánico, rutas curvas). `shot` envía un paquete al lado elegido.
 */
const SPLIT = new THREE.Vector3(0, 1.0, 0)
const IN = new THREE.Vector3(0, 2.9, -1)
const LEFT = new THREE.Vector3(-4.6, -0.3, 0)
const RIGHT = new THREE.Vector3(4.6, -0.3, 0)
const CORNER = new THREE.Vector3(-4.6, 1.0, 0)

const leftPath = new THREE.CurvePath<THREE.Vector3>()
leftPath.add(new THREE.LineCurve3(SPLIT, CORNER))
leftPath.add(new THREE.LineCurve3(CORNER, LEFT))
const rightPath = new THREE.CubicBezierCurve3(SPLIT, new THREE.Vector3(2.4, 2.5, 1.2), new THREE.Vector3(5.4, 1.7, -1.2), RIGHT)
const inPath = new THREE.LineCurve3(IN, SPLIT)

export interface Shot {
  id: number
  side: 'rule' | 'ai'
  /** texto de la tarea que viaja con el paquete */
  label: string
}

function AI({ progress, beats, shot }: { progress: { current: number }; beats: number; shot: Shot | null }) {
  const clock = useSceneClock()
  const root = useRef<THREE.Group>(null)
  const grid = useRef<THREE.Group>(null)
  const core = useRef<THREE.Group>(null)
  const coreInner = useRef<THREE.Mesh>(null)
  const stageOf = () => progress.current * (beats - 1)

  const split = useMemo(() => makeAnim(C.white, 1, SPLIT.toArray()), [])
  const input = useMemo(() => makeAnim(C.white, 1, IN.toArray()), [])
  const bIn = useMemo(() => makeBeam(C.white, 1, 0.4), [])
  const bL1 = useMemo(() => makeBeam(C.cyan, 0, 0.55), [])
  const bL2 = useMemo(() => makeBeam(C.cyan, 0, 0.55), [])
  const corner = CORNER
  const curvePoints = useMemo(() => rightPath.getPoints(40), [])
  const curveLine = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(curvePoints)
    const mat = new THREE.LineBasicMaterial({ color: C.violet, transparent: true, opacity: 0, toneMapped: false })
    return new THREE.Line(geo, mat)
  }, [curvePoints])
  const curveMat = useRef(curveLine.material as THREE.LineBasicMaterial)
  useEffect(
    () => () => {
      curveLine.geometry.dispose()
      ;(curveLine.material as THREE.Material).dispose()
    },
    [curveLine],
  )
  const coreLabel = useRef<THREE.Group>(null)

  // flujo continuo de paquetes
  const N = 8
  const flow = useMemo(() => Array.from({ length: N }, (_, i) => ({ u: i / N, side: i % 2 === 0 ? 'rule' : 'ai' })), [])
  const refs = useMemo(() => Array.from({ length: N + 1 }, () => ({ current: null as THREE.Group | null })), [])
  const shotState = useRef<{ u: number; side: 'rule' | 'ai'; hold: number } | null>(null)
  const shotGroup = useRef<THREE.Group>(null)
  const tags = useMemo(() => ({ shot: makeTag(C.white), result: makeTag(C.cyan), pathL: makeTag(C.cyan), pathR: makeTag(C.violet) }), [])
  const resultAt = useMemo(() => new THREE.Vector3(), [])
  const openT = useRef(0)

  useEffect(() => {
    if (shot) shotState.current = { u: 0, side: shot.side, hold: 0 }
  }, [shot])

  useCameraRig((t) => {
    const s = stageOf()
    return {
      pos: new THREE.Vector3(Math.sin(t * 0.15) * 0.8, 1.2 + range(s, 0, 1) * 0.4, 12.5 - range(s, 0, 1) * 0.5),
      look: new THREE.Vector3(0, 0.6, 0),
    }
  }, 2)

  useStageFit(root, () => ({ w: 12.4, h: 6.8, top: 0.33, bottom: stageOf() > 2.5 ? 0.38 : 0.3 }))

  const place = (g: THREE.Group, u: number, side: string) => {
    if (u < 0.3) inPath.getPoint(u / 0.3, g.position)
    else if (side === 'rule') leftPath.getPoint((u - 0.3) / 0.7, g.position)
    else rightPath.getPoint((u - 0.3) / 0.7, g.position)
  }

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05)
    const t = clock.current
    const s = stageOf()
    const open = s > 0.5
    const statement = range(s, 1.5, 2) * (1 - range(s, 2.5, 3))
    const motion = isMotion()

    split.glow = 0.5 + 0.3 * Math.sin(t * 3)
    input.glow = 0.4
    bL1.grow = open ? 1 : 0
    bL2.grow = open ? 1 : 0
    bL1.opacity = bL2.opacity = 0.55 - statement * 0.3
    if (curveMat.current) curveMat.current.opacity = approach(curveMat.current.opacity, open ? 0.75 - statement * 0.4 : 0, 4, dt)

    if (grid.current) {
      const k = approach(grid.current.scale.x, open ? 1 : 0.0001, 4, dt)
      grid.current.scale.setScalar(k)
      grid.current.visible = k > 0.01
      grid.current.children.forEach((c, i) => {
        const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (m.emissive) m.emissiveIntensity = 0.25 + 0.75 * Math.max(0, Math.sin(t * 2 - i * 0.5)) ** 8
      })
    }
    if (core.current) {
      const k = approach(core.current.scale.x, open ? 0.85 : 0.0001, 4, dt)
      core.current.scale.setScalar(k)
      core.current.visible = k > 0.01
      if (motion) {
        core.current.rotation.y += dt * 0.35
        core.current.rotation.x = Math.sin(t * 0.4) * 0.3
      }
      if (coreLabel.current) {
        coreLabel.current.scale.setScalar(k / 0.85)
        coreLabel.current.visible = k > 0.01
      }
      if (coreInner.current) {
        const p = 1 + 0.08 * Math.sin(t * 2.2)
        coreInner.current.scale.setScalar(p)
      }
    }

    flow.forEach((f, i) => {
      const g = refs[i].current
      if (!g) return
      if (motion) f.u = (f.u + dt * 0.12) % 1
      const visible = open || f.u < 0.3
      g.visible = visible && statement < 0.5
      place(g, open ? f.u : Math.min(f.u, 0.3), f.side)
      ;((g.children[1] as THREE.Sprite).material as THREE.SpriteMaterial).color.set(f.side === 'rule' || !open ? C.cyan : C.violet)
    })

    // Rótulos de los caminos (aparecen después de abrirse la bifurcación)
    const oT = stepTimer(openT, open, dt)
    const shotActive = !!shotState.current && shotState.current.hold < 4
    tags.pathL.on = open && oT > 0.8 && statement < 0.5 && !shotActive ? 1 : 0
    tags.pathR.on = open && oT > 1.2 && statement < 0.5 && !shotActive ? 1 : 0

    // Paquete del quiz: lleva el texto de la tarea y anuncia a dónde llegó
    const sg = shotGroup.current
    if (sg) {
      const st = shotState.current
      if (st && st.hold < 4) {
        if (st.u < 1) st.u = motion ? Math.min(1, st.u + dt * 0.3) : 1
        else st.hold += motion ? dt : 0
        sg.visible = true
        place(sg, st.u, st.side)
        tags.shot.on = st.u < 1 ? 1 : 0
        tags.result.on = st.u >= 1 ? 1 : 0
        tags.result.color.set(st.side === 'rule' ? C.cyan : C.violet)
        resultAt.copy(sg.position).add(new THREE.Vector3(st.side === 'rule' ? 1.5 : -1.4, 0.3, 0.6))
        ;((sg.children[0].children[1] as THREE.Sprite).material as THREE.SpriteMaterial).color.set(st.side === 'rule' ? C.cyan : C.violet)
      } else {
        sg.visible = false
        tags.shot.on = 0
        tags.result.on = 0
      }
    }
    if (refs[N].current) refs[N].current.visible = false
  })

  const tex = getGlowTexture()
  const gridCubes = useMemo(() => {
    const out: [number, number, number][] = []
    for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) out.push([LEFT.x - 0.7 + x * 0.7, LEFT.y - 0.6 - y * 0.7, 0])
    return out
  }, [])

  return (
    <group ref={root}>
      <Node3D anim={input} label="INPUT" size={[0.7, 0.5, 0.5]} />
      <Beam from={IN} to={SPLIT} anim={bIn} thickness={0.03} />
      <Node3D anim={split} label="¿REGLA O IA?" diamond size={[0.62, 0.62, 0.62]} labelBelow />
      <Beam from={SPLIT} to={corner} anim={bL1} thickness={0.03} />
      <Beam from={corner} to={LEFT} anim={bL2} thickness={0.03} />
      <primitive object={curveLine} />

      {/* Determinístico: rejilla perfecta */}
      <group ref={grid}>
        {gridCubes.map((p, i) => (
          <mesh key={i} position={p} geometry={unitBox} scale={0.44}>
            <meshStandardMaterial color={C.body} emissive={C.cyan} emissiveIntensity={0.3} metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
        <Label position={[LEFT.x, LEFT.y - 2.6, 0]} size={0.24} color={C.cyan}>
          DETERMINISTIC
        </Label>
      </group>

      {/* Interpretativo: núcleo orgánico */}
      <group ref={core} position={[RIGHT.x, RIGHT.y - 1.3, 0]} scale={0.85}>
        <mesh>
          <icosahedronGeometry args={[1.05, 1]} />
          <meshBasicMaterial color={C.violet} wireframe transparent opacity={0.55} toneMapped={false} />
        </mesh>
        <mesh ref={coreInner}>
          <icosahedronGeometry args={[0.55, 2]} />
          <meshStandardMaterial color="#1a1440" emissive={C.violet} emissiveIntensity={0.6} roughness={0.4} />
        </mesh>
        <sprite scale={3.6}>
          <spriteMaterial map={tex} color={C.violet} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      </group>
      <group ref={coreLabel} position={[RIGHT.x, RIGHT.y - 2.6, 0]}>
        <Label size={0.24} color={C.violet}>
          INTERPRETATIVE
        </Label>
      </group>

      {refs.map((r, i) => (
        <group key={i} ref={r}>
          <mesh scale={0.08}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color={C.white} toneMapped={false} />
          </mesh>
          <sprite scale={0.8}>
            <spriteMaterial map={tex} color={C.cyan} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
        </group>
      ))}
      {/* Paquete del quiz */}
      <group ref={shotGroup} visible={false}>
        <group scale={1.6}>
          <mesh scale={0.08}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color={C.white} toneMapped={false} />
          </mesh>
          <sprite scale={0.8}>
            <spriteMaterial map={tex} color={C.cyan} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
        </group>
        <FloatTag ctl={tags.shot} text={shot?.label ?? ' '} position={[0, 0.62, 0.3]} size={0.24} />
      </group>
      <FloatTag ctl={tags.result} at={resultAt} text={shot?.side === 'ai' ? 'IA' : 'REGLA'} icon="arrow" size={0.3} />
      <FloatTag ctl={tags.pathL} text={see.iaPaths[0]} icon="dot" position={[-2.3, 1.42, 0.4]} />
      <FloatTag ctl={tags.pathR} text={see.iaPaths[1]} icon="dot" position={[3.3, 2.55, 0.4]} />

      <Particles count={80} opacity={0.3} color="#b8a8ff" />
    </group>
  )
}

export default function AIScene({ visible, progress, beats, shot }: { visible: boolean; progress: { current: number }; beats: number; shot: Shot | null }) {
  return (
    <Stage3D visible={visible} camera={{ position: [0, 1.2, 12.5], fov: 40 }}>
      <fog attach="fog" args={[C.bg, 14, 28]} />
      <AI progress={progress} beats={beats} shot={shot} />
    </Stage3D>
  )
}
