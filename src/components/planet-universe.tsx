"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { Loader2, X, Globe } from "lucide-react";
import {
  BODIES,
  bodyById,
  requiredDollars,
  dollars,
  type Body,
  type Owner,
} from "@/lib/planets";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/track-client";

/**
 * The whole game in one client island: a 3D solar system you can spin and
 * zoom, every body a slot a SaaS can own. Click a body to open the claim
 * panel; owned bodies wear their owner's logo and name in space.
 */
export function PlanetUniverse({ owners }: { owners: Record<string, Owner> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const body = selected ? bodyById(selected) : null;
  const owner = selected ? owners[selected] : undefined;

  return (
    <div className="relative h-[calc(100vh-4rem)] min-h-[560px] w-full overflow-hidden bg-[#05060e]">
      <Canvas camera={{ position: [0, 15, 30], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={["#05060e"]} />
        <ambientLight intensity={0.28} />
        <pointLight position={[0, 0, 0]} intensity={3} distance={0} decay={0} color="#ffd9a0" />
        <Stars radius={120} depth={60} count={4000} factor={4} saturation={0} fade speed={0.6} />

        {/* faint orbit rings */}
        {BODIES.filter((b) => b.orbit > 0).map((b) => (
          <mesh key={`ring-${b.id}`} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[b.orbit - 0.015, b.orbit + 0.015, 128]} />
            <meshBasicMaterial color="#8fa3d0" transparent opacity={0.1} side={THREE.DoubleSide} />
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
          minDistance={8}
          maxDistance={60}
          autoRotate
          autoRotateSpeed={0.35}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Canvas>

      {/* hint */}
      <div className="pointer-events-none absolute left-4 top-4 max-w-xs">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
          Drag to orbit · scroll to zoom · click a body to claim it
        </p>
      </div>

      {/* claim panel */}
      {body && (
        <ClaimPanel
          key={body.id}
          body={body}
          owner={owner}
          onClose={() => setSelected(null)}
        />
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
    if (mesh.current) mesh.current.rotation.y += 0.003;
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
        <sphereGeometry args={[body.radius, 48, 48]} />
        {isStar ? (
          <meshBasicMaterial color={body.color} />
        ) : (
          <meshStandardMaterial
            color={body.color}
            roughness={0.85}
            metalness={0.1}
            emissive={owner ? body.color : "#000000"}
            emissiveIntensity={owner ? 0.25 : 0}
          />
        )}
      </mesh>

      {/* selection / ownership halo */}
      {(selected || owner) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.radius * 1.25, body.radius * 1.4, 64]} />
          <meshBasicMaterial
            color={selected ? "#f2671e" : "#7dd3a0"}
            transparent
            opacity={selected ? 0.9 : 0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {body.ring && (
        <mesh rotation={[Math.PI / 2.3, 0, 0]}>
          <ringGeometry args={[body.radius * 1.5, body.radius * 2.2, 64]} />
          <meshBasicMaterial color="#d9c9a0" transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
      )}

      {isStar && <pointLight intensity={1.2} distance={40} color="#ffcf8a" />}

      {/* owner label floating above the body */}
      {owner && (
        <Html center distanceFactor={16} position={[0, body.radius + 0.5, 0]} zIndexRange={[10, 0]}>
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

function ClaimPanel({
  body,
  owner,
  onClose,
}: {
  body: Body;
  owner?: Owner;
  onClose: () => void;
}) {
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
    <div className="absolute inset-x-3 bottom-3 z-10 mx-auto max-w-md rounded-2xl border border-white/12 bg-[#0c0e1acc] p-5 text-white shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:w-[360px]">
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
          style={{ background: body.color, boxShadow: `0 0 12px ${body.color}` }}
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
            ? `Beat ${dollars(owner.amount_cents)} to seize ${body.name}. Min $${need}.`
            : `Floor is $${body.minDollars}. Bid more to defend it longer.`}
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
