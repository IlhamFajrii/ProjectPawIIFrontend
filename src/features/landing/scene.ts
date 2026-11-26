// Scene Jembatan Ampera di atas Musi: kamera, langit, sungai, dan dana contoh. Model ada di ampera.ts.
// Posisi scroll cerita (0 = pembuka, 1 sampai 5 = tahap Rekber) menggerakkan kamera, bentang, dana, dan langit.
// Warna dibaca dari token CSS `--scene-*`.
import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
  type Texture,
} from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createAmpera, DECK, glowPoints, LIFT, PALETTE_NAMES, type AmperaPalette } from './ampera';

type Point = [number, number, number];

// Satu baris per posisi cerita. `shift` menggeser jembatan di layar lebar agar tidak tertimpa teks.
const KEYS: { eye: Point; look: Point; shift: [number, number]; lift: number; token: number; night: number; dawn: number }[] = [
  { eye: [-37, 5.5, 38], look: [0, 6.2, 0], shift: [0, 0.14], lift: 0, token: -11, night: 0.45, dawn: 0 },
  { eye: [-39, 9, 25], look: [-5, 5.2, 0], shift: [0.18, 0], lift: 0, token: -10.5, night: 0.6, dawn: 0 },
  { eye: [-32, 8, 36], look: [0, 7.4, 0], shift: [0.18, 0], lift: 1, token: 0, night: 0.9, dawn: 0 },
  { eye: [33, 11, 32], look: [0, 6.6, 0], shift: [0.18, 0], lift: 1, token: 0, night: 1, dawn: 0 },
  { eye: [-34, 2.4, 36], look: [0, 6.8, 0], shift: [0.18, 0.02], lift: 1, token: 0, night: 0.85, dawn: 0 },
  { eye: [34, 9, 38], look: [2.5, 5.6, 0], shift: [0.16, 0], lift: 0, token: 11, night: 0, dawn: 1 },
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

/** Bintik cahaya lembut untuk lampu, bintang, dan dana. */
function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    context.scale(2, 2);
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
    // z = w: langit selalu paling jauh, di belakang air sampai cakrawala.
    gl_Position = (projectionMatrix * modelViewMatrix * vec4(position, 1.0)).xyww;
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
        vec2 offset = bend + vec2(0.0, float(i) * 0.0045 * near);
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

const MAX_PIXELS = 8_300_000; // setara layar 4K

/**
 * Kerapatan render. Layar biasa digambar 1,5x lalu diperkecil browser, sehingga kabel dan pagar tipis tidak bergerigi.
 * Layar rapat (ponsel) sampai 2x. Total piksel tidak pernah melebihi 4K.
 */
export function sharpRatio(device: number, width: number, height: number) {
  const wanted = Math.min(2, Math.max(1.5, device));
  return Math.max(1, Math.min(wanted, Math.sqrt(MAX_PIXELS / (width * height))));
}

/**
 * Pembatas frame. `null` berarti lewati frame ini. Sisa waktu dibawa ke frame berikutnya,
 * sehingga rata-ratanya tetap `fps` di layar 60, 90, 120, maupun 165 Hz.
 */
export function nextDraw(now: number, last: number, fps: number) {
  const interval = 1000 / fps;
  const elapsed = now - last;
  // Toleransi 1 ms untuk jadwal rAF yang tidak persis.
  if (elapsed < interval - 1) return null;
  return elapsed > interval ? now - (elapsed % interval) : now;
}

/** Memasang scene di dalam `host`. Melempar error bila WebGL tidak tersedia. */
export function createRiverScene(host: HTMLElement, { still, read }: Options) {
  const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  host.append(renderer.domElement);

  const styles = getComputedStyle(host);
  const color = (name: string) => new Color(styles.getPropertyValue(`--scene-${name}`).trim());
  const palette = {
    top: [color('dusk-top'), color('night-top'), color('dawn-top')] as const,
    horizon: [color('dusk-horizon'), color('night-horizon'), color('dawn-horizon')] as const,
    sun: color('sun'),
    water: [color('water-dusk'), color('water'), color('water-dawn')] as const,
    lamp: color('lamp'),
    star: color('star'),
    ampera: Object.fromEntries(PALETTE_NAMES.map((name) => [name, color(name)])) as AmperaPalette,
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

  dome.renderOrder = 1;

  const river = new Reflector(new PlaneGeometry(700, 700), { clipBias: 0.003, multisample: 0, shader: WATER });
  river.rotation.x = -Math.PI / 2;
  const water = (river.material as ShaderMaterial).uniforms as unknown as {
    color: { value: Color };
    uTime: { value: number };
    uHorizon: { value: Color };
  };
  water.color.value = palette.water[0].clone();
  water.uHorizon.value = sky.uHorizon.value;

  const ambient = new HemisphereLight(palette.horizon[2], palette.water[1], 1.5);
  const key = new DirectionalLight(palette.sun, 2);
  key.position.set(-10, 9, 14);

  const texture = glowTexture();
  const ampera = createAmpera(palette.ampera, texture);

  // Bintang; deret irasional memberi sebaran yang sama di setiap muat.
  const stars: number[] = [];
  for (let i = 0; i < 300; i += 1) {
    const angle = i * 2.39996;
    const height = 0.14 + ((i * 0.754878) % 1) * 0.86;
    const ring = Math.sqrt(1 - height * height) * 280;
    stars.push(Math.cos(angle) * ring, height * 280, Math.sin(angle) * ring);
  }
  const starPoints = glowPoints(stars, palette.star, 2.4, texture);
  const starMaterial = starPoints.material as PointsMaterial;
  starMaterial.fog = false;

  // Dana contoh: balok cahaya yang menumpang di lantai jembatan.
  const tokenSolid = new MeshBasicMaterial({ color: palette.lamp, transparent: true });
  const halo = new SpriteMaterial({ map: texture, color: palette.lamp, transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending });
  const token = new Group();
  const haloSprite = new Sprite(halo);
  haloSprite.scale.setScalar(5.2);
  token.add(new Mesh(new BoxGeometry(1.4, 0.6, 0.9), tokenSolid), haloSprite);

  scene.add(dome, starPoints, river, ambient, key, ampera.group, token);

  // Pantulan merender ulang scene, jadi benda tipis dilewati di sana.
  const reflect = river.onBeforeRender;
  river.onBeforeRender = (...args) => {
    for (const item of ampera.details) item.visible = false;
    reflect.apply(river, args);
    for (const item of ampera.details) item.visible = true;
  };

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
  let ceiling = Infinity;
  let sampled = 0;
  let spent = 0;
  let drawn = 0;
  let rendered = 0;

  const draw = (time: number) => {
    const pose = poseAt(current);
    const portrait = width < height;
    // Layar tegak: kamera mundur agar kedua menara tetap masuk.
    const back = portrait ? 1 + (height / width - 1) * 0.6 : 1;
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
    fog.near = distance + 14;
    fog.far = distance + 125;
    sky.uTop.value.copy(palette.top[0]).lerp(palette.top[1], pose.night).lerp(palette.top[2], pose.dawn);
    sky.uHorizon.value.copy(palette.horizon[0]).lerp(palette.horizon[1], pose.night).lerp(palette.horizon[2], pose.dawn);
    fog.color.copy(sky.uHorizon.value);
    sky.uSun.value.copy(palette.sun).multiplyScalar(1 - pose.night * 0.85);
    starMaterial.opacity = pose.night * (1 - pose.dawn);
    key.intensity = 0.7 + (1 - pose.night) * 2;
    ambient.intensity = 0.9 + (1 - pose.night) * 1.1;
    water.color.value.copy(palette.water[0]).lerp(palette.water[1], pose.night).lerp(palette.water[2], pose.dawn);
    ampera.update({ lift: pose.lift, night: pose.night * (1 - pose.dawn), time, still });
    const bob = still ? 0 : Math.sin(time / 600) * 0.07;
    token.position.set(pose.token, DECK + 0.75 + pose.lift * LIFT + bob, 0);
    tokenSolid.opacity = halo.opacity = pose.tokenAlpha;
    water.uTime.value = still ? 0 : time / 1000;

    renderer.render(scene, camera);
  };

  const loop = (now: number) => {
    frame = visible ? requestAnimationFrame(loop) : 0;
    const gap = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    // Setelah pemanasan, rata-rata di bawah sekitar 30 fps menurunkan resolusi satu tingkat.
    if (now - started > 4000) {
      spent += gap;
      sampled += 1;
      if (sampled === 90) {
        if (spent / sampled > 0.034 && renderer.getPixelRatio() > 1) {
          ceiling = Math.max(1, renderer.getPixelRatio() - 0.25);
          resize();
        }
        sampled = spent = 0;
      }
    }
    // 60 fps saat ada yang bergerak karena pengguna, 30 fps saat hanya air dan kereta yang bergerak.
    const target = read();
    const moving =
      now - started < 2800 ||
      Math.abs(target - current) > 0.002 ||
      Math.abs(pointer.x - sway.x) + Math.abs(pointer.y - sway.y) > 0.01;
    const due = nextDraw(now, drawn, moving ? 60 : 30);
    if (due === null) return;
    drawn = due;
    const step = Math.min(0.05, (now - rendered) / 1000);
    rendered = now;
    // Mengejar posisi scroll dengan redaman agar gerak tetap halus saat roda mouse melompat.
    const follow = 1 - Math.exp(-step * 5);
    current += (target - current) * follow;
    sway.x += (pointer.x - sway.x) * follow * 0.6;
    sway.y += (pointer.y - sway.y) * follow * 0.6;
    draw(now - started);
  };

  const resize = () => {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(ceiling, sharpRatio(window.devicePixelRatio, width, height)));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const ratio = renderer.getPixelRatio() * 0.6;
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
      for (const material of [item.material ?? []].flat()) {
        const maps = material as { map?: Texture | null; emissiveMap?: Texture | null };
        maps.map?.dispose();
        maps.emissiveMap?.dispose();
        material.dispose();
      }
      if (node instanceof InstancedMesh) node.dispose();
    });
    texture.dispose();
    river.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
