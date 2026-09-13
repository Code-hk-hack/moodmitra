"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRM, VRMUtils } from "@pixiv/three-vrm";

export type GestureType =
  | "idle"
  | "wave"
  | "warm_welcome"
  | "reassuring_palms"
  | "hand_to_chest"
  | "hand_to_heart"
  | "thoughtful_chin"
  | "empathic_nod"
  | "active_listening"
  | "conversational_speaking"
  | "somatic_breathing"
  | "encouraging_cheer"
  | "thinking"
  | "listening"
  | "speaking";

interface Avatar3DProps {
  emotion?: string;
  isSpeaking?: boolean;
  gesture?: GestureType;
  facialExpression?: string;
  smileIntensity?: number;
  energy?: number;
  headTilt?: number;
  isBreathingActive?: boolean;
  analyser?: AnalyserNode | null;
  onLoaded?: () => void;
}

export default function Avatar3D({
  emotion = "happy",
  isSpeaking = false,
  gesture = "idle",
  facialExpression = "comforting",
  smileIntensity = 0.45,
  energy = 0.65,
  headTilt = 0.04,
  isBreathingActive = false,
  analyser = null,
  onLoaded
}: Avatar3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // References for Three.js instances
  const vrmRef = useRef<VRM | null>(null);
  const faceMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const reqIdRef = useRef<number | null>(null);

  // Audio frequency data buffer
  const audioDataRef = useRef<any>(null);

  // Dynamic state refs for 60 FPS animation loop
  const gestureRef = useRef<GestureType>(gesture);
  const isBreathingActiveRef = useRef<boolean>(isBreathingActive);
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const energyRef = useRef<number>(energy);
  const headTiltRef = useRef<number>(headTilt);
  const smileIntensityRef = useRef<number>(smileIntensity);
  const facialExpressionRef = useRef<string>(facialExpression);
  const breathingTimerRef = useRef<number>(0);

  useEffect(() => {
    gestureRef.current = gesture;
  }, [gesture]);

  useEffect(() => {
    energyRef.current = typeof energy === "number" ? energy : 0.65;
  }, [energy]);

  useEffect(() => {
    headTiltRef.current = typeof headTilt === "number" ? headTilt : 0.04;
  }, [headTilt]);

  useEffect(() => {
    smileIntensityRef.current = typeof smileIntensity === "number" ? smileIntensity : 0.45;
  }, [smileIntensity]);

  useEffect(() => {
    facialExpressionRef.current = facialExpression || "comforting";
  }, [facialExpression]);

  useEffect(() => {
    isBreathingActiveRef.current = isBreathingActive;
    if (!isBreathingActive) {
      breathingTimerRef.current = 0;
    }
  }, [isBreathingActive]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Natural blink state
  const nextBlinkRef = useRef<number>(2.0);
  const isBlinkingRef = useRef<boolean>(false);
  const blinkProgressRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 500;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup - Portrait framing for AvatarSample_A
    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 20);
    camera.position.set(0, 1.28, 1.38);
    camera.lookAt(0, 1.22, 0);
    cameraRef.current = camera;

    // 3. High-efficiency WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Soft Warm Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5ee, 1.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(1.0, 2.0, 1.5).normalize();
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xf8c8dc, 0.95);
    rimLight.position.set(-1.0, 1.2, -1.0).normalize();
    scene.add(rimLight);

    // 5. Load VRM Model (AvatarSample_A)
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      "/models/mahiru.vrm",
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        if (!vrm) {
          setLoadError(true);
          setLoading(false);
          return;
        }

        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.rotateVRM0(vrm);

        // Find Face mesh to control fine-grained morph targets directly
        vrm.scene.traverse((obj: any) => {
          if (obj.isSkinnedMesh && (obj.name.includes("Face") || obj.name.includes("face"))) {
            faceMeshRef.current = obj;
          }
        });

        scene.add(vrm.scene);
        vrmRef.current = vrm;
        vrm.scene.position.set(0, 0, 0);

        setLoading(false);
        if (onLoaded) onLoaded();
      },
      undefined,
      (error) => {
        console.warn("[Avatar3D] Could not load VRM, switching to fallback:", error);
        setLoadError(true);
        setLoading(false);
      }
    );

    // 6. Kinematic Animation Loop (Radiant Face + Gemini Biomechanics)
    const clock = clockRef.current;
    clock.start();

    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      const vrm = vrmRef.current;
      const faceMesh = faceMeshRef.current;

      if (vrm) {
        const humanoid = vrm.humanoid;
        const currentGesture = gestureRef.current;
        const isBreathing = isBreathingActiveRef.current;
        const speaking = isSpeakingRef.current;
        const energyVal = energyRef.current;
        const headTiltVal = headTiltRef.current;
        const smileVal = smileIntensityRef.current;

        // Fetch bone nodes
        const chest = humanoid?.getNormalizedBoneNode("chest") || humanoid?.getNormalizedBoneNode("upperChest");
        const spine = humanoid?.getNormalizedBoneNode("spine");
        const head = humanoid?.getNormalizedBoneNode("head");
        const rightUpperArm = humanoid?.getNormalizedBoneNode("rightUpperArm");
        const rightLowerArm = humanoid?.getNormalizedBoneNode("rightLowerArm");
        const rightHand = humanoid?.getNormalizedBoneNode("rightHand");
        const leftUpperArm = humanoid?.getNormalizedBoneNode("leftUpperArm");
        const leftLowerArm = humanoid?.getNormalizedBoneNode("leftLowerArm");
        const leftHand = humanoid?.getNormalizedBoneNode("leftHand");

        // Exponential smoothing factor for natural muscle inertia
        const lerpFactor = 1.0 - Math.exp(-7.5 * delta);
        const fastLerp = 1.0 - Math.exp(-12.0 * delta);

        // Natural Anatomical Resting Arm Hang Angles
        const naturalLeftArmZ = 1.28;
        const naturalRightArmZ = -1.28;
        const naturalArmX = 0.08;

        // -------------------------------------------------------------
        // A. Somatic 4-7-8 Breathing Controller & Idle Spine Micro-Sway
        // -------------------------------------------------------------
        if (isBreathing) {
          breathingTimerRef.current = (breathingTimerRef.current + delta) % 19.0;
          const t = breathingTimerRef.current;
          let chestExpansion = 1.0;

          if (t < 4.0) {
            const prog = t / 4.0;
            chestExpansion = 1.0 + 0.11 * Math.sin((prog * Math.PI) / 2);
          } else if (t < 11.0) {
            chestExpansion = 1.11;
          } else {
            const prog = (t - 11.0) / 8.0;
            chestExpansion = 1.11 - 0.11 * ((1 - Math.cos(prog * Math.PI)) / 2);
          }

          if (chest) {
            chest.scale.set(chestExpansion, chestExpansion, chestExpansion);
            chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, (chestExpansion - 1.0) * 0.35, lerpFactor);
          }
        } else {
          // Natural relaxed breathing (Mika-3D / Somatic Kinematics)
          const breathCycle = Math.sin(elapsedTime * 1.5);
          if (chest) {
            const idleScale = 1.0 + breathCycle * 0.016;
            chest.scale.set(idleScale, idleScale, idleScale);
            chest.rotation.x = THREE.MathUtils.lerp(chest.rotation.x, breathCycle * 0.018, lerpFactor);
          }
          if (spine) {
            spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, Math.sin(elapsedTime * 0.8) * 0.012, lerpFactor);
            spine.rotation.y = THREE.MathUtils.lerp(spine.rotation.y, Math.cos(elapsedTime * 0.5) * 0.016, lerpFactor);
          }

          // Clavicle & Shoulder Somatic Breathing Expansion
          const leftShoulder = humanoid?.getNormalizedBoneNode("leftShoulder");
          const rightShoulder = humanoid?.getNormalizedBoneNode("rightShoulder");
          if (leftShoulder && rightShoulder) {
            const shoulderLift = breathCycle * 0.018;
            leftShoulder.rotation.z = THREE.MathUtils.lerp(leftShoulder.rotation.z, shoulderLift, lerpFactor);
            rightShoulder.rotation.z = THREE.MathUtils.lerp(rightShoulder.rotation.z, -shoulderLift, lerpFactor);
          }
        }

        // -------------------------------------------------------------
        // B. Gemini-Directed Kinematic Gestures
        // -------------------------------------------------------------
        if (isBreathing || currentGesture === "hand_to_chest" || currentGesture === "hand_to_heart" || currentGesture === "somatic_breathing") {
          // 1. Hand-to-Heart / Somatic Calming Posture
          if (rightUpperArm) {
            rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.58, lerpFactor);
            rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.46, lerpFactor);
            rightUpperArm.rotation.y = THREE.MathUtils.lerp(rightUpperArm.rotation.y, 0.32, lerpFactor);
          }
          if (rightLowerArm) {
            rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, 1.32, lerpFactor);
            rightLowerArm.rotation.z = THREE.MathUtils.lerp(rightLowerArm.rotation.z, -0.20, lerpFactor);
            rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, 0.10, lerpFactor);
          }
          if (rightHand) {
            rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, 0.16, lerpFactor);
            rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, 0.08, lerpFactor);
          }
          if (leftUpperArm) {
            leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, naturalLeftArmZ, lerpFactor);
            leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, naturalArmX, lerpFactor);
          }
          if (leftLowerArm) {
            leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, -0.15, lerpFactor);
          }
          if (head) {
            head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.04, lerpFactor);
            head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.01, lerpFactor);
            head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, headTiltVal, lerpFactor);
          }

        } else if (currentGesture === "reassuring_palms") {
          // 2. Reassuring Palms: Both hands open forward in warm empathetic comfort
          const palmBreath = Math.sin(elapsedTime * 1.8) * 0.03 * energyVal;
          if (rightUpperArm) {
            rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.34, lerpFactor);
            rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -0.85, lerpFactor);
            rightUpperArm.rotation.y = THREE.MathUtils.lerp(rightUpperArm.rotation.y, 0.22, lerpFactor);
          }
          if (leftUpperArm) {
            leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -0.34, lerpFactor);
            leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.85, lerpFactor);
            leftUpperArm.rotation.y = THREE.MathUtils.lerp(leftUpperArm.rotation.y, -0.22, lerpFactor);
          }
          if (rightLowerArm) {
            rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, 0.72 + palmBreath, lerpFactor);
            rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, 0.12, lerpFactor);
          }
          if (leftLowerArm) {
            leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, -0.72 - palmBreath, lerpFactor);
            leftLowerArm.rotation.x = THREE.MathUtils.lerp(leftLowerArm.rotation.x, 0.12, lerpFactor);
          }
          if (rightHand) {
            rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, -0.15 + palmBreath, lerpFactor);
            rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, 0.08, lerpFactor);
          }
          if (leftHand) {
            leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, -0.15 + palmBreath, lerpFactor);
            leftHand.rotation.z = THREE.MathUtils.lerp(leftHand.rotation.z, -0.08, lerpFactor);
          }
          if (head) {
            head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.04, lerpFactor);
            head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, headTiltVal, lerpFactor);
          }

        } else if (currentGesture === "warm_welcome" || currentGesture === "wave") {
          // 3. Graceful Anime Greeting Wave
          if (rightUpperArm) {
            rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -1.18, lerpFactor);
            rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.42, lerpFactor);
            rightUpperArm.rotation.y = THREE.MathUtils.lerp(rightUpperArm.rotation.y, 0.30, lerpFactor);
          }
          if (rightLowerArm) {
            rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, 1.08, lerpFactor);
            rightLowerArm.rotation.x = THREE.MathUtils.lerp(rightLowerArm.rotation.x, 0.18, lerpFactor);
          }
          if (rightHand) {
            const waveSway = Math.sin(elapsedTime * 3.8) * 0.20 * energyVal;
            rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, waveSway, fastLerp);
            rightHand.rotation.y = THREE.MathUtils.lerp(rightHand.rotation.y, Math.cos(elapsedTime * 3.8) * 0.10, fastLerp);
          }
          if (leftUpperArm) {
            leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, naturalLeftArmZ, lerpFactor);
            leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, naturalArmX, lerpFactor);
          }
          if (head) {
            head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, -0.06, lerpFactor);
            head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.02, lerpFactor);
          }

        } else if (currentGesture === "thoughtful_chin" || currentGesture === "thinking") {
          // 4. Thoughtful Chin Pose: Intellectual tilt
          if (leftUpperArm) {
            leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -0.65, lerpFactor);
            leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 0.38, lerpFactor);
            leftUpperArm.rotation.y = THREE.MathUtils.lerp(leftUpperArm.rotation.y, -0.28, lerpFactor);
          }
          if (leftLowerArm) {
            leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, -1.24, lerpFactor);
            leftLowerArm.rotation.z = THREE.MathUtils.lerp(leftLowerArm.rotation.z, 0.18, lerpFactor);
          }
          if (leftHand) {
            leftHand.rotation.y = THREE.MathUtils.lerp(leftHand.rotation.y, -0.22, lerpFactor);
            leftHand.rotation.z = THREE.MathUtils.lerp(leftHand.rotation.z, 0.12, lerpFactor);
          }
          if (rightUpperArm) {
            rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, naturalRightArmZ, lerpFactor);
            rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, naturalArmX, lerpFactor);
          }
          if (head) {
            head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.11, lerpFactor);
            head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, -0.09, lerpFactor);
            head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.05, lerpFactor);
          }

        } else if (currentGesture === "empathic_nod") {
          // 5. Compassionate Slow Nodding
          const nodCycle = Math.sin(elapsedTime * 2.8) * 0.045 * energyVal;
          if (head) {
            head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.05 + nodCycle, lerpFactor);
            head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, headTiltVal, lerpFactor);
          }
          if (rightUpperArm) rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, naturalRightArmZ, lerpFactor);
          if (leftUpperArm) leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, naturalLeftArmZ, lerpFactor);

        } else if (currentGesture === "encouraging_cheer") {
          // 6. Encouraging Cheer: Uplifting open posture
          if (rightUpperArm) {
            rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, -1.02, lerpFactor);
            rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, -0.40, lerpFactor);
          }
          if (leftUpperArm) {
            leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, 1.02, lerpFactor);
            leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, -0.40, lerpFactor);
          }
          if (rightLowerArm) rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, 0.85, lerpFactor);
          if (leftLowerArm) leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, -0.85, lerpFactor);
          if (head) {
            head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, -0.04, lerpFactor);
            head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0, lerpFactor);
          }

        } else if (currentGesture === "active_listening" || currentGesture === "listening") {
          // 7. Active Listening: Attentive forward lean
          if (head) {
            head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.07, lerpFactor);
            head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, 0.04, lerpFactor);
            head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, -0.05 + headTiltVal, lerpFactor);
          }
          if (spine) spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, 0.03, lerpFactor);
          if (leftUpperArm) leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, naturalLeftArmZ, lerpFactor);
          if (rightUpperArm) rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, naturalRightArmZ, lerpFactor);

        } else {
          // 8. Natural Relaxed Idle & Dynamic Conversational Speaking
          if (speaking || currentGesture === "conversational_speaking" || currentGesture === "speaking") {
            const speakT = elapsedTime * 2.2;
            const phasePrimary = Math.sin(speakT);
            const phaseSecondary = Math.sin(speakT * 1.7 + 0.8) * 0.5;
            const combinedPhase = (phasePrimary + phaseSecondary) * 0.65 * energyVal;

            if (rightUpperArm) {
              const speakGestureZ = -1.05 + combinedPhase * 0.15;
              const speakGestureX = -0.22 + Math.cos(speakT * 1.3) * 0.08 * energyVal;
              rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, speakGestureZ, lerpFactor);
              rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, speakGestureX, lerpFactor);
            }
            if (rightLowerArm) {
              const speakLowerY = 0.65 + Math.sin(speakT + 0.5) * 0.16 * energyVal;
              rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, speakLowerY, lerpFactor);
            }
            if (rightHand) {
              const speakHandZ = Math.sin(speakT * 1.8) * 0.12 * energyVal;
              rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, speakHandZ, lerpFactor);
            }
            if (leftUpperArm) {
              const leftCounterZ = naturalLeftArmZ - Math.sin(speakT * 0.8) * 0.05 * energyVal;
              leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, leftCounterZ, lerpFactor);
              leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, naturalArmX, lerpFactor);
            }
            if (head) {
              const headBob = Math.sin(elapsedTime * 3.4) * 0.03 * energyVal;
              const headPan = Math.cos(elapsedTime * 1.7) * 0.02 * energyVal;
              head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, headBob, lerpFactor);
              head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, headPan, lerpFactor);
              head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, headTiltVal, lerpFactor);
            }
          } else {
            // Calm gentle idle
            if (head) {
              head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, Math.sin(elapsedTime * 0.6) * 0.025, lerpFactor);
              head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, Math.cos(elapsedTime * 0.45) * 0.015, lerpFactor);
              head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, 0.01, lerpFactor);
            }
            if (leftUpperArm) {
              leftUpperArm.rotation.z = THREE.MathUtils.lerp(leftUpperArm.rotation.z, naturalLeftArmZ, lerpFactor);
              leftUpperArm.rotation.x = THREE.MathUtils.lerp(leftUpperArm.rotation.x, naturalArmX, lerpFactor);
            }
            if (leftLowerArm) {
              leftLowerArm.rotation.y = THREE.MathUtils.lerp(leftLowerArm.rotation.y, -0.15, lerpFactor);
            }
            if (rightUpperArm) {
              rightUpperArm.rotation.z = THREE.MathUtils.lerp(rightUpperArm.rotation.z, naturalRightArmZ, lerpFactor);
              rightUpperArm.rotation.x = THREE.MathUtils.lerp(rightUpperArm.rotation.x, naturalArmX, lerpFactor);
            }
            if (rightLowerArm) {
              rightLowerArm.rotation.y = THREE.MathUtils.lerp(rightLowerArm.rotation.y, 0.15, lerpFactor);
            }
            if (rightHand) {
              rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, 0, lerpFactor);
            }
          }
        }

        // -------------------------------------------------------------
        // C. Natural Organic Blinking Loop (Eyes Open Fast, Never Stuck)
        // -------------------------------------------------------------
        if (elapsedTime > nextBlinkRef.current && !isBlinkingRef.current) {
          isBlinkingRef.current = true;
          blinkProgressRef.current = 0;
        }

        let blinkWeight = 0.0;
        if (isBlinkingRef.current) {
          blinkProgressRef.current += delta * 9.0;
          blinkWeight = Math.sin(blinkProgressRef.current * Math.PI);
          if (blinkProgressRef.current >= 1.0) {
            isBlinkingRef.current = false;
            blinkWeight = 0.0;
            nextBlinkRef.current = elapsedTime + 2.5 + Math.random() * 3.5;
          }
        }

        // -------------------------------------------------------------
        // D. RADIANT ANIME FACE & SWEET SMILE ENGINE (BIG OPEN EYES!)
        // -------------------------------------------------------------
        if (faceMesh && faceMesh.morphTargetInfluences) {
          const morphs = faceMesh.morphTargetInfluences;

          // Target 17 (Fcl_EYE_Joy) = 0! (NO SQUINTING INTO SLITS)
          // Target 16 (Fcl_Eye_Fun) = 0! (NO EYELID DROOPING)
          morphs[17] = THREE.MathUtils.lerp(morphs[17], 0.0, lerpFactor);
          morphs[16] = THREE.MathUtils.lerp(morphs[16], 0.0, lerpFactor);

          // Target 22 (Fcl_EYE_Spread) = 0.18 (BIG, SPARKLING, VIBRANT ANIME EYES!)
          morphs[22] = THREE.MathUtils.lerp(morphs[22], 0.18, lerpFactor);

          // Target 13 (Fcl_EYE_Close) = Natural Blink
          morphs[13] = Math.max(0.0, Math.min(blinkWeight, 1.0));

          // Sweet, Natural Anime Mouth Smile (Never rigid or flat!)
          // Target 31: Fcl_MTH_Joy (Gentle sweet mouth joy)
          // Target 26: Fcl_MTH_Up (Gentle mouth corner lift)
          // Target 8: Fcl_BRW_Joy (Soft happy eyebrows)
          const targetSmile = Math.min(Math.max(smileVal, 0.25), 0.65);
          morphs[31] = THREE.MathUtils.lerp(morphs[31], targetSmile * 0.75, lerpFactor);
          morphs[26] = THREE.MathUtils.lerp(morphs[26], targetSmile * 0.85, lerpFactor);
          morphs[8] = THREE.MathUtils.lerp(morphs[8], targetSmile * 0.35, lerpFactor);

          // Neutralize all conflicting VRM presets so they never close her eyes
          vrm.expressionManager?.setValue("happy", 0.0);
          vrm.expressionManager?.setValue("relaxed", 0.0);
          vrm.expressionManager?.setValue("sad", 0.0);
          vrm.expressionManager?.setValue("angry", 0.0);
          vrm.expressionManager?.setValue("blink", 0.0);
        }

        // -------------------------------------------------------------
        // E. DUAL-ENGINE REAL-TIME LIP-SYNC (Gnani Live FFT + Procedural Fallback)
        // -------------------------------------------------------------
        let targetOpen = 0.0;
        let targetOh = 0.0;

        // 1. Live FFT Frequency Detection (Gnani.ai Kaveri audio stream)
        if (analyser) {
          if (!audioDataRef.current) {
            audioDataRef.current = new Uint8Array(analyser.frequencyBinCount);
          }
          analyser.getByteFrequencyData(audioDataRef.current as any);

          let sum = 0;
          const count = 32;
          for (let i = 4; i < 4 + count; i++) {
            sum += audioDataRef.current[i] || 0;
          }
          const avg = sum / count;
          const threshold = 18;
          if (avg > threshold) {
            targetOpen = Math.min((avg - threshold) / 38.0, 0.85);
          }
        }

        // 2. Procedural Speech Visemes Fallback
        if (speaking) {
          const proceduralAa = Math.max(0, Math.sin(elapsedTime * 13.0) * 0.45 + Math.sin(elapsedTime * 21.0) * 0.25);
          const proceduralOh = Math.max(0, Math.sin(elapsedTime * 8.5) * 0.30);
          targetOpen = Math.max(targetOpen, proceduralAa);
          targetOh = Math.max(targetOh, proceduralOh);
        }

        if (faceMesh && faceMesh.morphTargetInfluences) {
          // Direct mouth morphs for sample-accurate vowel speech:
          // Target 37: Fcl_MTH_A ('aa' open mouth)
          // Target 41: Fcl_MTH_O ('oh' round mouth)
          const morphs = faceMesh.morphTargetInfluences;
          morphs[37] = THREE.MathUtils.lerp(morphs[37], targetOpen, 0.55);
          morphs[41] = THREE.MathUtils.lerp(morphs[41], targetOh, 0.55);
        }

        vrm.update(delta);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-20">
          <div className="w-10 h-10 border-3 border-[#F2B591] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-white/70 font-medium tracking-wide">Awakening Mahiru 3D...</p>
        </div>
      )}

      {loadError ? (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <img 
            src="/mahiru_happy.png" 
            alt="Mahiru 2D Fallback" 
            className="w-64 h-auto object-contain drop-shadow-2xl brightness-95 mb-4 animate-pulse"
          />
          <span className="text-xs text-purple-200/70 bg-white/10 px-3 py-1 rounded-full">2D Companion Mode</span>
        </div>
      ) : (
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      )}
    </div>
  );
}
