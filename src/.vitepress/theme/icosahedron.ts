// 首页线稿骰子的几何与转动路径。
//
// 形状取自站点 logo（public/logo.svg）：logo 是手绘的二十面骰，十个互相留缝的三角面，
// 并非严格的投影。把一个正二十面体拟合到 logo 上（FIT、RADIUS、CENTER），得到每个面的「位置」；
// 骰子静止时，朝前的十个位置直接画 logo 里对应的多边形，坐标与 logo.svg 逐字相同。
//
// 转动只走正二十面体的对称转动：转完之后二十个面恰好换到别的位置上，整体形状不变，
// 于是每次停下来看到的都是 logo。转动途中各个面是等大、等缝的规则三角形，
// 起步和收尾时再过渡到所在位置的 logo 形状。
//
// 坐标系：x 向右、y 向下、z 朝向观看者，单位与 logo.svg 的 viewBox 相同。
export type Vec3 = [number, number, number]
type Vec2 = [number, number]

/** 骰子中心在 logo.svg 里的位置 */
export const CENTER: Vec2 = [80.729, 72.1225]
/** 外接球半径 */
export const RADIUS = 88.2423
// 把标准朝向的正二十面体转到 logo 朝向的旋转矩阵（按行）
const FIT: Vec3[] = [
  [-0.19363597, -0.458372932, 0.867409572],
  [-0.436655984, -0.751476069, -0.494585958],
  [0.878542351, -0.474529212, -0.054638486],
]
// 每个面向自身中心收缩的比例，留出面与面之间的缝
const GAP = 0.82

// logo.svg 里的十个多边形（其中三个面有一个角被削去一点，所以是四个顶点）
const LOGO: Vec2[][] = [
  [[21.88, 58.14], [0.22, 68.5], [33.3, 11.46]],
  [[96.13, 18.98], [29.85, 55.37], [42.19, 4.9], [42.2, 4.88]],
  [[124.91, 142.31], [111.83, 109.43], [162.74, 75.88], [163.21, 76.37]],
  [[118.19, 144.61], [44.09, 144.59], [105.61, 113]],
  [[100.25, 107.78], [40.41, 138.51], [30.27, 68.98]],
  [[32.22, 131.37], [0, 75.62], [22.52, 64.87]],
  [[102.41, 100.81], [32.74, 62.19], [104.07, 23]],
  [[157.64, 70.73], [109.45, 102.5], [111.15, 23.82]],
  [[160.16, 63.09], [111.14, 13.64], [125.06, 2.43]],
  [[118.38, 0.06], [102.14, 13.15], [102.12, 13.14], [51.83, 0]],
]

// logo 的明暗近似于一盏来自左上方的灯：亮度 = L0 + 法线 · LIGHT（由 logo 十个面的灰度拟合）
const L0 = 0.5726
const LIGHT: Vec3 = [-0.1739, -0.3851, 0.0523]

const FADE = 0.42           // 离开（或还差）多少弧度时，面的形状在 logo 与规则三角形之间过渡完毕
const EDGE = 0.12           // 面转到接近侧立（法线 z 分量小于此值）时淡出，免得画成一条细缝

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const unit = (a: Vec3): Vec3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l] }
const gap3 = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const gap2 = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1])
const centroid = (p: Vec3[]): Vec3 => [(p[0][0] + p[1][0] + p[2][0]) / 3, (p[0][1] + p[1][1] + p[2][1]) / 3, (p[0][2] + p[1][2] + p[2][2]) / 3]
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const smooth = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t) }
/** items 里 distance 最小的那一项的下标 */
function nearest<T>(items: T[], distance: (item: T) => number): number {
  let best = 0, least = Infinity
  items.forEach((item, i) => { const d = distance(item); if (d < least) { least = d; best = i } })
  return best
}

// 罗德里格斯公式：绕过原点的单位轴 k 旋转 angle
function rotate(v: Vec3, k: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle), s = Math.sin(angle)
  const kv = cross(k, v), kd = dot(k, v) * (1 - c)
  return [v[0] * c + kv[0] * s + k[0] * kd, v[1] * c + kv[1] * s + k[1] * kd, v[2] * c + kv[2] * s + k[2] * kd]
}

// ─── 正二十面体（以骰子中心为原点，已转到 logo 的朝向）───────────────────────────
const PHI = (1 + Math.sqrt(5)) / 2
const VERTICES: Vec3[] = []
for (const a of [-1, 1])
  for (const b of [-1, 1])
    for (const raw of [[0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a]] as Vec3[]) {
      const v = unit(raw)
      VERTICES.push([dot(FIT[0], v) * RADIUS, dot(FIT[1], v) * RADIUS, dot(FIT[2], v) * RADIUS])
    }

const SIDE = (RADIUS * 4) / Math.sqrt(10 + 2 * Math.sqrt(5))
const adjacent = (i: number, j: number) => Math.abs(gap3(VERTICES[i], VERTICES[j]) - SIDE) < 1e-6

// 留缝之后的规则三角面
const TRIANGLES: Vec3[][] = []
for (let i = 0; i < 12; i++)
  for (let j = i + 1; j < 12; j++)
    for (let k = j + 1; k < 12; k++)
      if (adjacent(i, j) && adjacent(j, k) && adjacent(i, k)) {
        const corners = [VERTICES[i], VERTICES[j], VERTICES[k]]
        const c = centroid(corners)
        TRIANGLES.push(corners.map((v): Vec3 => [c[0] + (v[0] - c[0]) * GAP, c[1] + (v[1] - c[1]) * GAP, c[2] + (v[2] - c[2]) * GAP]))
      }

