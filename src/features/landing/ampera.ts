// Model Jembatan Ampera (kondisi 2026) dan jembatan LRT di sampingnya, disusun dari foto referensi.
// Skala: 1 satuan = 5 meter. Sumbu x searah jembatan, z melintang, air di y = 0.
// Jarak menara 75 m, tinggi 63 m, lebar 22 m. Bentang tengah aslinya sudah tidak diangkat;
// di sini ia naik hanya untuk menceritakan Rekber.
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  QuadraticBezierCurve3,
  Quaternion,
  Shape,
  SRGBColorSpace,
  Texture,
  TubeGeometry,
  Vector3,
  type Material,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const DECK = 2.7;
export const LIFT = 4.4;
export const TOWER_X = 7.5;

const ROAD = 2.2; // setengah lebar lantai
const COLUMN_Z = 2.45;
const END = 70;
const LRT_Z = -7;
const LRT_Y = 4.35;

type Point = [number, number, number];

export const PALETTE_NAMES = [
  'steel', 'flood', 'roof', 'teal', 'blue', 'concrete', 'glass', 'sign', 'cable', 'magenta',
  'lamp', 'clock', 'ink', 'train', 'stripe', 'city',
] as const;
export type AmperaPalette = Record<(typeof PALETTE_NAMES)[number], Color>;

/** Sudut jarum jam (radian, searah jarum dari angka 12) menurut waktu Palembang (WIB, UTC+7). */
export function clockAngles(now: Date) {
  const minutes = (now.getUTCHours() + 7) * 60 + now.getUTCMinutes();
  return { hour: ((minutes % 720) / 720) * Math.PI * 2, minute: ((minutes % 60) / 60) * Math.PI * 2 };
}

/** Menyatukan geometri diam yang sematerial menjadi satu perintah gambar. */
const merged = (geometries: BufferGeometry[], material: Material) => new Mesh(mergeGeometries(geometries), material);

/** Kotak-kotak, dikumpulkan dulu lalu digambar sekali jalan. */
function boxSet() {
  const matrices: Matrix4[] = [];
  return {
    add(center: Point, size: Point) {
      matrices.push(new Matrix4().compose(new Vector3(...center), new Quaternion(), new Vector3(...size)));
    },
    mesh(material: Material) {
      const mesh = new InstancedMesh(new BoxGeometry(), material, matrices.length);
      matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
      mesh.computeBoundingSphere();
      return mesh;
    },
  };
}

/** Digambar dalam koordinat `width` x `height`, tetapi disimpan `scale` kali lebih rapat. */
function canvasTexture(width: number, height: number, scale: number, draw: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext('2d');
  context?.scale(scale, scale);
  if (context) draw(context);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

export function glowPoints(positions: number[], color: Color, size: number, map: Texture) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return new Points(
    geometry,
    new PointsMaterial({ color, size, map, transparent: true, depthWrite: false, blending: AdditiveBlending }),
  );
}

/** Gelagar pelat dengan tepi bawah melengkung: tinggi di pilar, tipis di tengah bentang. */
function girder(from: number, to: number, atPier: number, atMiddle: number) {
  const top = DECK - 0.1;
  const end = top - atPier;
  const control = top - 2 * atMiddle + atPier;
  const shape = new Shape();
  shape.moveTo(from, top);
  shape.lineTo(to, top);
  shape.lineTo(to, end);
  shape.quadraticCurveTo((from + to) / 2, control, from, end);
  const geometry = new ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false, curveSegments: 48 });
  const bottom = (x: number) => {
    const t = (x - from) / (to - from);
    return (1 - t) ** 2 * end + 2 * (1 - t) * t * control + t ** 2 * end;
  };
  return { geometry, bottom, top };
}

interface DeckParts {
  webs: BufferGeometry[];
  boxes: ReturnType<typeof boxSet>;
  lamps: number[];
  underLamps: number[];
  posts: Point[];
}

