'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import {
  PHONE_CASE_SPECS,
  DEFAULT_SPEC,
  type LensSpec,
  type GlyphLine,
  type CameraShape,
} from '@/data/phoneCaseSpecs3D';

// ─────────────────────────────────────────────────────────────────────────────
// PHONE CASE 3D — Declarative per-model geometry
//
// Each phone brand has a distinct camera module style:
//   square-island    → Apple iPhone (raised rounded-square platform)
//   horizontal-bar   → Google Pixel (wide pill spanning ~84% of width)
//   column           → Samsung (no platform — individual floating lens rings)
//   circular-island  → OnePlus Hasselblad (large circle housing)
//   square-with-glyphs → Nothing Phone (square platform + LED glyph lines)
//
// Spec coordinates are all FRACTIONS (0–1) of the case dimensions.
// THREE world origin = centre of case back face.
// ─────────────────────────────────────────────────────────────────────────────

// ── Build a rounded-rectangle THREE.Shape ─────────────────────────────────────
function roundedRect(x: number, y: number, w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// ── Convert spec fraction coordinates to THREE world coords ───────────────────
function toWorld(fracX: number, fracY: number, caseW: number, caseH: number) {
  return {
    x: (fracX - 0.5) * caseW,
    y: (0.5 - fracY) * caseH, // flip Y
  };
}
function toWorldR(fracR: number, caseW: number) {
  return fracR * caseW;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lens — shared by all module types
// ─────────────────────────────────────────────────────────────────────────────
function Lens({ spec, caseW, caseH, z }: { spec: LensSpec; caseW: number; caseH: number; z: number }) {
  const { x, y } = toWorld(spec.x, spec.y, caseW, caseH);
  const r = toWorldR(spec.r, caseW);

  return (
    <group>
      {/* Outer ring */}
      <mesh position={[x, y, z]}>
        <cylinderGeometry args={[r, r, 0.012, 32, 1, false]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Dark glass */}
      <mesh position={[x, y, z + 0.007]}>
        <cylinderGeometry args={[r * 0.80, r * 0.80, 0.010, 32, 1, false]} />
        <meshStandardMaterial color="#050505" roughness={0.04} metalness={0.1} envMapIntensity={2.5} />
      </mesh>
      {/* Inner glass shimmer */}
      <mesh position={[x, y, z + 0.013]}>
        <cylinderGeometry args={[r * 0.52, r * 0.52, 0.006, 28, 1, false]} />
        <meshStandardMaterial color="#0a0a14" roughness={0.02} metalness={0.0} envMapIntensity={3} />
      </mesh>
      {/* Specular glint */}
      <mesh position={[x - r * 0.30, y + r * 0.30, z + 0.018]}>
        <sphereGeometry args={[r * 0.11, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0} metalness={0} emissive="#ffffff" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CamModule — renders the right geometry per camera shape
// ─────────────────────────────────────────────────────────────────────────────
interface CamModuleProps {
  shape: CameraShape;
  // All in world units
  modX: number; modY: number;
  modW: number; modH: number;
  lenses: LensSpec[];
  glyphs?: GlyphLine[];
  caseW: number;
  caseH: number;
  caseColor: string;
  rough: number;
  metal: number;
}

function CamModule({ shape, modX, modY, modW, modH, lenses, glyphs, caseW, caseH, caseColor, rough, metal }: CamModuleProps) {
  const platformZ  = 0.004;  // slightly above back face
  const platformD  = 0.008;  // thin raised platform
  const lensBaseZ  = platformZ + platformD * 0.5;

  const islandColor = '#1a1a1a';
  const islandRough = 0.25;
  const islandMetal = 0.55;

  return (
    <group>

      {/* ── Platform geometry ─────────────────────────────────────────────── */}

      {(shape === 'square-island' || shape === 'square-with-glyphs') && (
        /* Rounded square island */
        <mesh position={[modX, modY, platformZ]}>
          <boxGeometry args={[modW * 1.02, modH * 1.02, platformD]} />
          <meshStandardMaterial color={islandColor} roughness={islandRough} metalness={islandMetal} />
        </mesh>
      )}

      {shape === 'horizontal-bar' && (
        /* Wide pill — use a rounded rect extruded very thin */
        <mesh position={[modX, modY, platformZ]}>
          <boxGeometry args={[modW, modH, platformD]} />
          <meshStandardMaterial color={islandColor} roughness={islandRough} metalness={islandMetal} />
        </mesh>
      )}

      {shape === 'circular-island' && (
        /* Large circle housing */
        <group position={[modX, modY, platformZ]}>
          {/* Main disk */}
          <mesh>
            <cylinderGeometry args={[modW * 0.50, modW * 0.50, platformD, 48, 1, false]} />
            <meshStandardMaterial color={islandColor} roughness={islandRough} metalness={islandMetal} />
          </mesh>
          {/* Outer decorative ring */}
          <mesh position={[0, 0, platformD * 0.4]}>
            <torusGeometry args={[modW * 0.50, modW * 0.025, 8, 48]} />
            <meshStandardMaterial color="#444444" roughness={0.2} metalness={0.7} />
          </mesh>
          {/* Hasselblad branding circle (inner ring) */}
          <mesh position={[0, 0, platformD * 0.6]}>
            <torusGeometry args={[modW * 0.38, modW * 0.012, 6, 40]} />
            <meshStandardMaterial color="#ffcc00" roughness={0.3} metalness={0.6} />
          </mesh>
        </group>
      )}

      {/* column — Samsung: NO platform, lenses float directly on back face */}

      {/* ── Lenses ────────────────────────────────────────────────────────── */}
      {lenses.map((l, i) => (
        <Lens key={i} spec={l} caseW={caseW} caseH={caseH} z={lensBaseZ} />
      ))}

      {/* ── Nothing Phone LED glyph lines ─────────────────────────────────── */}
      {shape === 'square-with-glyphs' && glyphs && glyphs.map((g, i) => {
        const x1 = (g.x1 - 0.5) * caseW, y1 = (0.5 - g.y1) * caseH;
        const x2 = (g.x2 - 0.5) * caseW, y2 = (0.5 - g.y2) * caseH;
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const w = g.w * caseW;
        return (
          <mesh key={i} position={[cx, cy, platformZ + 0.006]} rotation={[0, 0, angle]}>
            <boxGeometry args={[len, w, 0.004]} />
            <meshStandardMaterial color="#cccccc" roughness={0.1} metalness={0.2} emissive="#888888" emissiveIntensity={0.3} />
          </mesh>
        );
      })}

    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CaseMesh — the full phone case assembly
// ─────────────────────────────────────────────────────────────────────────────
interface CaseMeshProps {
  designDataUrl: string | null;
  materialType: string;
  modelId: string;
  caseW: number;
  caseH: number;
  caseD: number;
}

function CaseMesh({ designDataUrl, materialType, modelId, caseW, caseH, caseD }: CaseMeshProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [designTex, setDesignTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!designDataUrl) return;
    const tex = new THREE.TextureLoader().load(designDataUrl);
    if ('SRGBColorSpace' in THREE) (tex as any).colorSpace = (THREE as any).SRGBColorSpace;
    tex.needsUpdate = true;
    setDesignTex(tex);
    return () => tex.dispose();
  }, [designDataUrl]);

  // Gentle idle rotation
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.28) * 0.35 + 0.15;
    groupRef.current.rotation.x = -0.08 + Math.sin(clock.elapsedTime * 0.14) * 0.04;
  });

  // Material props per finish type
  const rough  = materialType === 'glossy'  ? 0.04 :
                 materialType === 'silicone' ? 0.88 :
                 materialType === 'leather'  ? 0.72 : 0.58;
  const metal  = materialType === 'glossy'  ? 0.04 :
                 materialType === 'leather'  ? 0.08 : 0.0;
  const envInt = materialType === 'glossy'  ? 1.8  :
                 materialType === 'silicone' ? 0.5  : 1.1;
  const caseColor = materialType === 'leather'  ? '#c8b89a' :
                    materialType === 'silicone' ? '#d4d4d4' : '#e8e4e0';

  // ── Side wall (extruded border — the lip/tray of the case) ───────────────
  const wallT = 0.07;
  const cornerR = 0.16;
  const outer = roundedRect(-caseW / 2, -caseH / 2, caseW, caseH, cornerR);
  const inner = roundedRect(-caseW / 2 + wallT, -caseH / 2 + wallT, caseW - wallT * 2, caseH - wallT * 2, cornerR - 0.04);
  outer.holes.push(inner);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: caseD,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 3,
  };

  // ── Back face shape ───────────────────────────────────────────────────────
  const backShape = roundedRect(-caseW / 2, -caseH / 2, caseW, caseH, cornerR);

  // ── Camera module spec ────────────────────────────────────────────────────
  const spec = PHONE_CASE_SPECS[modelId] ?? DEFAULT_SPEC;
  const cam = spec.camera;
  const modCenter = toWorld(cam.cx, cam.cy, caseW, caseH);
  const modW = cam.width  * caseW;
  const modH = cam.height * caseH;

  return (
    <group ref={groupRef}>

      {/* Back face — carries the design texture */}
      <mesh position={[0, 0, 0]}>
        <shapeGeometry args={[backShape]} />
        <meshStandardMaterial
          map={designTex ?? null}
          color={designTex ? '#ffffff' : caseColor}
          roughness={rough}
          metalness={metal}
          envMapIntensity={envInt}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Side walls — the extruded border/lip */}
      <mesh position={[0, 0, 0]}>
        <extrudeGeometry args={[outer, extrudeSettings]} />
        <meshStandardMaterial
          color={caseColor}
          roughness={rough * 1.1}
          metalness={metal * 0.5}
          envMapIntensity={envInt * 0.7}
        />
      </mesh>

      {/* Camera module (shape + lenses) */}
      <CamModule
        shape={cam.shape}
        modX={modCenter.x}
        modY={modCenter.y}
        modW={modW}
        modH={modH}
        lenses={cam.lenses}
        glyphs={spec.glyphs}
        caseW={caseW}
        caseH={caseH}
        caseColor={caseColor}
        rough={rough}
        metal={metal}
      />

      {/* Side power button (right) */}
      <mesh position={[caseW / 2 + wallT * 0.5, caseH * 0.08, caseD * 0.6]}>
        <boxGeometry args={[wallT, caseH * 0.09, caseD * 0.45]} />
        <meshStandardMaterial color="#c8c4c0" roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Volume buttons (left) */}
      <mesh position={[-caseW / 2 - wallT * 0.5, caseH * 0.12, caseD * 0.6]}>
        <boxGeometry args={[wallT, caseH * 0.07, caseD * 0.45]} />
        <meshStandardMaterial color="#c8c4c0" roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[-caseW / 2 - wallT * 0.5, caseH * 0.03, caseD * 0.6]}>
        <boxGeometry args={[wallT, caseH * 0.07, caseD * 0.45]} />
        <meshStandardMaterial color="#c8c4c0" roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Charging port cutout hint (bottom) */}
      <mesh position={[0, -caseH / 2 + wallT * 0.4, caseD * 0.5]}>
        <boxGeometry args={[caseW * 0.24, wallT * 0.8, caseD * 0.5]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.3} />
      </mesh>

    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene
