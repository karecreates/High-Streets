import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ABBOT_KINNEY_INTRO } from "../config/access";

export type GlobePhase = "idle" | "granted" | "zooming" | "exiting";

interface GlobeCanvasProps {
  phase: GlobePhase;
  onZoomComplete?: () => void;
}

const GLOBE_RADIUS = 1.35;
const CAMERA_DISTANCE = 4.35;
const EARTH_TOPOLOGY_URL = "/earth-topology.png";

const OUTLINE_VERTEX = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const OUTLINE_FRAGMENT = `
  uniform sampler2D topoMap;
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    float land = texture2D(topoMap, vUv).r;
    float dx = dFdx(land);
    float dy = dFdy(land);
    float edge = smoothstep(0.015, 0.11, abs(dx) + abs(dy));
    float fill = smoothstep(0.42, 0.58, land) * 0.22;

    vec3 glow = vec3(0.38, 0.92, 0.98);
    vec3 inner = vec3(0.08, 0.24, 0.30);
    vec3 color = inner * fill + glow * edge * 1.35;

    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.2);
    color += glow * fresnel * 0.18;

    float alpha = clamp(edge * 0.92 + fill * 0.55 + fresnel * 0.12, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`;

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

const BETA_ORANGE = 0xea8324;

function createGlobeGrid(radius: number) {
  const material = new THREE.LineBasicMaterial({
    color: 0x5eead4,
    transparent: true,
    opacity: 0.14,
  });
  const group = new THREE.Group();

  for (let lat = -60; lat <= 60; lat += 20) {
    const points: THREE.Vector3[] = [];
    const phi = ((90 - lat) * Math.PI) / 180;
    const ringRadius = radius * Math.sin(phi);
    const y = radius * Math.cos(phi);
    for (let lng = 0; lng <= 360; lng += 3) {
      const theta = (lng * Math.PI) / 180;
      points.push(
        new THREE.Vector3(ringRadius * Math.cos(theta), y, ringRadius * Math.sin(theta))
      );
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }

  for (let lng = 0; lng < 360; lng += 20) {
    const points: THREE.Vector3[] = [];
    for (let lat = -90; lat <= 90; lat += 3) {
      points.push(latLngToVector3(lat, lng, radius));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }

  return group;
}

function createStarfield(count: number) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 18 + Math.random() * 24;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.55,
    })
  );
}