/** Satu bentang: gelagar di kedua sisi, lantai, pagar, pengaku, dan posisi lampu. */
function deckSpan({ webs, boxes, lamps, underLamps, posts }: DeckParts, from: number, to: number) {
  const { geometry, bottom, top } = girder(from, to, 1.05, 0.42);
  for (const side of [-1, 1]) {
    webs.push(geometry.clone().translate(0, 0, side * ROAD - 0.07));
    const face = side * (ROAD + 0.09);
    for (let x = from + 0.4; x < to; x += 0.8) {
      const low = bottom(x);
      boxes.add([x, (top + low) / 2, face], [0.05, top - low, 0.05]);
    }
    for (let x = from + 0.2; x < to; x += 0.55) underLamps.push(x, top - 0.2, side * (ROAD + 0.18));
    boxes.add([(from + to) / 2, DECK + 0.34, side * ROAD], [to - from, 0.05, 0.05]);
    boxes.add([(from + to) / 2, DECK + 0.18, side * ROAD], [to - from, 0.03, 0.03]);
    for (let x = from + 0.15; x < to; x += 0.32) boxes.add([x, DECK + 0.17, side * ROAD], [0.035, 0.34, 0.035]);
    for (let x = from + 2; x < to; x += 4.6) {
      posts.push([x, DECK, side * (ROAD - 0.2)]);
      lamps.push(x, DECK + 1.9, side * (ROAD - 0.72));
    }
  }
}

/** Tiang lampu melengkung seperti tongkat gembala, menunduk ke arah jalan. */
function lampPosts(positions: Point[], material: Material) {
  const curve = new QuadraticBezierCurve3(new Vector3(0, 1.35, 0), new Vector3(0, 2.05, 0), new Vector3(0, 1.93, -0.55));
  const arm = new TubeGeometry(curve, 20, 0.028, 8);
  const pole = new CylinderGeometry(0.03, 0.045, 1.36, 10).translate(0, 0.68, 0);
  return [pole, arm].map((geometry) => {
    const mesh = new InstancedMesh(geometry, material, positions.length);
    const turn = new Quaternion();
    positions.forEach(([x, y, z], index) => {
      turn.setFromAxisAngle(new Vector3(0, 1, 0), z > 0 ? 0 : Math.PI);
      mesh.setMatrixAt(index, new Matrix4().compose(new Vector3(x, y, z), turn, new Vector3(1, 1, 1)));
    });
    mesh.computeBoundingSphere();
    return mesh;
  });
}

