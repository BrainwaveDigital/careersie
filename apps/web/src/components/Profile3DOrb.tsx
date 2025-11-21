// Profile3DOrb.tsx
// React + TypeScript component that:
// - Accepts clustered skill nodes (or raw skills) and renders a 3D skill orb using Three.js
// - Provides simple clustering fallback (TF-IDF + k-means-like grouping)
// - Supports orbit controls, hover tooltips, export to PNG (html2canvas), and a 2D D3 fallback
// NOTE: This file is a single-file scaffold. In production split into modules and add proper error handling.

"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import html2canvas from "html2canvas";
import * as d3 from "d3";

// ----------------------- Types -----------------------
export type SkillNode = {
  id: string;
  label: string;
  category?: string;
  weight?: number; // affects node size
  clusterId?: number;
};

export type Profile3DOrbProps = {
  skills: string[]; // raw skill labels, or pass pre-clustered SkillNode[] via `initialNodes`
  initialNodes?: SkillNode[];
  width?: number;
  height?: number;
  onSelect?: (node: SkillNode | null) => void;
};

// ----------------------- Simple TF-IDF + KMeans-like clustering -----------------------
// Small, dependency-free text vectoriser then greedy k-means. For production use embeddings (OpenAI)
function vectorizeSkills(skills: string[]) {
  // Build small vocabulary
  const tokenizer = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const docs = skills.map(tokenizer);
  const vocabSet = new Set<string>();
  docs.forEach(d => d.forEach(t => vocabSet.add(t)));
  const vocab = Array.from(vocabSet);
  const idf = vocab.map(term => {
    const df = docs.reduce((acc, d) => acc + (d.includes(term) ? 1 : 0), 0);
    return Math.log((skills.length + 1) / (df + 1)) + 1;
  });
  const vectors = docs.map(d => {
    const vec = vocab.map((t, i) => (d.includes(t) ? 1 * (idf[i] ?? 1) : 0));
    const norm = Math.hypot(...vec) || 1;
    return vec.map(v => v / norm);
  });
  return { vocab, vectors };
}

function cosine(a: number[], b: number[]) {
  let s = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    s += aVal * bVal;
    na += aVal * aVal;
    nb += bVal * bVal;
  }
  return s / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function simpleKMeans(vectors: number[][], k = 3, iters = 20) {
  // pick first k as centroids
  const centroids = vectors.slice(0, k).map(v => v.slice());
  const assign = new Array(vectors.length).fill(0);
  for (let it = 0; it < iters; it++) {
    // assign
    for (let i = 0; i < vectors.length; i++) {
      let best = 0, bestScore = -Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const vec = vectors[i];
        const centroid = centroids[c];
        if (vec && centroid) {
          const s = cosine(vec, centroid);
          if (s > bestScore) { bestScore = s; best = c; }
        }
      }
      assign[i] = best;
    }
    // recompute
    for (let c = 0; c < centroids.length; c++) {
      const idxs = assign.map((v, i) => v === c ? i : -1).filter(i => i !== -1);
      if (idxs.length === 0) continue;
      const firstCentroid = centroids[0];
      if (!firstCentroid) continue;
      const sum = new Array(firstCentroid.length).fill(0);
      idxs.forEach(i => {
        const vec = vectors[i];
        if (vec) vec.forEach((v, j) => sum[j] = (sum[j] ?? 0) + v);
      });
      const norm = Math.hypot(...sum) || 1;
      const centroid = centroids[c];
      if (centroid) {
        for (let j = 0; j < sum.length; j++) centroid[j] = (sum[j] ?? 0) / norm;
      }
    }
  }
  return assign;
}

function clusterSkills(skills: string[], k = 4): SkillNode[] {
  if (!skills.length) return [];
  const { vectors } = vectorizeSkills(skills);
  const kSafe = Math.min(k, skills.length);
  const assign = simpleKMeans(vectors, kSafe);
  return skills.map((s, i) => ({ id: `s_${i}`, label: s, category: "", clusterId: assign[i], weight: 1 + Math.random() * 2 }));
}

