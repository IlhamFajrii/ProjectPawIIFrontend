// Jembatan bergaya Ampera di atas Musi. Sumbu x searah jembatan, air di y = 0.
// Posisi scroll cerita (0 = pembuka, 1 sampai 5 = tahap Rekber) menggerakkan kamera, bentang, dana, dan langit.
// Warna dibaca dari token CSS `--scene-*`.
import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Quaternion,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

type Point = [number, number, number];

const DECK = 2.2;
const LIFT = 4.6;
const TOWER_X = 5.4;
const TOP = 12.4;
const HALF = 1.35;
const END = 80;

// Satu baris per posisi cerita. `shift` menggeser jembatan di layar lebar agar tidak tertimpa teks.
const KEYS: { eye: Point; look: Point; shift: [number, number]; lift: number; token: number; night: number; dawn: number }[] = [
  { eye: [-13, 4.8, 39], look: [0, 5.6, 0], shift: [0, 0.14], lift: 0, token: -8.5, night: 0.2, dawn: 0 },
  { eye: [-25, 7.5, 31], look: [-4, 5.4, 0], shift: [0.18, 0], lift: 0, token: -7.5, night: 0.4, dawn: 0 },
  { eye: [-7, 6.5, 32], look: [0, 7, 0], shift: [0.18, 0], lift: 1, token: 0, night: 0.8, dawn: 0 },
  { eye: [17, 9.5, 28], look: [0, 6, 0], shift: [0.18, 0], lift: 1, token: 0, night: 1, dawn: 0 },
  { eye: [-13, 1.8, 36], look: [0, 6.4, 0], shift: [0.18, 0.02], lift: 1, token: 0, night: 0.85, dawn: 0 },
  { eye: [9, 8, 38], look: [2, 4.6, 0], shift: [0.16, 0], lift: 0, token: 8.5, night: 0, dawn: 1 },
];

export const LAST = KEYS.length - 1;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixPoint = (a: Point, b: Point, t: number): Point => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

/**
 * Keadaan scene pada posisi cerita `c`. Dana tidak pernah menyeberangi celah:
 * saat bentang akan naik dana pindah dulu, saat turun bentang tersambung dulu.
 */
export function poseAt(c: number) {
  const at = Math.min(LAST, Math.max(0, c));
  const index = Math.min(LAST - 1, Math.floor(at));
  const a = KEYS[index] as (typeof KEYS)[number];
  const b = KEYS[index + 1] as (typeof KEYS)[number];
  const t = at - index;
  const eased = smooth(t);
  const first = smooth(t / 0.5);
  const second = smooth((t - 0.5) / 0.5);
  const rising = b.lift > a.lift;
  const falling = b.lift < a.lift;
  return {
    eye: mixPoint(a.eye, b.eye, eased),
    look: mixPoint(a.look, b.look, eased),
    shift: [mix(a.shift[0], b.shift[0], eased), mix(a.shift[1], b.shift[1], eased)] as const,
    lift: mix(a.lift, b.lift, rising ? second : falling ? first : eased),
    token: mix(a.token, b.token, rising ? first : falling ? second : eased),
    tokenAlpha: smooth(at / 0.7),
    night: mix(a.night, b.night, eased),
    dawn: mix(a.dawn, b.dawn, eased),
  };
}

