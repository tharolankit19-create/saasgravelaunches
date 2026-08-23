"use client";

import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { Trophy } from "lucide-react";
import { BODIES, bodyById, dollars, type Body, type Owner } from "@/lib/planets";
import { ClaimPanel } from "@/components/planet-claim-panel";
import { PlanetBoard2D } from "@/components/planet-board-2d";

/** Does this browser actually have a usable WebGL context? */
function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/** Catches any crash inside the 3D scene and swaps in the 2D fallback. */
class SceneBoundary extends React.Component<
  { onError: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The game island: a 3D solar system where every body is a slot a SaaS can own.
 * If WebGL is missing or the scene crashes, it falls back to a 2D board so the
 * page always works and people can still claim a body.
 */
export function PlanetUniverse({ owners }: { owners: Record<string, Owner> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<"3d" | "2d">("3d");

  useEffect(() => {
    if (!hasWebGL()) setMode("2d");
  }, []);

  const body = selected ? bodyById(selected) : null;
  const owner = selected ? owners[selected] : undefined;
  const ranked = Object.values(owners).sort((a, b) => b.amount_cents - a.amount_cents);

  return (
    <div className="relative h-[calc(100vh-3.5rem)] min-h-[560px] w-full overflow-hidden bg-[#05060e]">
      {mode === "3d" ? (
        <SceneBoundary onError={() => setMode("2d")}>
          <Scene owners={owners} selected={selected} onSelect={setSelected} />
        </SceneBoundary>
      ) : (
        <PlanetBoard2D owners={owners} onSelect={setSelected} />
      )}

      {/* hint (3D only) */}
      {mode === "3d" && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
            Drag to orbit · scroll to zoom · click a body to claim it
          </p>
        </div>
      )}

      {/* leaderboard */}
      <div className="absolute left-3 top-3 w-[220px] max-w-[60vw] rounded-2xl border border-white/10 bg-[#0b0d18cc] p-3 backdrop-blur-md">
        <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
          <Trophy className="h-3 w-3 text-ember-500" /> Leaderboard
        </p>
        {ranked.length === 0 ? (
          <p className="py-2 text-[12px] leading-relaxed text-white/50">
            No planets claimed yet. Be the first to plant your flag. 🚩
          </p>
        ) : (
          <ol className="space-y-1">
            {ranked.slice(0, 8).map((o, i) => {
              const b = bodyById(o.planet_id);
              return (
                <li key={o.planet_id}>
                  <button
                    onClick={() => setSelected(o.planet_id)}
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left transition hover:bg-white/5"
                  >
                    <span className="w-4 shrink-0 font-mono text-[11px] text-white/40">{i + 1}</span>
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: b?.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-white">
                      {o.product_name}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] font-semibold text-ember-400">
                      {dollars(o.amount_cents)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* claim panel */}
      {body && (
        <ClaimPanel key={body.id} body={body} owner={owner} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function Scene({
  owners,
  selected,
  onSelect,
}: {
  owners: Record<string, Owner>;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Canvas camera={{ position: [0, 16, 32], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={["#05060e"]} />
      <fog attach="fog" args={["#05060e", 45, 90]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#8fa8ff", "#0a0a16", 0.5]} />
      <pointLight position={[0, 0, 0]} intensity={4} distance={0} decay={0} color="#ffd9a0" />
      <Stars radius={130} depth={70} count={5000} factor={4.5} saturation={0} fade speed={0.5} />

      {BODIES.filter((b) => b.orbit > 0).map((b) => (
        <mesh key={`ring-${b.id}`} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[b.orbit - 0.02, b.orbit + 0.02, 160]} />
          <meshBasicMaterial color="#8fa3d0" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {BODIES.map((b) => (
        <BodyMesh
          key={b.id}
          body={b}
          owner={owners[b.id]}
          selected={selected === b.id}
          onSelect={onSelect}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={9}
        maxDistance={64}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.6}
      />
    </Canvas>
  );
}

function BodyMesh({
  body,
  owner,
  selected,
  onSelect,
}: {
  body: Body;
  owner?: Owner;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current && body.orbit > 0) {
      const a = t * body.speed * 0.15 + body.phase;
      group.current.position.x = Math.cos(a) * body.orbit;
      group.current.position.z = Math.sin(a) * body.orbit;
    }
    if (mesh.current) mesh.current.rotation.y += 0.0025;
  });

  const isStar = body.kind === "star";

  return (
    <group ref={group}>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(body.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "auto";
        }}
        scale={hover ? 1.08 : 1}
      >
        <sphereGeometry args={[body.radius, 64, 64]} />
        {isStar ? (
          <meshBasicMaterial color={"#ffdd8a"} />
        ) : (
          <meshPhysicalMaterial
            color={body.color}
            roughness={0.42}
            metalness={0.05}
            clearcoat={0.6}
            clearcoatRoughness={0.35}
            sheen={0.4}
            sheenColor={body.color}
            emissive={body.color}
            emissiveIntensity={owner ? 0.32 : 0.08}
          />
        )}
      </mesh>

      <mesh scale={hover ? 1.08 : 1}>
        <sphereGeometry args={[body.radius * (isStar ? 1.35 : 1.14), 32, 32]} />
        <meshBasicMaterial
          color={isStar ? "#ff9d2f" : body.color}
          transparent
          opacity={isStar ? 0.28 : 0.14}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {isStar && (
        <>
          <mesh>
            <sphereGeometry args={[body.radius * 1.9, 32, 32]} />
            <meshBasicMaterial
              color="#ff8a1e"
              transparent
              opacity={0.12}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
          <pointLight intensity={1.6} distance={50} color="#ffcf8a" />
        </>
      )}

      {(selected || owner) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.radius * 1.3, body.radius * 1.5, 72]} />
          <meshBasicMaterial
            color={selected ? "#f2671e" : "#7dd3a0"}
            transparent
            opacity={selected ? 0.95 : 0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {body.ring && (
        <mesh rotation={[Math.PI / 2.3, 0, 0.3]}>
          <ringGeometry args={[body.radius * 1.55, body.radius * 2.3, 80]} />
          <meshBasicMaterial color="#e4d3a6" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {owner && (
        <Html center distanceFactor={15} position={[0, body.radius + 0.6, 0]} zIndexRange={[10, 0]}>
          <a
            href={owner.url}
            target="_blank"
            rel="noopener nofollow"
            onClick={(e) => e.stopPropagation()}
            className="flex -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-black/70 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm"
          >
            {owner.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={owner.logo_url} alt="" className="h-3.5 w-3.5 rounded-sm" />
            )}
            {owner.product_name}
          </a>
        </Html>
      )}
    </group>
  );
}