// ----------------------- Three.js Helpers -----------------------
function fibonacciSpherePoints(n: number, radius = 8) {
  const pts = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2; // y goes from 1 to -1
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    pts.push({ x: x * radius, y: y * radius, z: z * radius });
  }
  return pts;
}

const CATEGORY_COLORS: Record<string, number> = {
  default: 0x4fc3f7,
  frontend: 0x81c784,
  backend: 0xffb74d,
  data: 0xba68c8,
  cloud: 0xff8a65
};

// ----------------------- React Component -----------------------
export default function Profile3DOrb({ skills, initialNodes, width = 800, height = 600, onSelect }: Profile3DOrbProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<SkillNode[]>(initialNodes || clusterSkills(skills, 5));
  const [selected, setSelected] = useState<SkillNode | null>(null);
  const [useFallback2D, setUseFallback2D] = useState(false);

  // Re-cluster if skills change
  useEffect(() => {
    if (!initialNodes) setNodes(clusterSkills(skills, Math.max(3, Math.round(skills.length / 6))));
  }, [skills, initialNodes]);

  // Three.js render loop + scene setup
  useEffect(() => {
    if (useFallback2D) return;
    const container = mountRef.current;
    if (!container) return;

    // scene
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.innerHTML = ""; // clear
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 25);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(5, 10, 7.5);
    scene.add(dir);

    // controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    // Generate positions
    const positions = fibonacciSpherePoints(nodes.length, 9);

    // Create group for nodes
    const group = new THREE.Group();
    scene.add(group);

    // Map of mesh -> node
    const meshNodeMap = new Map<THREE.Mesh, SkillNode>();

    nodes.forEach((n, i) => {
      const pos = positions[i];
      if (!pos) return;
      const size = (n.weight || 1) * 0.8;
      const geom = new THREE.SphereGeometry(size, 16, 12);
      const color = CATEGORY_COLORS[n.category || "default"] || CATEGORY_COLORS.default;
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.userData = { id: n.id };
      group.add(mesh);
      meshNodeMap.set(mesh, n);

      // Add a label as a sprite (simple)
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      ctx.font = "24px Arial";
      const txt = n.label;
      const tw = ctx.measureText(txt).width;
      canvas.width = tw + 8;
      canvas.height = 32;
      ctx.font = "24px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillText(txt, 4, 24);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(canvas.width * 0.02, canvas.height * 0.02, 1);
      sprite.position.set(pos.x, pos.y + size + 0.6, pos.z);
      group.add(sprite);
    });

    // Raycaster for hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredMesh: THREE.Mesh | null = null;

    function onPointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onClick() {
      if (!hoveredMesh) return;
      const node = meshNodeMap.get(hoveredMesh) || null;
      setSelected(node || null);
      if (onSelect) onSelect(node || null);
    }

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("click", onClick);

    // animation loop
    let mounted = true;
    const animate = () => {
      if (!mounted) return;
      requestAnimationFrame(animate);
      controls.update();
      // hover detection
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(group.children as any, true);
      let foundMesh: THREE.Mesh | null = null;
      for (const it of intersects) {
        if (meshNodeMap.has(it.object as THREE.Mesh)) { foundMesh = it.object as THREE.Mesh; break; }
      }
      if (foundMesh !== hoveredMesh) {
        if (hoveredMesh) {
          (hoveredMesh.material as THREE.MeshStandardMaterial).emissive?.setHex(0x000000);
        }
        hoveredMesh = foundMesh;
        if (hoveredMesh) {
          (hoveredMesh.material as THREE.MeshStandardMaterial).emissive?.setHex(0x202020);
          const node = meshNodeMap.get(hoveredMesh)!;
          setSelected(node);
          if (onSelect) onSelect(node);
        } else {
          setSelected(null);
          if (onSelect) onSelect(null);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // resize handler
    function onResize() {
      const w = width;
      const h = height;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);

    // cleanup
    return () => {
      mounted = false;
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      scene.clear();
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [nodes, useFallback2D, width, height, onSelect]);

  // Export canvas with html2canvas
  async function exportPNG() {
    const el = mountRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: null });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "talent-orb.png";
    a.click();
  }

  // D3 fallback: simple force layout
  useEffect(() => {
    if (!useFallback2D) return;
    const container = mountRef.current;
    if (!container) return;
    container.innerHTML = "";
    const svg = d3.select(container).append("svg").attr("width", width).attr("height", height);
    const simulation = d3.forceSimulation(nodes as any)
      .force("charge", d3.forceManyBody().strength(-50))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => ((d.weight || 1) * 8) + 8))
      .on("tick", ticked);

    const node = svg.selectAll("g").data(nodes).enter().append("g");
    node.append("circle").attr("r", (d: any) => (d.weight || 1) * 8).attr("fill", (d: any) => {
      const c = CATEGORY_COLORS[d.category || "default"] || CATEGORY_COLORS.default;
      return c ? `#${c.toString(16).padStart(6, '0')}` : '#4fc3f7';
    });
    node.append("text").text((d: any) => d.label).attr("font-size", 12).attr("dy", 4).attr("text-anchor", "middle").attr("fill", "#FFFFFF");

    function ticked() {
      node.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    }

    return () => {
      simulation.stop();
      container.innerHTML = "";
    };
  }, [useFallback2D, nodes, width, height]);

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ width, height, position: "relative" }}>
        <div ref={mountRef} style={{ width: "100%", height: "100%", background: "transparent", borderRadius: 8 }} />
        {/* Tooltip */}
        {selected && (
          <div
            style={{
              position: "absolute",
              left: 12,
              bottom: 12,
              padding: 10,
              background: "rgba(0,0,0,0.8)",
              color: "white",
              borderRadius: 6,
              border: "1px solid rgba(79, 241, 227, 0.3)"
            }}
          >
            <div style={{ fontWeight: 700, color: "#4ff1e3" }}>{selected.label}</div>
            <div style={{ fontSize: 12, color: "#E5E7EB" }}>{selected.category || "Uncategorized"}</div>
            <div style={{ fontSize: 12, color: "#9AA4B2" }}>Cluster #{selected.clusterId}</div>
          </div>
        )}
      </div>

      <div style={{ width: 280 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setUseFallback2D(false)}
            style={{
              padding: "8px 16px",
              background: !useFallback2D ? "linear-gradient(135deg, #4ff1e3, #536dfe)" : "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#FFFFFF",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            3D View
          </button>
          <button
            onClick={() => setUseFallback2D(true)}
            style={{
              padding: "8px 16px",
              background: useFallback2D ? "linear-gradient(135deg, #4ff1e3, #536dfe)" : "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#FFFFFF",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            2D Fallback
          </button>
          <button
            onClick={exportPNG}
            style={{
              padding: "8px 16px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#FFFFFF",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Export PNG
          </button>
        </div>

        <div style={{ marginTop: 8 }}>
          <h4 style={{ color: "#4ff1e3", marginBottom: 8 }}>Nodes</h4>
          <div
            style={{
              maxHeight: 380,
              overflowY: "auto",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "8px",
              padding: "8px"
            }}
          >
            {nodes.map(n => (
              <div
                key={n.id}
                style={{
                  padding: 6,
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  cursor: "pointer",
                  background: selected?.id === n.id ? "rgba(79, 241, 227, 0.1)" : "transparent",
                  borderRadius: "4px",
                  marginBottom: "4px"
                }}
                onMouseEnter={() => {
                  setSelected(n);
                  if (onSelect) onSelect(n);
                }}
                onMouseLeave={() => {
                  setSelected(null);
                  if (onSelect) onSelect(null);
                }}
              >
                <div style={{ fontWeight: 600, color: "#FFFFFF" }}>{n.label}</div>
                <div style={{ fontSize: 12, color: "#9AA4B2" }}>
                  {n.category || "Uncategorized"} • cluster {n.clusterId}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