/** Balok baja, dikumpulkan dulu lalu digambar sekali jalan. */
function beamSet() {
  const matrices: Matrix4[] = [];
  const up = new Vector3(0, 1, 0);
  return {
    add(from: Point, to: Point, thickness: number) {
      const start = new Vector3(...from);
      const direction = new Vector3(...to).sub(start);
      const length = direction.length();
      const middle = start.addScaledVector(direction, 0.5);
      const turn = new Quaternion().setFromUnitVectors(up, direction.normalize());
      matrices.push(new Matrix4().compose(middle, turn, new Vector3(thickness, length, thickness)));
    },
    box(center: Point, size: Point) {
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

type Beams = ReturnType<typeof beamSet>;

/** Satu kaki menara: empat tiang dengan rangka zigzag. */
function column(beams: Beams, x: number, z: number) {
  const corners: [number, number][] = [
    [x - 0.42, z - 0.3],
    [x + 0.42, z - 0.3],
    [x + 0.42, z + 0.3],
    [x - 0.42, z + 0.3],
  ];
  for (const [cx, cz] of corners) beams.add([cx, -0.6, cz], [cx, TOP, cz], 0.13);
  for (let i = 0, low = 0; low < TOP - 0.2; i += 1, low += 0.78) {
    const high = Math.min(TOP, low + 0.78);
    corners.forEach(([cx, cz], side) => {
      const [nx, nz] = corners[(side + 1) % 4] as [number, number];
      const flip = (i + side) % 2 === 0;
      beams.add([cx, flip ? low : high, cz], [nx, flip ? high : low, nz], 0.055);
      beams.add([cx, high, cz], [nx, high, nz], 0.07);
    });
  }
  beams.box([x, TOP + 0.14, z], [1.28, 0.28, 1]);
  beams.box([x, TOP + 0.45, z], [0.86, 0.34, 0.7]);
}

function deck(beams: Beams, lamps: number[], from: number, to: number) {
  const center = (from + to) / 2;
  beams.box([center, DECK, 0], [to - from, 0.2, HALF * 2]);
  for (const z of [-HALF, HALF]) {
    beams.box([center, DECK + 0.42, z], [to - from, 0.05, 0.06]);
    for (let x = from + 0.25; x < to; x += 0.55) beams.box([x, DECK + 0.22, z], [0.045, 0.4, 0.045]);
    for (let x = from + 1.1; x < to; x += 2.45) {
      beams.box([x, DECK + 0.62, z], [0.06, 1.05, 0.06]);
      lamps.push(x, DECK + 1.2, z);
    }
  }
}

/** Bintik cahaya lembut untuk lampu, bintang, dan dana. */
function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    for (const [stop, alpha] of [[0, 1], [0.2, 0.8], [0.5, 0.16], [1, 0]] as const) {
      gradient.addColorStop(stop, `rgba(255,255,255,${alpha})`);
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(canvas);
}

const SKY_VERTEX = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 uTop, uHorizon, uSun;
  varying vec3 vDirection;
  void main() {
    vec3 direction = normalize(vDirection);
    vec3 color = mix(uHorizon, uTop, pow(clamp(direction.y, 0.0, 1.0), 0.42));
    float facing = max(dot(direction, normalize(vec3(0.3, 0.06, -1.0))), 0.0);
    color += uSun * (pow(facing, 900.0) * 0.9 + pow(facing, 24.0) * 0.3 + pow(facing, 4.0) * 0.1);
    // Dither kecil agar gradasi gelap tidak bergaris.
    color += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 400.0;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }`;

const WATER = {
  name: 'MusiShader',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
    uHorizon: { value: null },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorld = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color, uHorizon;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vec2 p = vWorld.xz;
      float far = length(cameraPosition - vWorld);
      float a = sin(p.y * 2.3 + uTime * 1.1 + sin(p.x * 0.45 + uTime * 0.2) * 2.2);
      float b = sin(p.y * 5.7 - uTime * 1.7 + p.x * 1.15 + sin(p.y * 0.8));
      float c = sin(p.x * 1.6 + p.y * 0.9 + uTime * 0.7);
      float near = clamp(24.0 / far, 0.2, 1.3);
      vec2 bend = vec2(c * 0.0035 + b * 0.0025, a * 0.0075 + b * 0.0045) * near;
      // Beberapa sampel vertikal membuat pantulan lampu memanjang seperti di air.
      vec3 mirror = vec3(0.0);
      float total = 0.0;
      for (int i = -3; i <= 3; i++) {
        float weight = 1.0 - abs(float(i)) / 4.0;
        vec2 offset = bend + vec2(0.0, float(i) * 0.0065 * near);
        mirror += texture2DProj(tDiffuse, vUv + vec4(offset * vUv.w, 0.0, 0.0)).rgb * weight;
        total += weight;
      }
      mirror /= total;
      float grazing = pow(1.0 - clamp(normalize(cameraPosition - vWorld).y, 0.0, 1.0), 3.0);
      vec3 result = mix(color, mirror, mix(0.42, 0.9, grazing));
      result += mirror * smoothstep(0.7, 1.0, a * b) * 0.3;
      result = mix(result, uHorizon, smoothstep(90.0, 260.0, far));
      gl_FragColor = vec4(result, 1.0);
      #include <colorspace_fragment>
    }`,
};

interface Options {
  /** Reduced motion: tanpa loop; gambar hanya diperbarui saat tahap berganti. */
  still: boolean;
  /** Posisi cerita saat ini, 0 sampai LAST. */
  read: () => number;
}

/** Memasang scene di dalam `host`. Melempar error bila WebGL tidak tersedia. */
export function createRiverScene(host: HTMLElement, { still, read }: Options) {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  host.append(renderer.domElement);

  const styles = getComputedStyle(host);
  const color = (name: string) => new Color(styles.getPropertyValue(`--scene-${name}`).trim());
  const palette = {
    top: [color('dusk-top'), color('night-top'), color('dawn-top')] as const,
    horizon: [color('dusk-horizon'), color('night-horizon'), color('dawn-horizon')] as const,
    sun: color('sun'),
    water: color('water'),
    steel: color('steel'),
    stone: color('stone'),
    lamp: color('lamp'),
    star: color('star'),
  };

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.5, 600);
  const fog = new Fog(palette.horizon[0].clone(), 45, 140);
  scene.fog = fog;

  const sky = {
    uTop: { value: new Color() },
    uHorizon: { value: new Color() },
    uSun: { value: new Color() },
  };
  const dome = new Mesh(
    new SphereGeometry(300, 32, 20),
    new ShaderMaterial({ uniforms: sky, side: BackSide, depthWrite: false, vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT }),
  );

  const river = new Reflector(new PlaneGeometry(700, 700), { clipBias: 0.003, multisample: 0, shader: WATER });
  river.rotation.x = -Math.PI / 2;
  const water = (river.material as ShaderMaterial).uniforms as unknown as {
    color: { value: Color };
    uTime: { value: number };
    uHorizon: { value: Color };
  };
  water.color.value = palette.water;
  water.uHorizon.value = sky.uHorizon.value;

  const ambient = new HemisphereLight(palette.horizon[2], palette.water, 1.6);
  const key = new DirectionalLight(palette.sun, 2);
  key.position.set(-10, 9, 14);

  const texture = glowTexture();
  const glow = (positions: number[], tint: Color, size: number) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return new Points(
      geometry,
      new PointsMaterial({ color: tint, size, map: texture, transparent: true, depthWrite: false, blending: AdditiveBlending }),
    );
  };

  const steel = new MeshStandardMaterial({ color: palette.steel, emissive: palette.steel, metalness: 0.3, roughness: 0.5 });
  const stone = new MeshStandardMaterial({ color: palette.stone, roughness: 0.9 });

  // Bagian tetap: menara, bentang samping, dan pilar.
  const fixed = beamSet();
  const piers = beamSet();
  const sideLamps: number[] = [];
  for (const side of [-1, 1]) {
    const x = side * TOWER_X;
    for (const z of [-HALF - 0.35, HALF + 0.35]) column(fixed, x, z);
    for (const [y, thickness] of [[DECK - 0.5, 0.34], [DECK + LIFT + 2.1, 0.26], [TOP - 0.15, 0.4]] as const) {
      for (const dx of [-0.42, 0.42]) fixed.add([x + dx, y, -HALF - 0.35], [x + dx, y, HALF + 0.35], thickness);
    }
    for (const z of [-HALF, HALF]) fixed.add([x, DECK + LIFT + 2.1, z], [x, TOP - 0.15, -z], 0.09);
    piers.box([x, 0.2, 0], [2.1, 2, HALF * 2 + 2]);
    piers.box([x, 1.3, 0], [1.5, 0.3, HALF * 2 + 1.4]);

    const inner = TOWER_X + 0.45;
    deck(fixed, sideLamps, Math.min(side * inner, side * END), Math.max(side * inner, side * END));
    for (const z of [-HALF + 0.15, HALF - 0.15]) {
      fixed.add([side * inner, DECK - 0.75, z], [side * END, DECK - 0.75, z], 0.11);
      for (let k = 0, a = inner; a < END - 0.9; k += 1, a += 0.9) {
        const low = DECK - 0.75;
        fixed.add([side * a, k % 2 ? DECK : low, z], [side * (a + 0.9), k % 2 ? low : DECK, z], 0.06);
      }
    }
    for (let p = 13.5; p < END; p += 8.2) {
      for (const z of [-HALF + 0.35, HALF - 0.35]) piers.box([side * p, 0.4, z], [0.55, 2.1, 0.55]);
    }
  }

  // Bentang tengah yang bisa diangkat, beserta kabelnya.
  const span = new Group();
  const lifted = beamSet();
  const spanLamps: number[] = [];
  const half = TOWER_X - 0.5;
  deck(lifted, spanLamps, -half, half);
  for (const z of [-HALF - 0.05, HALF + 0.05]) {
    lifted.add([-half, DECK - 0.62, z], [half, DECK - 0.62, z], 0.16);
    for (let i = 0, width = (half * 2) / 12; i < 12; i += 1) {
      const a = -half + i * width;
      lifted.add([a, DECK - 0.62, z], [a + width / 2, DECK, z], 0.07);
      lifted.add([a + width / 2, DECK, z], [a + width, DECK - 0.62, z], 0.07);
    }
  }
  span.add(lifted.mesh(steel), glow(spanLamps, palette.lamp, 1.1));

  const cableShape = new BoxGeometry(0.045, 1, 0.045).translate(0, -0.5, 0);
  const cables = [-1, 1].flatMap((side) =>
    [-HALF, HALF].map((z) => {
      const cable = new Mesh(cableShape, stone);
      cable.position.set(side * (half - 0.15), TOP, z);
      return cable;
    }),
  );

  const crown = [-1, 1].flatMap((side) => [-HALF - 0.35, HALF + 0.35].flatMap((z) => [side * TOWER_X, TOP + 0.85, z]));

  // Kerlip kota jauh dan bintang; deret irasional memberi sebaran yang sama di setiap muat.
  const town: number[] = [];
  for (let i = 1; i <= 260; i += 1) {
    const wave = (step: number) => (i * step) % 1;
    town.push((wave(0.618034) - 0.5) * 220, 0.25 + wave(0.754878) ** 3 * 3, -45 - wave(0.569841) * 50);
  }
  const stars: number[] = [];
  for (let i = 0; i < 300; i += 1) {
    const angle = i * 2.39996;
    const height = 0.14 + ((i * 0.754878) % 1) * 0.86;
    const ring = Math.sqrt(1 - height * height) * 280;
    stars.push(Math.cos(angle) * ring, height * 280, Math.sin(angle) * ring);
  }
  const starPoints = glow(stars, palette.star, 2.4);
  const starMaterial = starPoints.material as PointsMaterial;
  starMaterial.fog = false;

  // Dana contoh: balok cahaya yang menumpang di lantai jembatan.
  const tokenSolid = new MeshBasicMaterial({ color: palette.lamp, transparent: true });
  const halo = new SpriteMaterial({ map: texture, color: palette.lamp, transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending });
  const token = new Group();
  const haloSprite = new Sprite(halo);
  haloSprite.scale.setScalar(4.6);
  token.add(new Mesh(new BoxGeometry(1.15, 0.5, 0.75), tokenSolid), haloSprite);

  scene.add(
    dome, starPoints, river, ambient, key, span, token, ...cables,
    fixed.mesh(steel), piers.mesh(stone),
    glow(sideLamps, palette.lamp, 1.1), glow(crown, palette.lamp, 2.4), glow(town, palette.lamp, 1.2),
  );

  let width = 1;
  let height = 1;
  let current = still ? Math.round(read()) : read();
  let frame = 0;
  let previous = 0;
  let visible = true;
  const pointer = { x: 0, y: 0 };
  const sway = { x: 0, y: 0 };
  const eye = new Vector3();
  const look = new Vector3();
  const started = performance.now();

  const draw = (time: number) => {
    const pose = poseAt(current);
    const portrait = width < height;
    // Layar tegak: kamera mundur agar kedua menara tetap masuk.
    const back = portrait ? 1 + (height / width - 1) * 0.62 : 1;
    look.set(...pose.look);
    eye.set(...pose.eye).sub(look).multiplyScalar(back).add(look);
    // Masuk pertama kali mendekat perlahan, lalu kamera bernapas dan mengikuti pointer.
    const intro = still ? 0 : 1 - smooth(time / 2600);
    eye.x += sway.x * 3 + (still ? 0 : Math.sin(time / 5200) * 0.5);
    eye.y += -sway.y * 1.4 + intro * 3;
    eye.z += intro * 14;
    camera.position.copy(eye);
    camera.lookAt(look);
    // Di pembuka layar tegak, jembatan naik lebih tinggi karena teksnya paling panjang.
    const [shiftX, shiftY] = portrait ? [0, 0.17 + 0.09 * (1 - clamp01(current))] : pose.shift;
    camera.setViewOffset(width, height, -shiftX * width, shiftY * height, width, height);

    const distance = eye.distanceTo(look);
    fog.near = distance + 12;
    fog.far = distance + 105;
    sky.uTop.value.copy(palette.top[0]).lerp(palette.top[1], pose.night).lerp(palette.top[2], pose.dawn);
    sky.uHorizon.value.copy(palette.horizon[0]).lerp(palette.horizon[1], pose.night).lerp(palette.horizon[2], pose.dawn);
    fog.color.copy(sky.uHorizon.value);
    sky.uSun.value.copy(palette.sun).multiplyScalar(1 - pose.night * 0.85);
    starMaterial.opacity = pose.night * (1 - pose.dawn);
    steel.emissiveIntensity = 0.1 + pose.night * 0.22;
    key.intensity = 1.2 + (1 - pose.night) * 1.6;

    span.position.y = pose.lift * LIFT;
    for (const cable of cables) cable.scale.y = TOP - DECK - pose.lift * LIFT - 0.1;
    const bob = still ? 0 : Math.sin(time / 600) * 0.07;
    token.position.set(pose.token, DECK + 0.75 + pose.lift * LIFT + bob, 0);
    tokenSolid.opacity = halo.opacity = pose.tokenAlpha;
    water.uTime.value = still ? 0 : time / 1000;

    renderer.render(scene, camera);
  };

  const loop = (now: number) => {
    const step = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    // Mengejar posisi scroll dengan redaman agar gerak tetap halus saat roda mouse melompat.
    const follow = 1 - Math.exp(-step * 5);
    current += (read() - current) * follow;
    sway.x += (pointer.x - sway.x) * follow * 0.6;
    sway.y += (pointer.y - sway.y) * follow * 0.6;
    draw(now - started);
    frame = visible ? requestAnimationFrame(loop) : 0;
  };

  const resize = () => {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const ratio = renderer.getPixelRatio() * 0.5;
    river.getRenderTarget().setSize(width * ratio, height * ratio);
    if (still) draw(0);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  // Loop berhenti saat scene di luar layar.
  const inView = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    if (visible && !frame && !still) {
      previous = performance.now();
      frame = requestAnimationFrame(loop);
    }
  });
  inView.observe(host);

  const onScroll = () => {
    const next = Math.round(read());
    if (next === current) return;
    current = next;
    draw(0);
  };
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  };
  if (still) window.addEventListener('scroll', onScroll, { passive: true });
  else window.addEventListener('pointermove', onPointer, { passive: true });

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    inView.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pointermove', onPointer);
    scene.traverse((node) => {
      const item = node as Partial<Mesh>;
      item.geometry?.dispose();
      for (const material of [item.material ?? []].flat()) material.dispose();
      if (node instanceof InstancedMesh) node.dispose();
    });
    texture.dispose();
    river.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