// ─── 二十个位置 ────────────────────────────────────────────────────────────────
// 前十个对应 logo 的十个多边形（顺序相同），后十个是它们的对面。
type Slot = {
  /** 规则三角形的三个顶点 */
  regular: Vec3[]
  /** 从规则三角形的顶点到 logo 里对应顶点的偏移（只在画面内，深度不变） */
  offset: Vec3[]
  /** 静止时的 path；背面的位置静止时不显示 */
  rest: string
}

const placed = (p: Vec3): Vec2 => [p[0] + CENTER[0], p[1] + CENTER[1]]
const path = (pts: Vec2[]) => `M${pts.map((p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L')}Z`

const FACING = TRIANGLES.filter((t) => centroid(t)[2] > 0)
const FRONT: Slot[] = LOGO.map((polygon) => {
  const middle: Vec2 = [
    polygon.reduce((sum, p) => sum + p[0], 0) / polygon.length,
    polygon.reduce((sum, p) => sum + p[1], 0) / polygon.length,
  ]
  const regular = FACING[nearest(FACING, (t) => gap2(placed(centroid(t)), middle))]
  const offset = regular.map((v): Vec3 => {
    const at = placed(v)
    const p = polygon[nearest(polygon, (q) => gap2(q, at))]
    return [p[0] - at[0], p[1] - at[1], 0]
  })
  return { regular, offset, rest: path(polygon) }
})
const SLOTS: Slot[] = [
  ...FRONT,
  ...FRONT.map((s): Slot => {
    const regular = s.regular.map((v): Vec3 => [-v[0], -v[1], -v[2]])
    return { regular, offset: s.offset.map((v): Vec3 => [-v[0], -v[1], 0]), rest: path(regular.map(placed)) }
  }),
]

// ─── 画面 ──────────────────────────────────────────────────────────────────────
export type FaceState = {
  /** SVG path 的 d */
  d: string
  /** 作为正面显示的不透明度 */
  front: number
  /** 作为背面（隔着正面透出来的细线）显示的不透明度 */
  back: number
  /** 面的亮度，0（最暗）… 1（最亮） */
  tone: number
}

// seeThrough ∈ [0, 1]：背面的线显现的程度
function face(pts: Vec3[], d: string, seeThrough: number): FaceState {
  let n = unit(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])))
  if (dot(n, centroid(pts)) < 0) n = [-n[0], -n[1], -n[2]]
  return {
    d,
    front: smooth(n[2] / EDGE),
    back: smooth(-n[2] / EDGE) * seeThrough,
    tone: clamp(L0 + dot(n, LIGHT), 0.12, 0.95),
  }
}

/** 静止时的画面：与 logo 相同 */
export const REST: FaceState[] = SLOTS.map((s) =>
  face(s.regular.map((v, i): Vec3 => [v[0] + s.offset[i][0], v[1] + s.offset[i][1], v[2]]), s.rest, 0))

// ─── 转动 ──────────────────────────────────────────────────────────────────────
export type Move = {
  axis: Vec3
  /** 转过的总角度（弧度），带方向 */
  angle: number
  /** 转完之后，每个位置上的面落到哪个位置，它的每个顶点对上那个位置的哪个顶点 */
  landing: { slot: number; vertex: number[] }[]
}

function move(axis: Vec3, angle: number): Move {
  const k = unit(axis)
  const landing = SLOTS.map((s) => {
    const turned = s.regular.map((v) => rotate(v, k, angle))
    const slot = nearest(SLOTS, (t) => gap3(centroid(t.regular), centroid(turned)))
    return { slot, vertex: turned.map((v) => nearest(SLOTS[slot].regular, (w) => gap3(w, v))) }
  })
  return { axis: k, angle, landing }
}

// 可走的路径。逐一比较过所有对称转动途中「有多少个面接近侧立」，只留下最干净的几条：
// 绕正中那个面的法线转三分之一圈（途中几乎没有面会侧立），以及绕它的三个角各转五分之一圈。
// 每条路径正反两个方向各算一条。
const MIDDLE = FRONT[nearest(FRONT, (s) => -centroid(s.regular)[2])].regular
export const MOVES: Move[] = [
  { axis: centroid(MIDDLE), turn: (Math.PI * 2) / 3 },
  ...MIDDLE.map((v) => ({ axis: VERTICES[nearest(VERTICES, (w) => gap3(w, v))], turn: (Math.PI * 2) / 5 })),
].flatMap(({ axis, turn }) => [move(axis, turn), move(axis, -turn)])

/** 沿 m 转过 turned（0 … |m.angle|）弧度时的画面 */
export function frame(m: Move, turned: number): FaceState[] {
  const leaving = 1 - smooth(turned / FADE)                           // 还保留多少起点位置的 logo 形状
  const arriving = 1 - smooth((Math.abs(m.angle) - turned) / FADE)    // 已经变出多少终点位置的 logo 形状
  const seeThrough = 1 - Math.max(leaving, arriving)
  const angle = Math.sign(m.angle) * turned
  return SLOTS.map((s, i) => {
    const to = m.landing[i]
    const target = SLOTS[to.slot].offset
    const pts = s.regular.map((v, a): Vec3 => {
      const p = rotate(v, m.axis, angle)
      const from = s.offset[a], next = target[to.vertex[a]]
      return [p[0] + from[0] * leaving + next[0] * arriving, p[1] + from[1] * leaving + next[1] * arriving, p[2]]
    })
    return face(pts, path(pts.map(placed)), seeThrough)
  })
}
