"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Clipboard, LoaderCircle, Pause, Play, RotateCcw, RotateCw } from "lucide-react";

type Axis = "x" | "y" | "z";
type Pose = Record<Axis, number>;

const axes: { id: Axis; label: string; description: string }[] = [
  { id: "x", label: "Eje X", description: "Inclina hacia adelante o atrás" },
  { id: "y", label: "Eje Y", description: "Gira hacia la izquierda o derecha" },
  { id: "z", label: "Eje Z", description: "Rota sobre la pantalla" },
];

const initialPose: Pose = { x: 69, y: 0, z: 110 };

function clampAngle(value: number) {
  return Math.max(-180, Math.min(180, Math.round(value)));
}

export function ChromeLaptopViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const poseRef = useRef<Pose>(initialPose);
  const spinningRef = useRef(false);
  const spinAxisRef = useRef<Axis>("z");
  const spinOffsetRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinAxis, setSpinAxis] = useState<Axis>("z");
  const [pose, setPose] = useState<Pose>(initialPose);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  poseRef.current = pose;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let alive = true;
    let frame = 0;
    let lastFrameTime = 0;
    let environment: THREE.DataTexture | null = null;
    let modelRoot: THREE.Object3D | null = null;
    let renderer: THREE.WebGLRenderer;
    let failureTimer = 0;

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch (error) {
      console.error("No se pudo iniciar el visor 3D.", error);
      failureTimer = window.setTimeout(() => {
        if (alive) setFailed(true);
      }, 0);
      return () => {
        alive = false;
        window.clearTimeout(failureTimer);
      };
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x080b11, 0);
    renderer.domElement.className = "h-full w-full cursor-grab touch-none active:cursor-grabbing";
    mount.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const gizmoScene = new THREE.Scene();
    const gizmoCamera = new THREE.OrthographicCamera(-1.25, 1.25, 1.25, -1.25, 0.1, 20);
    gizmoCamera.position.set(3, 2.5, 3);
    gizmoCamera.lookAt(0, 0, 0);
    const gizmoRoot = new THREE.Group();
    gizmoRoot.add(new THREE.AxesHelper(1));
    const gizmoTextures: THREE.CanvasTexture[] = [];
    const axisLabels = [
      { text: "X", position: new THREE.Vector3(1.2, 0, 0), color: "#ff554f" },
      { text: "Y", position: new THREE.Vector3(0, 1.2, 0), color: "#C9E94F" },
      { text: "Z", position: new THREE.Vector3(0, 0, 1.2), color: "#5aa9ff" },
    ];
    for (const axis of axisLabels) {
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 96;
      labelCanvas.height = 96;
      const context = labelCanvas.getContext("2d");
      if (context) {
        context.fillStyle = axis.color;
        context.font = "700 64px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(axis.text, 48, 48);
      }
      const texture = new THREE.CanvasTexture(labelCanvas);
      gizmoTextures.push(texture);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
      label.position.copy(axis.position);
      label.scale.set(0.4, 0.4, 0.4);
      gizmoRoot.add(label);
    }
    gizmoScene.add(gizmoRoot);
    renderer.autoClear = false;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x283246, 1.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(-4, 8, 6);
    scene.add(keyLight);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      renderer.setViewport(0, 0, width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const canvas = renderer.domElement;
    const pointerDown = (event: PointerEvent) => {
      dragging = true;
      stopSpin();
      lastX = event.clientX;
      lastY = event.clientY;
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic pointer events in browser automation have no active pointer to capture.
      }
      canvas.style.cursor = "grabbing";
    };
    const pointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      setPose((current) => ({
        x: clampAngle(current.x + deltaY * 0.6),
        y: clampAngle(current.y + deltaX * 0.6),
        z: current.z,
      }));
      setCopied(false);
    };
    const pointerUp = () => {
      dragging = false;
      canvas.style.cursor = "grab";
    };
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    canvas.addEventListener("lostpointercapture", pointerUp);

    const loader = new GLTFLoader();
    loader.load(
      "/models/laptop-liquid-chrome.glb",
      (gltf) => {
        if (!alive) return;
        modelRoot = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(modelRoot);
        const center = bounds.getCenter(new THREE.Vector3());
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());
        modelRoot.position.sub(center);
        modelRoot.rotation.order = "XYZ";
        scene.add(modelRoot);
        modelRef.current = modelRoot;
        const distance = Math.max(sphere.radius * 2.45, 3.5);
        camera.position.set(distance * 0.72, distance * 0.56, distance);
        camera.lookAt(0, 0, 0);
        setReady(true);
      },
      undefined,
      (error) => {
        console.error("No se pudo cargar el modelo 3D.", error);
        if (alive) setFailed(true);
      },
    );

    new RGBELoader().load(
      "/environments/studio_small_09_1k.hdr",
      (texture) => {
        if (!alive) {
          texture.dispose();
          return;
        }
        environment = texture;
        environment.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = environment;
        scene.environmentIntensity = 1.35;
      },
      undefined,
      (error) => console.error("No se pudo cargar el entorno de reflejos.", error),
    );

    const render = () => {
      if (!alive) return;
      frame = window.requestAnimationFrame((time) => {
        const delta = lastFrameTime === 0 ? 0 : Math.min((time - lastFrameTime) / 1000, 0.05);
        lastFrameTime = time;
        if (spinningRef.current) spinOffsetRef.current = (spinOffsetRef.current + delta * 24) % 360;
        if (modelRoot) {
          const currentPose = poseRef.current;
          const animatedPose = { ...currentPose, [spinAxisRef.current]: currentPose[spinAxisRef.current] + spinOffsetRef.current };
          modelRoot.rotation.set(
            THREE.MathUtils.degToRad(animatedPose.x),
            THREE.MathUtils.degToRad(animatedPose.y),
            THREE.MathUtils.degToRad(animatedPose.z),
            "XYZ",
          );
        }
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        const gizmoSize = Math.min(136, Math.max(112, Math.round(Math.min(width, height) * 0.28)));
        const pad = 14;
        const gizmoY = height - gizmoSize - pad;
        gizmoRoot.rotation.copy(modelRoot?.rotation ?? new THREE.Euler());
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, width, height);
        renderer.clear();
        renderer.render(scene, camera);
        renderer.clearDepth();
        renderer.setScissorTest(true);
        renderer.setScissor(pad, gizmoY, gizmoSize, gizmoSize);
        renderer.setViewport(pad, gizmoY, gizmoSize, gizmoSize);
        renderer.render(gizmoScene, gizmoCamera);
        renderer.setScissorTest(false);
        render();
      });
    };
    render();

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      const shouldSpin = !motionPreference.matches;
      spinningRef.current = shouldSpin;
      setSpinning(shouldSpin);
    };
    syncMotionPreference();
    motionPreference.addEventListener("change", syncMotionPreference);

    return () => {
      alive = false;
      motionPreference.removeEventListener("change", syncMotionPreference);
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      canvas.removeEventListener("lostpointercapture", pointerUp);
      modelRef.current = null;
      modelRoot?.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      environment?.dispose();
      gizmoRoot.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) object.geometry.dispose();
        if (object instanceof THREE.Sprite) object.material.dispose();
      });
      gizmoTextures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    if (!modelRef.current) return;
    modelRef.current.rotation.set(
      THREE.MathUtils.degToRad(pose.x),
      THREE.MathUtils.degToRad(pose.y),
      THREE.MathUtils.degToRad(pose.z),
      "XYZ",
    );
  }, [pose]);

  function stopSpin() {
    spinningRef.current = false;
    spinOffsetRef.current = 0;
    setSpinning(false);
  }

  function toggleSpin() {
    const next = !spinningRef.current;
    spinOffsetRef.current = 0;
    spinningRef.current = next;
    setSpinning(next);
  }

  function updateSpinAxis(axis: Axis) {
    spinAxisRef.current = axis;
    spinOffsetRef.current = 0;
    setSpinAxis(axis);
  }

  function updateAxis(axis: Axis, value: number) {
    if (!Number.isFinite(value)) return;
    stopSpin();
    setPose((current) => ({ ...current, [axis]: clampAngle(value) }));
    setCopied(false);
    setCopyError(false);
  }

  async function copyPose() {
    stopSpin();
    try {
      await navigator.clipboard.writeText(JSON.stringify(pose));
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  function resetPose() {
    stopSpin();
    setPose(initialPose);
    setCopied(false);
    setCopyError(false);
  }

  return (
    <section aria-label="Editor de posición de laptop 3D" className="w-full">
      <div className="relative isolate aspect-[.95] min-h-[280px] overflow-hidden rounded-[1.75rem] bg-[#080b11] shadow-[0_38px_100px_-48px_rgba(12,19,34,0.8)] sm:aspect-[1.65] sm:min-h-[470px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_52%_48%,rgba(43,57,79,0.72),rgba(8,11,17,0)_56%),radial-gradient(ellipse_at_91%_72%,rgba(255,98,28,0.24),rgba(8,11,17,0)_28%)]"
        />
        <div className="absolute inset-0" ref={mountRef} />


        {!ready && !failed && (
          <div className="pointer-events-none absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-xs text-white/70 backdrop-blur-sm">
            <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
            Preparando el metal
          </div>
        )}

        {failed && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <Image
              alt="Laptop abierta de cromo líquido, muy reflectante"
              className="object-contain"
              fill
              priority
              src="/images/laptop-liquid-chrome.webp"
            />
            <div className="z-10 max-w-xs rounded-xl bg-black/65 p-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-white">El visor 3D no pudo cargar.</p>
              <p className="mt-1 text-sm text-white/75">Mostrando una vista del modelo.</p>
            </div>
          </div>
        )}

        <span className="pointer-events-none absolute right-5 top-5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/65 backdrop-blur-sm">
          Objeto 3D · cromo líquido
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Posición del modelo</h2>
            <p className="mt-1 text-xs text-foreground/60">Arrastrá la laptop o ajustá un eje para afinar el ángulo.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border/70 px-2">
              <span className="text-xs text-foreground/60">Eje de giro</span>
              <div aria-label="Elegir eje de giro" className="flex items-center gap-1" role="group">
                {axes.map((axis) => (
                  <Button
                    aria-pressed={spinAxis === axis.id}
                    disabled={!ready || failed}
                    key={axis.id}
                    onClick={() => updateSpinAxis(axis.id)}
                    size="sm"
                    variant={spinAxis === axis.id ? "secondary" : "ghost"}
                  >
                    {axis.id.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={resetPose} variant="outline" size="sm" disabled={!ready || failed}>
              <RotateCcw aria-hidden="true" />
              Reiniciar
            </Button>
            <Button onClick={toggleSpin} variant="outline" size="sm" disabled={!ready || failed}>
              {spinning ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {spinning ? "Pausar giro" : "Girar 360°"}
              {spinning && <RotateCw aria-hidden="true" />}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {axes.map((axis) => (
            <div className="rounded-xl border border-border/70 bg-background/70 p-3" key={axis.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-foreground" htmlFor={`pose-${axis.id}`}>
                  {axis.label}
                </label>
                <span className="text-[11px] text-foreground/50">{axis.description}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  aria-label={`${axis.label}, grados`}
                  className="h-2 min-w-0 flex-1 cursor-pointer accent-orange-500"
                  disabled={!ready || failed}
                  max={180}
                  min={-180}
                  onChange={(event) => updateAxis(axis.id, Number(event.target.value))}
                  step={1}
                  type="range"
                  value={pose[axis.id]}
                />
                <Input
                  className="h-9 w-[4.5rem] text-center tabular-nums"
                  disabled={!ready || failed}
                  id={`pose-${axis.id}`}
                  max={180}
                  min={-180}
                  onChange={(event) => updateAxis(axis.id, Number(event.target.value))}
                  step={1}
                  type="number"
                  value={pose[axis.id]}
                />
                <span className="text-xs text-foreground/55">°</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-background/80 px-3 py-2.5">
          <output aria-live="polite" className="font-mono text-xs text-foreground/80">
            {JSON.stringify(pose)}
          </output>
          <div className="flex items-center gap-3">
            {copyError && <span className="text-xs text-destructive">No se pudo copiar.</span>}
            <Button aria-label="Copiar los ángulos exactos" onClick={copyPose} variant="secondary" size="sm" disabled={!ready || failed}>
              {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
              {copied ? "Copiado" : "Copiar posición"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
