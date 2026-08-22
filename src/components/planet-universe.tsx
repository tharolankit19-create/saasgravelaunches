"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { Loader2, X, Globe, Trophy } from "lucide-react";
import {
  BODIES,
  bodyById,
  requiredDollars,
  dollars,
  type Body,
  type Owner,
} from "@/lib/planets";
import { trackEvent } from "@/lib/track-client";

/**
 * The whole game in one client island: a 3D solar system you can spin and
 * zoom, every body a slot a SaaS can own. Click a body to open the claim
 * panel; owned bodies wear their owner's logo and name in space. A live
 * leaderboard sits on the left.
 */
export function PlanetUniverse({ owners }: { owners: Record<string, Owner> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const body = selected ? bodyById(selected) : null;
  const owner = selected ? owners[selected] : undefined;

  const ranked = Object.values(owners).sort((a, b) => b.amount_cents - a.amount_cents);

  return (
    <div className="relative h-[calc(100vh-3.5rem)] min-h-[560px] w-full overflow-hidden bg-[#05060e]">
      <Canvas camera={{ position: [0, 16, 32], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={["#05060e"]} />
        <fog attach="fog" args={["#05060e", 45, 90]} />
        <ambientLight intensity={0.35} />
        <hemisphereLight args={["#8fa8ff", "#0a0a16", 0.5]} />
        <pointLight position={[0, 0, 0]} intensity={4} distance={0} decay={0} color="#ffd9a0" />
        <Stars radius={130} depth={70} count={5000} factor={4.5} saturation={0} fade speed={0.5} />

        {/* faint orbit rings */}
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
            onSelect={setSelected}
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

      {/* hint */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
          Drag to orbit · scroll to zoom · click a body to claim it
        </p>
      </div>

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
      {/* the body */}
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

      {/* atmosphere / glossy rim glow */}
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

      {/* sun corona */}
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

      {/* selection / ownership halo */}
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

      {/* Saturn/Uranus-style ring */}
      {body.ring && (
        <mesh rotation={[Math.PI / 2.3, 0, 0.3]}>
          <ringGeometry args={[body.radius * 1.55, body.radius * 2.3, 80]} />
          <meshBasicMaterial color="#e4d3a6" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* owner label floating above the body */}
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

function ClaimPanel({ body, owner, onClose }: { body: Body; owner?: Owner; onClose: () => void }) {
  const need = requiredDollars(body, owner?.amount_cents ?? null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(need);
  const [tagline, setTagline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = amount >= 500 ? 50 : amount >= 100 ? 10 : amount >= 20 ? 5 : 1;

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) return setError("Add your product URL.");
    if (amount < need) return setError(`${body.name} needs at least $${need}.`);

    setBusy(true);
    trackEvent("planet_claim_start", { meta: { planet: body.id, amount } });
    try {
      const res = await fetch("/api/planet-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planetId: body.id, url, productName: name, amount, tagline }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="absolute inset-x-3 bottom-3 z-10 mx-auto max-w-md rounded-2xl border border-white/12 bg-[#0c0e1ae6] p-5 text-white shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:w-[360px]">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 text-white/50 transition hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2">
        <span
          className="h-5 w-5 rounded-full"
          style={{ background: body.color, boxShadow: `0 0 14px ${body.color}` }}
        />
        <h2 className="font-serif text-xl font-semibold">{body.name}</h2>
        <span className="rounded-full border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-white/60">
          {body.kind}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{body.blurb}</p>

      {owner ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#7dd3a0]/25 bg-[#7dd3a0]/10 px-3 py-2 text-[12px]">
          {owner.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={owner.logo_url} alt="" className="h-4 w-4 rounded-sm" />
          )}
          <span className="text-white/80">
            Held by <span className="font-semibold text-white">{owner.product_name}</span> for{" "}
            {dollars(owner.amount_cents)}
          </span>
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-white/70">
          Unclaimed · floor <span className="font-semibold text-white">${body.minDollars}</span>
        </p>
      )}

      <form onSubmit={claim} className="mt-4 space-y-3">
        <div className="relative">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourproduct.com"
            className="h-11 w-full rounded-lg border border-white/15 bg-white/5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-ember-500/70"
          />
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Product name (optional)"
          className="h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-ember-500/70"
        />

        {/* amount stepper */}
        <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-3 py-2">
          <span className="text-[12px] text-white/60">Your bid</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAmount((a) => Math.max(need, a - step))}
              className="h-7 w-7 rounded-full border border-white/20 text-white/80 transition hover:border-ember-500"
            >
              –
            </button>
            <span className="min-w-[4ch] text-center text-lg font-bold tabular-nums">${amount}</span>
            <button
              type="button"
              onClick={() => setAmount((a) => a + step)}
              className="h-7 w-7 rounded-full border border-white/20 text-white/80 transition hover:border-ember-500"
            >
              +
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] text-white/45">
          {owner
            ? `Seize ${body.name} for $${need} — that's 1.5× the current ${dollars(owner.amount_cents)}.`
            : `Floor is $${body.minDollars}. Bid more to make it costlier to steal.`}
        </p>

        {error && <p className="text-center text-[12px] text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-ember-500 text-[15px] font-semibold text-white transition hover:bg-ember-600 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {owner ? "Seize" : "Claim"} {body.name} · ${amount}
        </button>
        <p className="text-center text-[10px] text-white/40">
          Pay once. Your logo lands on {body.name} until someone outbids you. No account needed.
        </p>
      </form>
    </div>
  );
}