export function createAmpera(color: AmperaPalette, glow: Texture) {
  const group = new Group();
  const standard = (tint: Color, glowTint = tint, roughness = 0.6) =>
    new MeshStandardMaterial({ color: tint, emissive: glowTint, emissiveIntensity: 0, roughness, metalness: 0.15 });

  const steel = standard(color.steel, color.flood);
  steel.flatShading = true;
  const girderSteel = standard(color.steel, color.flood);
  const roof = standard(color.roof, color.flood);
  const teal = standard(color.teal, color.blue);
  const concrete = standard(color.concrete, color.concrete, 0.95);
  const dark = standard(color.ink);
  const city = standard(color.city);
  const trainBody = standard(color.train);
  const stripe = standard(color.stripe);

  // ---------- Tekstur: rumah kaca, jam, dan papan nama ----------
  const windows = (lit: boolean) =>
    canvasTexture(256, 128, 4, (context) => {
      context.fillStyle = (lit ? color.ink : color.steel).getStyle();
      context.fillRect(0, 0, 256, 128);
      for (let column = 0; column < 14; column += 1) {
        for (let row = 0; row < 4; row += 1) {
          const bright = (column * 7 + row * 5) % 6 < 2;
          context.fillStyle = lit ? (bright ? color.clock : color.ink).getStyle() : color.glass.getStyle();
          context.fillRect(5 + column * 17.8, 6 + row * 30, 14, row === 0 ? 22 : 25);
        }
      }
    });
  const glassMaterial = new MeshStandardMaterial({
    map: windows(false),
    emissiveMap: windows(true),
    emissive: color.clock,
    emissiveIntensity: 0,
    roughness: 0.4,
  });

  const drawClock = (context: CanvasRenderingContext2D, now: Date) => {
    context.clearRect(0, 0, 256, 256);
    context.save();
    context.translate(128, 128);
    context.fillStyle = color.clock.getStyle();
    context.beginPath();
    context.arc(0, 0, 124, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = context.strokeStyle = color.ink.getStyle();
    context.lineWidth = 5;
    context.stroke();
    context.font = 'bold 40px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (let hour = 0; hour < 12; hour += 1) {
      const angle = (hour / 12) * Math.PI * 2;
      if (hour % 3 === 0) {
        context.fillText(String(hour || 12), Math.sin(angle) * 92, -Math.cos(angle) * 92);
        continue;
      }
      context.save();
      context.rotate(angle);
      context.fillRect(-5, -112, 10, 34);
      context.restore();
    }
    const { hour, minute } = clockAngles(now);
    for (const [angle, length, width] of [[hour, 62, 11], [minute, 96, 7]] as const) {
      context.save();
      context.rotate(angle);
      context.fillRect(-width / 2, -length, width, length + 14);
      context.restore();
    }
    context.restore();
  };
  const clockTexture = canvasTexture(256, 256, 4, (context) => drawClock(context, new Date()));
  const clockFace = new MeshBasicMaterial({ map: clockTexture, transparent: true });

  const signTexture = canvasTexture(512, 80, 2, (context) => {
    context.fillStyle = color.teal.getStyle();
    context.fillRect(0, 0, 512, 80);
    context.font = '900 62px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineWidth = 6;
    context.strokeStyle = color.roof.getStyle();
    const letters = 'AMPERA';
    for (let index = 0; index < letters.length; index += 1) {
      const x = 81 + index * 70;
      context.strokeText(letters.charAt(index), x, 43);
      context.fillStyle = color.sign.getStyle();
      context.fillText(letters.charAt(index), x, 43);
    }
  });
  const signFace = new MeshBasicMaterial({ map: signTexture });

  // ---------- Menara ----------
  const steelBoxes = boxSet();
  const roofBoxes = boxSet();
  const tealBoxes = boxSet();
  const concreteBoxes = boxSet();
  const darkBoxes = boxSet();
  const ledBoxes = boxSet();

  // Kolom pejal yang sedikit meruncing ke atas.
  const columnHeight = 11;
  const columnShape = new CylinderGeometry(0.9 / Math.SQRT2, 1.12 / Math.SQRT2, columnHeight, 4)
    .rotateY(Math.PI / 4)
    .scale(1, 1, 0.58);
  // Penampang pilar menara: memanjang melintang dengan ujung bulat.
  const pierShape = new Shape();
  pierShape.moveTo(-1.35, -2.5);
  pierShape.lineTo(-1.35, 2.5);
  pierShape.absarc(0, 2.5, 1.35, Math.PI, 0, true);
  pierShape.lineTo(1.35, -2.5);
  pierShape.absarc(0, -2.5, 1.35, 0, Math.PI, true);
  const pierGeometry = new ExtrudeGeometry(pierShape, { depth: 1.6, bevelEnabled: false, curveSegments: 40 }).rotateX(-Math.PI / 2);
  const clockGeometry = new CircleGeometry(0.6, 96);
  const signGeometry = new PlaneGeometry(3.5, 0.55);
  const glassGeometry = new PlaneGeometry(4.3, 1.65);
  const columns: BufferGeometry[] = [];
  const piers: BufferGeometry[] = [];
  const panes: BufferGeometry[] = [];
  const clocks: BufferGeometry[] = [];
  const signs: BufferGeometry[] = [];
  const antennas: number[] = [];

  for (const side of [-1, 1]) {
    const x = side * TOWER_X;
    piers.push(pierGeometry.clone().translate(x, 0, 0));
    for (const z of [-COLUMN_Z, COLUMN_Z]) {
      columns.push(columnShape.clone().translate(x, 1.45 + columnHeight / 2, z));
      for (let y = 3.6; y < 12; y += 1.9) steelBoxes.add([x, y, z], [1.14 - (y / 12) * 0.2, 0.05, 0.66]);
    }

    // Rumah kaca di puncak.
    steelBoxes.add([x, 11.45, 0], [0.96, 1.65, 4.28]);
    for (const face of [-1, 1]) {
      panes.push(glassGeometry.clone().rotateY((face * Math.PI) / 2).translate(x + face * 0.49, 11.45, 0));
    }

    // Atap datar menjorok dengan antena dan garis lampu biru.
    roofBoxes.add([x, 12.42, 0], [1.45, 0.16, 5.75]);
    roofBoxes.add([x, 12.62, 0], [2, 0.24, 6.4]);
    for (const dx of [-1, 1]) ledBoxes.add([x + dx, 12.68, 0], [0.04, 0.07, 6.44]);
    for (const dz of [-3.2, 3.2]) ledBoxes.add([x, 12.68, dz], [2.04, 0.07, 0.04]);
    for (const z of [-2.1, -0.4, 1.9]) darkBoxes.add([x, 13.1, z], [0.03, 0.75, 0.03]);
    antennas.push(x, 13.5, 1.9);

    // Dudukan roda kabel dengan dua ornamen bercabang tiga.
    tealBoxes.add([x, 10.45, 0], [0.55, 0.1, 4.3]);
    for (const z of [-1.5, 1.5]) {
      for (const face of [-0.42, 0.42]) {
        tealBoxes.add([x + face, 10.56, z], [0.08, 0.08, 0.46]);
        for (const dz of [-0.2, 0, 0.2]) tealBoxes.add([x + face, 10.74, z + dz], [0.06, 0.3, 0.05]);
      }
    }

    // Panel jam. Jam menghadap ke luar, ke arah tepi sungai.
    steelBoxes.add([x, 9.55, 0], [0.82, 1.38, 4.3]);
    clocks.push(clockGeometry.clone().rotateY((side * Math.PI) / 2).translate(x + side * 0.43, 9.55, 0));

    // Balok tengah dan balok bertulis AMPERA.
    tealBoxes.add([x, 7.35, 0], [0.62, 0.42, 4.3]);
    tealBoxes.add([x, 4.55, 0], [0.62, 0.66, 4.3]);
    for (const face of [-1, 1]) {
      signs.push(signGeometry.clone().rotateY((face * Math.PI) / 2).translate(x + face * 0.32, 4.55, 0));
    }
    for (const z of [-1.95, -1.7, -1.45, -1.2, 1.2, 1.45, 1.7, 1.95]) {
      tealBoxes.add([x, 5, z], [0.12, 0.24, 0.1]);
      darkBoxes.add([x, 7.75, z], [0.025, 5.3, 0.025]);
    }
  }

  // ---------- Bentang samping dan pilarnya ----------
  const sideParts: DeckParts = { webs: [], boxes: boxSet(), lamps: [], underLamps: [], posts: [] };
  for (const side of [-1, 1]) {
    for (let start = TOWER_X + 0.45; start < END; start += 11) {
      const end = Math.min(END, start + 11);
      const [from, to] = side < 0 ? [-end, -start] : [start, end];
      deckSpan(sideParts, from, to);
      concreteBoxes.add([(from + to) / 2, DECK - 0.07, 0], [to - from, 0.14, ROAD * 2 + 0.3]);
      concreteBoxes.add([side * end, 0.75, 0], [0.8, 1.8, ROAD * 2 - 0.2]);
    }
  }

  // ---------- Bentang tengah ----------
  const half = TOWER_X - 0.55;
  const span = new Group();
  const spanParts: DeckParts = { webs: [], boxes: boxSet(), lamps: [], underLamps: [], posts: [] };
  deckSpan(spanParts, -half, half);
  const slab = new Mesh(new BoxGeometry(half * 2, 0.14, ROAD * 2 + 0.3), concrete);
  slab.position.y = DECK - 0.07;
  const spanRails = spanParts.boxes.mesh(girderSteel);
  const spanPosts = lampPosts(spanParts.posts, concrete);
  span.add(slab, merged(spanParts.webs, girderSteel), spanRails, ...spanPosts);

  const cableShape = new BoxGeometry(0.035, 1, 0.035).translate(0, -0.5, 0);
  const cableSpots = [-1, 1].flatMap((side) =>
    [-ROAD + 0.12, -ROAD + 0.28, ROAD - 0.28, ROAD - 0.12].map((z) => [side * (half - 0.08), z] as const),
  );
  const liftCables = new InstancedMesh(cableShape, dark, cableSpots.length);
  cableSpots.forEach(([x, z], index) => liftCables.setMatrixAt(index, new Matrix4().makeTranslation(x, 0, z)));
  liftCables.position.y = 10.45;
  liftCables.frustumCulled = false;

  // ---------- Kabel hias yang menyala di malam hari ----------
  const garland = new MeshBasicMaterial({ color: color.cable.clone() });
  const strings: BufferGeometry[] = [];
  const hang = (from: Point, to: Point, sag: number) => {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const middle = start.clone().add(end).multiplyScalar(0.5);
    middle.y -= sag * 2;
    strings.push(new TubeGeometry(new QuadraticBezierCurve3(start, middle, end), 96, 0.024, 8));
  };
  for (const z of [-COLUMN_Z - 0.35, COLUMN_Z + 0.35]) {
    for (const height of [12.35, 10.6]) {
      hang([-TOWER_X, height, z], [TOWER_X, height, z], 1.15);
      for (const side of [-1, 1]) {
        hang([side * TOWER_X, height, z], [side * (height > 11 ? 31 : 27), DECK + 0.35, z], 1.3);
      }
    }
  }

  // ---------- Jembatan LRT di sisi belakang ----------
  const lrtRed = boxSet();
  lrtRed.add([0, LRT_Y - 0.38, LRT_Z], [END * 2, 0.52, 1.45]);
  for (let x = -END; x < END; x += 0.7) {
    for (const z of [-0.76, 0.76]) lrtRed.add([x, LRT_Y - 0.38, LRT_Z + z], [0.08, 0.52, 0.06]);
    for (const z of [-0.93, 0.93]) darkBoxes.add([x, LRT_Y + 0.42, LRT_Z + z], [0.03, 0.3, 0.03]);
  }
  concreteBoxes.add([0, LRT_Y - 0.04, LRT_Z], [END * 2, 0.18, 1.95]);
  for (const z of [-0.93, 0.93]) {
    concreteBoxes.add([0, LRT_Y + 0.16, LRT_Z + z], [END * 2, 0.26, 0.1]);
    darkBoxes.add([0, LRT_Y + 0.57, LRT_Z + z], [END * 2, 0.035, 0.035]);
  }
  // Pilar berbentuk T dengan ponton di kakinya.
  const capShape = new Shape();
  capShape.moveTo(-0.4, 2.7);
  capShape.quadraticCurveTo(-0.45, 3.35, -1.05, 3.45);
  capShape.lineTo(-1.05, 3.75);
  capShape.lineTo(1.05, 3.75);
  capShape.lineTo(1.05, 3.45);
  capShape.quadraticCurveTo(0.45, 3.35, 0.4, 2.7);
  const capGeometry = new ExtrudeGeometry(capShape, { depth: 0.8, bevelEnabled: false, curveSegments: 32 }).translate(0, 0, -0.4).rotateY(Math.PI / 2);
  const pillars = Array.from({ length: 11 }, (_, index) => -62 + index * 11.5);
  const caps = new InstancedMesh(capGeometry, concrete, pillars.length);
  pillars.forEach((x, index) => caps.setMatrixAt(index, new Matrix4().makeTranslation(x + 2.5, 0, LRT_Z)));
  for (const x of pillars) {
    concreteBoxes.add([x + 2.5, 1.4, LRT_Z], [0.8, 2.8, 0.8]);
    concreteBoxes.add([x + 2.5, 0.16, LRT_Z], [2.4, 0.4, 2]);
  }

  const train = new Group();
  const carBoxes = boxSet();
  const stripeBoxes = boxSet();
  const trainGlass = boxSet();
  for (let car = 0; car < 3; car += 1) {
    const x = car * 3.5 - 3.5;
    carBoxes.add([x, 0.4, 0], [3.3, 0.66, 0.9]);
    stripeBoxes.add([x, 0.2, 0], [3.32, 0.1, 0.92]);
    trainGlass.add([x, 0.5, 0], [3, 0.2, 0.93]);
  }
  const trainWindows = standard(color.glass, color.clock, 0.3);
  train.add(carBoxes.mesh(trainBody), stripeBoxes.mesh(stripe), trainGlass.mesh(trainWindows));
  train.position.set(24, LRT_Y + 0.08, LRT_Z);

  // ---------- Bangunan rendah di seberang ----------
  const town = boxSet();
  const townLights: number[] = [];
  for (let i = 1; i <= 190; i += 1) {
    const wave = (step: number) => (i * step) % 1;
    const x = (wave(0.618034) - 0.5) * 230;
    const z = -46 - wave(0.569841) * 44;
    const height = 0.4 + wave(0.754878) ** 3 * 3.2;
    town.add([x, height / 2, z], [1.2 + wave(0.41421) * 3, height, 1.5]);
    townLights.push(x, 0.25 + height * wave(0.73205), z + 0.9, x + 0.8, 0.3, z + 1);
  }

  // ---------- Lampu ----------
  const ledMaterial = new MeshBasicMaterial({ color: color.blue.clone(), transparent: true });
  const streetGlow = glowPoints(sideParts.lamps, color.lamp, 1.25, glow);
  const spanStreetGlow = glowPoints(spanParts.lamps, color.lamp, 1.25, glow);
  const sideUnder = glowPoints(sideParts.underLamps, color.magenta, 0.62, glow);
  const spanUnder = glowPoints(spanParts.underLamps, color.magenta, 0.62, glow);
  span.add(spanStreetGlow, spanUnder);

  const sideRails = sideParts.boxes.mesh(girderSteel);
  const sidePosts = lampPosts(sideParts.posts, concrete);
  const darkDetails = darkBoxes.mesh(dark);

  group.add(
    span,
    train,
    liftCables,
    caps,
    merged(columns, steel),
    merged(piers, concrete),
    merged(panes, glassMaterial),
    merged(clocks, clockFace),
    merged(signs, signFace),
    merged(strings, garland),
    merged(sideParts.webs, girderSteel),
    steelBoxes.mesh(steel),
    roofBoxes.mesh(roof),
    tealBoxes.mesh(teal),
    concreteBoxes.mesh(concrete),
    darkDetails,
    ledBoxes.mesh(ledMaterial),
    sideRails,
    ...sidePosts,
    lrtRed.mesh(girderSteel),
    town.mesh(city),
    streetGlow,
    sideUnder,
    glowPoints(antennas, color.magenta, 0.7, glow),
    glowPoints(townLights, color.lamp, 0.9, glow),
  );

  const cableDay = color.concrete;
  let shownMinute = -1;

  return {
    group,
    /** Benda tipis yang tidak terlihat di pantulan air yang kabur. */
    details: [...sidePosts, ...spanPosts, darkDetails],
    /** `lift` 0 sampai 1, `night` 0 sampai 1, `time` dalam milidetik. */
    update({ lift, night, time, still }: { lift: number; night: number; time: number; still: boolean }) {
      span.position.y = lift * LIFT;
      liftCables.scale.y = 10.45 - DECK - lift * LIFT;
      // Malam: menara disorot merah, atap bergaris biru, kabel dan lampu menyala.
      steel.emissiveIntensity = 0.04 + night * 0.62;
      girderSteel.emissiveIntensity = 0.03 + night * 0.28;
      roof.emissiveIntensity = night * 0.5;
      teal.emissiveIntensity = night * 0.55;
      glassMaterial.emissiveIntensity = night * 0.9;
      trainWindows.emissiveIntensity = night * 0.8;
      ledMaterial.opacity = night;
      garland.color.copy(cableDay).lerp(color.cable, Math.min(1, night * 1.5));
      for (const points of [streetGlow, spanStreetGlow]) (points.material as PointsMaterial).opacity = 0.2 + night * 0.8;
      for (const points of [sideUnder, spanUnder]) (points.material as PointsMaterial).opacity = night;
      clockFace.color.setScalar(1 - night * 0.12);
      signFace.color.setScalar(0.65 + night * 0.35);
      // Kereta melintas kira-kira tiap setengah menit.
      if (!still) train.position.x = ((time / 200) % 170) - 85;

      const now = new Date();
      if (now.getUTCMinutes() !== shownMinute) {
        shownMinute = now.getUTCMinutes();
        const context = (clockTexture.image as HTMLCanvasElement).getContext('2d');
        if (context) {
          drawClock(context, now);
          clockTexture.needsUpdate = true;
        }
      }
    },
  };
}
