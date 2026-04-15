'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Build a rounded-rectangle shape for the case back face (ExtrudeGeometry)
function buildCaseGeometry(caseW: number, caseH: number, caseD: number, r: number) {
  const shape = new THREE.Shape();
  const x = -caseW / 2, y = -caseH / 2, w = caseW, h = caseH;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: caseD,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 4,
  };
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

// Camera cutout hole on a back face plane (for visual)
function CameraIsland({ caseW, caseH }: { caseW: number; caseH: number }) {
  return (
    <mesh position={[-caseW * 0.25, caseH * 0.35, 0.01]}>
      <boxGeometry args={[caseW * 0.38, caseH * 0.16, 0.02]} />
      <meshStandardMaterial color="#111111" roughness={0.4} metalness={0.3} />
    </mesh>
  );
}

// ─── Case Mesh ────────────────────────────────────────────────────────────────
interface CaseMeshProps {
  designDataUrl: string | null;
  materialType: string;
  caseW: number;
  caseH: number;
  caseD: number;
}

function CaseMesh({ designDataUrl, materialType, caseW, caseH, caseD }: CaseMeshProps) {
  const groupRef  = useRef<THREE.Group>(null!);
  const backRef   = useRef<THREE.Mesh>(null!);
  const [designTex, setDesignTex] = useState<THREE.Texture | null>(null);

  // Load design texture
  useEffect(() => {
    if (!designDataUrl) return;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(designDataUrl);
    // THREE.SRGBColorSpace exists in r152+. Fall back gracefully for older builds.
    if ('SRGBColorSpace' in THREE) {
      tex.colorSpace = (THREE as typeof THREE & { SRGBColorSpace: string }).SRGBColorSpace;
    }
    tex.needsUpdate = true;
    setDesignTex(tex);
    return () => tex.dispose();
  }, [designDataUrl]);

  // Idle sway
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.28 - 0.15;
    groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.18) * 0.05;
  });

  const roughness        = materialType === 'glossy'   ? 0.05 : materialType === 'silicone' ? 0.85 : materialType === 'leather'  ? 0.72 : 0.55;
  const metalness        = materialType === 'glossy'   ? 0.02 : materialType === 'leather'  ? 0.06 : 0.0;
  const envMapIntensity  = materialType === 'glossy'   ? 1.8  : materialType === 'silicone' ? 0.5  : 1.0;
  const frameColor       = materialType === 'leather'  ? '#2a1a0e' : '#1a1a1a';

  return (
    <group ref={groupRef}>
      {/* ── Case body (frame + sides) ── */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[caseW, caseH, caseD]} />
        <meshStandardMaterial
          color={frameColor}
          roughness={roughness * 1.1}
          metalness={metalness}
          envMapIntensity={envMapIntensity * 0.5}
        />
      </mesh>

      {/* ── Back face flat plane with design texture ── */}
      <mesh ref={backRef} position={[0, 0, caseD / 2 + 0.002]}>
        <planeGeometry args={[caseW - 0.06, caseH - 0.06]} />
        <meshStandardMaterial
          map={designTex ?? null}
          color={designTex ? '#ffffff' : '#e8e8e8'}
          roughness={roughness}
          metalness={metalness}
          envMapIntensity={envMapIntensity}
        />
      </mesh>

      {/* ── Camera island ── */}
      <CameraIsland caseW={caseW} caseH={caseH} />

      {/* ── Side buttons (right) ── */}
      <mesh position={[caseW / 2 + 0.025, caseH * 0.1, 0]}>
        <boxGeometry args={[0.05, caseH * 0.12, caseD * 0.6]} />
        <meshStandardMaterial color="#333" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* ── Volume buttons (left) ── */}
      <mesh position={[-caseW / 2 - 0.025, caseH * 0.15, 0]}>
        <boxGeometry args={[0.05, caseH * 0.08, caseD * 0.6]} />
        <meshStandardMaterial color="#333" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[-caseW / 2 - 0.025, caseH * 0.04, 0]}>
        <boxGeometry args={[0.05, caseH * 0.08, caseD * 0.6]} />
        <meshStandardMaterial color="#333" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
interface SceneProps {
  designDataUrl: string | null;
  materialType: string;
  canvasWidth: number;
  canvasHeight: number;
}

function Scene({ designDataUrl, materialType, canvasWidth, canvasHeight }: SceneProps) {
  const aspect = canvasWidth / canvasHeight;
  const caseH  = 3.6;
  const caseW  = caseH * aspect;
  const caseD  = 0.18;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 6, 4]}  intensity={1.2} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <pointLight position={[0, -4, 4]} intensity={0.4} color="#c4b5fd" />
      <Environment preset="city" />
      <CaseMesh
        designDataUrl={designDataUrl}
        materialType={materialType}
        caseW={caseW}
        caseH={caseH}
        caseD={caseD}
      />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
        minDistance={3.5}
        maxDistance={9}
      />
    </>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────
interface PhoneCase3DProps {
  designDataUrl: string | null;
  materialType?: string;
  canvasWidth: number;
  canvasHeight: number;
}

export default function PhoneCase3D({ designDataUrl, materialType = 'plastic-matt', canvasWidth, canvasHeight }: PhoneCase3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 38 }}
      style={{ width: '100%', height: '100%' }}
      shadows
      gl={{ antialias: true, alpha: true }}
    >
      <Scene
        designDataUrl={designDataUrl}
        materialType={materialType}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />
    </Canvas>
  );
}