export function GlobeCanvas({ phase, onZoomComplete }: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  const onZoomCompleteRef = useRef(onZoomComplete);

  phaseRef.current = phase;
  onZoomCompleteRef.current = onZoomComplete;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const startCamera = new THREE.Vector3(0, 0, CAMERA_DISTANCE);
    camera.position.copy(startCamera);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const coreGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 0.998, 64, 64);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x071820,
      transparent: true,
      opacity: 0.92,
    });
    globeGroup.add(new THREE.Mesh(coreGeometry, coreMaterial));

    const outlineGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.004, 128, 128);
    const outlineUniforms = {
      topoMap: { value: null as THREE.Texture | null },
      time: { value: 0 },
    };
    const outlineMaterial = new THREE.ShaderMaterial({
      uniforms: outlineUniforms,
      vertexShader: OUTLINE_VERTEX,
      fragmentShader: OUTLINE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    globeGroup.add(new THREE.Mesh(outlineGeometry, outlineMaterial));

    globeGroup.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(GLOBE_RADIUS * 1.045, 64, 64),
        new THREE.MeshBasicMaterial({
          color: 0x4fd1db,
          transparent: true,
          opacity: 0.08,
          side: THREE.BackSide,
        })
      )
    );

    globeGroup.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(GLOBE_RADIUS * 1.07, 64, 64),
        new THREE.MeshBasicMaterial({
          color: 0x3e6f7e,
          transparent: true,
          opacity: 0.05,
          side: THREE.BackSide,
        })
      )
    );

    globeGroup.add(createGlobeGrid(GLOBE_RADIUS * 1.006));

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(EARTH_TOPOLOGY_URL, (texture) => {
      texture.colorSpace = THREE.NoColorSpace;
      outlineUniforms.topoMap.value = texture;
    });

    const targetMarker = latLngToVector3(
      ABBOT_KINNEY_INTRO.lat,
      ABBOT_KINNEY_INTRO.lng,
      GLOBE_RADIUS * 1.012
    );
    const targetRotationY = -Math.atan2(targetMarker.x, targetMarker.z);

    const idleDotMaterial = new THREE.MeshBasicMaterial({
      color: BETA_ORANGE,
      transparent: true,
      opacity: 0.85,
    });
    const idleDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 12),
      idleDotMaterial
    );
    idleDot.position.copy(targetMarker);
    globeGroup.add(idleDot);

    const markerMaterial = new THREE.MeshBasicMaterial({
      color: BETA_ORANGE,
      transparent: true,
      opacity: 1,
    });
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 16, 16),
      markerMaterial
    );
    marker.position.copy(targetMarker);
    marker.visible = false;
    globeGroup.add(marker);

    const markerRingMaterial = new THREE.MeshBasicMaterial({
      color: BETA_ORANGE,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
    });
    const markerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.042, 0.068, 32),
      markerRingMaterial
    );
    markerRing.position.copy(targetMarker);
    markerRing.lookAt(new THREE.Vector3(0, 0, 0));
    markerRing.visible = false;
    globeGroup.add(markerRing);

    const stars = createStarfield(700);
    scene.add(stars);

    const zoomStartAltitude = 3.6;
    const zoomEndAltitude = 0.18;
    const rotationPhase = 0.32;

    const placeOverheadCamera = (
      markerWorld: THREE.Vector3,
      altitude: number
    ) => {
      const normal = markerWorld.clone().normalize();
      camera.position.copy(normal).multiplyScalar(GLOBE_RADIUS + altitude);
      camera.up.set(0, 1, 0);
      camera.lookAt(markerWorld);
    };

    let animationFrame = 0;
    let zoomStart = 0;
    let zoomCompleted = false;
    const zoomDuration = 3600;
    let idleRotation = targetRotationY;

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const getMarkerWorld = () => {
      const world = targetMarker.clone();
      globeGroup.localToWorld(world);
      return world;
    };

    const animate = (time: number) => {
      animationFrame = requestAnimationFrame(animate);
      outlineUniforms.time.value = time * 0.001;

      const currentPhase = phaseRef.current;

      const blink = 0.55 + Math.sin(time * 0.007) * 0.45;

      if (currentPhase === "idle") {
        idleRotation += 0.002;
        globeGroup.rotation.y = idleRotation;
        stars.rotation.y += 0.0002;
        idleDot.visible = true;
        idleDotMaterial.opacity = 0.45 + blink * 0.55;
        idleDot.scale.setScalar(0.82 + blink * 0.28);
        marker.visible = false;
        markerRing.visible = false;
        camera.position.copy(startCamera);
        camera.lookAt(0, 0, 0);
      } else if (
        currentPhase === "granted" ||
        currentPhase === "zooming" ||
        currentPhase === "exiting"
      ) {
        idleDot.visible = false;

        let markerFade = 1;

        if (currentPhase === "zooming" || currentPhase === "exiting") {
          if (zoomStart === 0) zoomStart = time;
          const progress = Math.min((time - zoomStart) / zoomDuration, 1);

          if (progress < rotationPhase) {
            const rotProgress = progress / rotationPhase;
            const rotEased = 1 - Math.pow(1 - rotProgress, 3);
            globeGroup.rotation.y = THREE.MathUtils.lerp(
              idleRotation,
              targetRotationY,
              rotEased
            );
            camera.position.copy(startCamera);
            camera.lookAt(getMarkerWorld());
          } else {
            globeGroup.rotation.y = targetRotationY;
            const flyProgress = (progress - rotationPhase) / (1 - rotationPhase);
            const flyEased = 1 - Math.pow(1 - flyProgress, 4);
            markerFade = 1 - flyEased;
            const markerWorld = getMarkerWorld();
            const altitude = THREE.MathUtils.lerp(
              zoomStartAltitude,
              zoomEndAltitude,
              flyEased
            );
            placeOverheadCamera(markerWorld, altitude);
          }

          if (progress >= 1 && !zoomCompleted) {
            zoomCompleted = true;
            onZoomCompleteRef.current?.();
          }
        } else {
          globeGroup.rotation.y = THREE.MathUtils.lerp(
            globeGroup.rotation.y,
            targetRotationY,
            0.04
          );
          const lookTarget = targetMarker.clone();
          globeGroup.localToWorld(lookTarget);
          camera.lookAt(lookTarget);
        }

        const showMarker =
          currentPhase !== "exiting" && markerFade > 0.02;
        marker.visible = showMarker;
        markerRing.visible = showMarker;

        if (showMarker) {
          markerMaterial.opacity = blink * markerFade;
          marker.scale.setScalar(0.88 + blink * 0.18);

          markerRing.rotation.z += 0.018;
          const ringPulse = 1 + Math.sin(time * 0.005) * 0.1;
          markerRing.scale.set(ringPulse, ringPulse, ringPulse);
          markerRingMaterial.opacity = (0.28 + blink * 0.18) * markerFade;
        }
      }

      renderer.render(scene, camera);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      outlineGeometry.dispose();
      outlineMaterial.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="globe-canvas" aria-hidden="true" />;
}
