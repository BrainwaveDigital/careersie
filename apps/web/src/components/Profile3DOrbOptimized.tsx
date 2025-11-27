// Optimized Profile3DOrb with InstancedMesh
// Uses Three.js InstancedMesh for 100+ skills with better performance

"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import html2canvas from "html2canvas";
import type { SkillNode } from "./Profile3DOrb";

export type Profile3DOrbOptimizedProps = {
  skills: string[];
  initialNodes?: SkillNode[];
  width?: number;
  height?: number;
  onSelect?: (node: SkillNode | null) => void;
  useInstancing?: boolean; // Enable for 50+ skills
};

const CATEGORY_COLORS: Record<string, number> = {
  default: 0x4fc3f7,
  frontend: 0x81c784,
  backend: 0xffb74d,
  data: 0xba68c8,
  cloud: 0xff8a65,
  mobile: 0x9575cd,
  design: 0xf06292
};

// Fibonacci sphere layout
function fibonacciSpherePoints(n: number, radius = 9) {
  const pts = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    pts.push({ x: x * radius, y: y * radius, z: z * radius });
  }
  return pts;
}

export default function Profile3DOrbOptimized({
  skills,
  initialNodes,
  width = 800,
  height = 600,
  onSelect,
  useInstancing = true
}: Profile3DOrbOptimizedProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<SkillNode[]>(
    initialNodes || skills.map((s, i) => ({
      id: `s_${i}`,
      label: s,
      category: "default",
      weight: 1 + Math.random() * 2,
      clusterId: 0
    }))
  );
  const [selected, setSelected] = useState<SkillNode | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const onSelectRef = useRef(onSelect);
  const hasInteractedRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Keep onSelect ref up to date without causing re-renders
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Update nodes when skills change
  useEffect(() => {
    if (!initialNodes && skills.length > 0) {
      setNodes(skills.map((s, i) => ({
        id: `s_${i}`,
        label: s,
        category: "default",
        weight: 1 + Math.random() * 2,
        clusterId: 0
      })));
    }
  }, [skills, initialNodes]);

  // Handle selection when hoveredIndex changes (only after user interaction)
  useEffect(() => {
    if (!hasInteractedRef.current) return; // Don't show tooltip until user hovers
    
    if (hoveredIndex !== null && hoveredIndex < nodes.length) {
      const node = nodes[hoveredIndex];
      if (node) {
        setSelected(node);
        if (onSelectRef.current) onSelectRef.current(node);
      }
    } else {
      setSelected(null);
      if (onSelectRef.current) onSelectRef.current(null);
    }
  }, [hoveredIndex, nodes]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || nodes.length === 0) return;

    // Scene setup
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 25);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.5);
    dir.position.set(5, 10, 7.5);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 15;
    controls.maxDistance = 50;

    // Generate positions
    const positions = fibonacciSpherePoints(nodes.length, 9);

    // Group for nodes
    const group = new THREE.Group();
    scene.add(group);

    // Create meshes (instanced or individual)
    const meshes: THREE.Mesh[] = [];
    const instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
    
    if (useInstancing && nodes.length > 50) {
      // Use InstancedMesh for better performance
      // Group by category for batching
      const categoryGroups = new Map<string, { nodes: SkillNode[]; indices: number[] }>();
      
      nodes.forEach((node, i) => {
        const cat = node.category || "default";
        if (!categoryGroups.has(cat)) {
          categoryGroups.set(cat, { nodes: [], indices: [] });
        }
        const catGroup = categoryGroups.get(cat);
        if (catGroup) {
          catGroup.nodes.push(node);
          catGroup.indices.push(i);
        }
      });

      // Create InstancedMesh per category
      categoryGroups.forEach((group, category) => {
        const count = group.nodes.length;
        const geometry = new THREE.SphereGeometry(1, 64, 48);
        const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.2,
          metalness: 0.8,
          emissive: new THREE.Color(color).multiplyScalar(0.1),
          envMapIntensity: 1.5
        });

        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        const matrix = new THREE.Matrix4();
        const tempColor = new THREE.Color();

        group.nodes.forEach((node, idx) => {
          const originalIndex = group.indices[idx];
          if (originalIndex === undefined) return;
          const pos = positions[originalIndex];
          if (!pos) return;

          const size = ((node.weight ?? 1) * 0.8);
          matrix.identity();
          matrix.setPosition(pos.x, pos.y, pos.z);
          matrix.scale(new THREE.Vector3(size, size, size));
          instancedMesh.setMatrixAt(idx, matrix);

          // Store original index in instance
          instancedMesh.setColorAt(idx, tempColor.setHex(color ?? 0xffffff));
        });

        instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
        instancedMesh.userData = { category, group };
        
        scene.add(instancedMesh);
        instancedMeshes.set(category, instancedMesh);
      });

    } else {
      // Individual meshes for fewer skills or when instancing disabled
      nodes.forEach((n, i) => {
        const pos = positions[i];
        if (!pos) return;

        const size = (n.weight || 1) * 0.8;
        const geom = new THREE.SphereGeometry(size, 64, 48);
        const color = CATEGORY_COLORS[n.category || "default"] || CATEGORY_COLORS.default;
        const mat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.2,
          metalness: 0.8,
          emissive: new THREE.Color(color).multiplyScalar(0.1),
          envMapIntensity: 1.5
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.userData = { index: i, node: n };
        group.add(mesh);
        meshes.push(mesh);
      });
    }

    // Add labels (sprites) - optimized
    const labelGroup = new THREE.Group();
    scene.add(labelGroup);

    // Only show labels for closest N nodes
    const maxLabels = Math.min(nodes.length, 50);
    const labelNodes = nodes.slice(0, maxLabels);

    labelNodes.forEach((n, i) => {
      const pos = positions[i];
      if (!pos) return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.font = "bold 24px Arial";
      const txt = n.label;
      const tw = ctx.measureText(txt).width;
      canvas.width = tw + 20;
      canvas.height = 40;
      
      // Dark semi-transparent background for readability
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Dark stroke for contrast
      ctx.strokeStyle = "rgba(0,0,0,0.9)";
      ctx.lineWidth = 4;
      ctx.strokeText(txt, canvas.width / 2, canvas.height / 2);
      
      // White fill text
      ctx.fillStyle = "rgba(255,255,255,0.98)";
      ctx.fillText(txt, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(canvas.width * 0.02, canvas.height * 0.02, 1);
      sprite.position.set(pos.x, pos.y + (n.weight || 1) * 0.8 + 0.8, pos.z);
      sprite.userData = { nodeIndex: i };
      labelGroup.add(sprite);
    });

    // Raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onPointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onClick() {
      // Selection is already handled by the hoveredIndex useEffect
      // This just ensures the click is registered
    }

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("click", onClick);

    // Animation loop
    let mounted = true;
    const animate = () => {
      if (!mounted) return;
      requestAnimationFrame(animate);
      controls.update();

      // Hover detection
      raycaster.setFromCamera(mouse, camera);
      
      let foundIndex: number | null = null;

      if (useInstancing && nodes.length > 50) {
        // Raycast against bounding sphere for performance
        const tempSphere = new THREE.Sphere();
        let closestDistance = Infinity;
        
        nodes.forEach((node, i) => {
          const pos = positions[i];
          if (!pos) return;
          tempSphere.center.set(pos.x, pos.y, pos.z);
          tempSphere.radius = (node.weight || 1) * 0.8;
          
          const intersectPoint = new THREE.Vector3();
          if (raycaster.ray.intersectSphere(tempSphere, intersectPoint)) {
            const distance = raycaster.ray.origin.distanceTo(intersectPoint);
            if (distance < closestDistance) {
              closestDistance = distance;
              foundIndex = i;
            }
          }
        });
      } else {
        // Standard raycasting for individual meshes
        const intersects = raycaster.intersectObjects(meshes, false);
        if (intersects.length > 0) {
          const userData = intersects[0]?.object.userData;
          if (userData && typeof userData.index === "number") {
            foundIndex = userData.index;
          }
        }
      }

      // Only update if the hovered index actually changed
      if (foundIndex !== hoveredIndex) {
        if (foundIndex !== null) {
          hasInteractedRef.current = true; // Mark that user has interacted
        }
        setHoveredIndex(foundIndex);
      }

      renderer.render(scene, camera);
    };
    
    // Start animation and mark refs as ready after first render
    animate();
    
    // Set refs immediately for export functionality
    // (We no longer clear these in cleanup, so they persist)
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    // Resize handler
    function onResize() {
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);

    // Cleanup
    return () => {
      mounted = false;
      
      // Remove event listeners
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      
      // Dispose controls
      controls.dispose();
      
      // Dispose all meshes and their materials/geometries
      meshes.forEach(m => {
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (Array.isArray(m.material)) {
            m.material.forEach(mat => mat.dispose());
          } else if (m.material instanceof THREE.Material) {
            m.material.dispose();
          }
        }
      });
      
      // Dispose instanced meshes
      instancedMeshes.forEach(im => {
        if (im.geometry) im.geometry.dispose();
        if (im.material) {
          if (Array.isArray(im.material)) {
            im.material.forEach(mat => mat.dispose());
          } else if (im.material instanceof THREE.Material) {
            im.material.dispose();
          }
        }
      });
      
      // Dispose label sprites
      labelGroup.traverse((obj) => {
        if (obj instanceof THREE.Sprite) {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      });
      
      // Clear scene
      scene.clear();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      
      // Remove canvas from DOM
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      
      // Dispose renderer and force WebGL context loss
      renderer.dispose();
      renderer.forceContextLoss();
      
      // Note: We intentionally do NOT clear refs here to allow export after scene changes
      // The refs will be updated when the component re-renders
    };
  }, [nodes, width, height, useInstancing]); // Removed hoveredIndex and onSelect from deps

  // Export PNG - use WebGL canvas directly
  function exportPNG() {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    
    if (!renderer || !scene || !camera) {
      alert("Please wait for the 3D visualization to load before exporting.");
      return;
    }

    try {
      // Render one frame to ensure we capture current state
      renderer.render(scene, camera);
      
      // Get the canvas and convert to blob
      const canvas = renderer.domElement;
      
      // Use toDataURL as fallback if toBlob isn't supported
      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error("Failed to create blob from canvas");
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `skills-3d-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, "image/png");
      } else {
        // Fallback for older browsers
        const dataURL = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = `skills-3d-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting PNG:", error);
      alert("Failed to export PNG. Please try again.");
    }
  }

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ width, height, position: "relative" }}>
        <div
          ref={mountRef}
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            borderRadius: 8
          }}
        />
        
        {/* Tooltip */}
        {selected && (
          <div
            key={`tooltip-${selected.id}`}
            style={{
              position: "absolute",
              left: 12,
              bottom: 12,
              padding: 10,
              background: "rgba(0,0,0,0.85)",
              color: "white",
              borderRadius: 6,
              border: "1px solid rgba(79, 241, 227, 0.3)",
              backdropFilter: "blur(10px)"
            }}
          >
            <div style={{ fontWeight: 700, color: "#4ff1e3" }}>{selected.label}</div>
            <div style={{ fontSize: 12, color: "#E5E7EB" }}>
              {selected.category || "Uncategorized"}
            </div>
            <div style={{ fontSize: 12, color: "#9AA4B2" }}>
              Cluster #{selected.clusterId} • Weight: {selected.weight?.toFixed(2)}
            </div>
          </div>
        )}

        {/* Performance badge */}
        {useInstancing && nodes.length > 50 && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              padding: "6px 12px",
              background: "rgba(79, 241, 227, 0.15)",
              border: "1px solid rgba(79, 241, 227, 0.3)",
              borderRadius: 6,
              fontSize: 11,
              color: "#4ff1e3",
              fontWeight: 600
            }}
          >
            ⚡ Optimized Mode
          </div>
        )}
      </div>

      <div style={{ width: 280 }}>
        <button
          onClick={exportPNG}
          style={{
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg, #4ff1e3, #536dfe)",
            border: "none",
            borderRadius: "8px",
            color: "#FFFFFF",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "12px"
          }}
        >
          Export PNG
        </button>

        <div style={{ marginTop: 8 }}>
          <h4 style={{ color: "#4ff1e3", marginBottom: 8, fontSize: 14 }}>
            Performance Stats
          </h4>
          <div
            style={{
              padding: "12px",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "8px",
              fontSize: 12
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#9AA4B2" }}>Skills:</span>
              <span style={{ color: "#FFFFFF", fontWeight: 600 }}>{nodes.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#9AA4B2" }}>Mode:</span>
              <span style={{ color: "#4ff1e3", fontWeight: 600 }}>
                {useInstancing && nodes.length > 50 ? "Instanced" : "Standard"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9AA4B2" }}>Draw Calls:</span>
              <span style={{ color: "#FFFFFF", fontWeight: 600 }}>
                {useInstancing && nodes.length > 50 ? "~7" : nodes.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