// ─────────────────────────────────────────────────────────────────────────────
interface SceneProps {
  designDataUrl: string | null;
  materialType: string;
  modelId: string;
  canvasWidth: number;
  canvasHeight: number;
}

function Scene({ designDataUrl, materialType, modelId, canvasWidth, canvasHeight }: SceneProps) {
  const aspect = canvasWidth / canvasHeight;
  const caseH  = 3.8;
  const caseW  = caseH * aspect;
  const caseD  = 0.07;

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[2.5, 5, 4]}   intensity={1.3} castShadow />
      <directionalLight position={[-3,  2, -1]}   intensity={0.3} />
      <directionalLight position={[0,  -3,  3]}   intensity={0.25} color="#e0d8ff" />
      <Environment preset="studio" />
      <CaseMesh
        designDataUrl={designDataUrl}
        materialType={materialType}
        modelId={modelId}
        caseW={caseW}
        caseH={caseH}
        caseD={caseD}
      />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.82}
        minDistance={4}
        maxDistance={10}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public export
// ─────────────────────────────────────────────────────────────────────────────
interface PhoneCase3DProps {
  designDataUrl: string | null;
  materialType?: string;
  modelId?: string;
  canvasWidth: number;
  canvasHeight: number;
}

export default function PhoneCase3D({
  designDataUrl,
  materialType = 'plastic-matt',
  modelId = 'generic',
  canvasWidth,
  canvasHeight,
}: PhoneCase3DProps) {
  return (
    <Canvas
      camera={{ position: [0.4, 0, 6.5], fov: 36 }}
      style={{ width: '100%', height: '100%' }}
      shadows
      gl={{ antialias: true, alpha: true }}
    >
      <Scene
        designDataUrl={designDataUrl}
        materialType={materialType}
        modelId={modelId}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />
    </Canvas>
  );
}
