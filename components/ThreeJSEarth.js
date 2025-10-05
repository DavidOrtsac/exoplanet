import { useEffect, useRef, useState, forwardRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import getStarfield from "./getStarfield.js";
import { getFresnelMat } from "./getFresnelMat.js";

const ThreeJSEarth = forwardRef(function ThreeJSEarth(
  {
    animateToBottomRight = false,
    animateToBottomLeft = false,
    onAnimationComplete,
  },
  ref
) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);
  const cameraRef = useRef(null);
  const earthGroupRef = useRef(null);
  const animationStateRef = useRef({
    isAnimating: false,
    startTime: 0,
    duration: 2000, // 2 seconds
    startCamera: { x: -1.5, y: 0, z: 3.7 },
    endCamera: { x: 1.5, y: -1.5, z: 2.5 },
    startEarth: { x: -1.5, y: 0, z: 0 },
    endEarth: { x: 1.5, y: -1.5, z: 0 },
  });

  const leftAnimationStateRef = useRef({
    isAnimating: false,
    startTime: 0,
    duration: 2000, // 2000ms to match the original smooth animation
    startCamera: { x: 1.5, y: -1.5, z: 2.5 },
    endCamera: { x: -1.5, y: -1.5, z: 2.5 },
    startEarth: { x: 1.5, y: -1.5, z: 0 },
    endEarth: { x: -1.5, y: -1.5, z: 0 },
  });

  const rightAnimationStateRef = useRef({
    isAnimating: false,
    startTime: 0,
    duration: 2000, // 2000ms to match the original smooth animation
    startCamera: { x: -1.5, y: -1.5, z: 2.5 },
    endCamera: { x: 1.5, y: -1.5, z: 2.5 },
    startEarth: { x: -1.5, y: -1.5, z: 0 },
    endEarth: { x: 1.5, y: -1.5, z: 0 },
  });

  useEffect(() => {
    if (!mountRef.current) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.x = -1.5; // Move camera left to compensate for Earth position
    camera.position.z = 3.7; // Move camera back for better distance
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Create Earth group
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = (-23.4 * Math.PI) / 180;
    earthGroup.position.x = -1.5; // Move Earth to the left side of screen
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // Disable zoom to prevent size changes

    // Create Earth geometry and materials
    const detail = 12;
    const loader = new THREE.TextureLoader();
    const geometry = new THREE.IcosahedronGeometry(1.4, detail);

    // Earth material with enhanced contrast for dramatic lighting
    const material = new THREE.MeshPhongMaterial({
      map: loader.load("./textures/00_earthmap1k.jpg"),
      specularMap: loader.load("./textures/02_earthspec1k.jpg"),
      bumpMap: loader.load("./textures/01_earthbump1k.jpg"),
      bumpScale: 0.04,
      shininess: 30,
      specular: new THREE.Color(0x222222),
    });

    const earthMesh = new THREE.Mesh(geometry, material);
    earthGroup.add(earthMesh);

    // City lights material
    const lightsMat = new THREE.MeshBasicMaterial({
      map: loader.load("./textures/03_earthlights1k.jpg"),
      blending: THREE.AdditiveBlending,
    });
    const lightsMesh = new THREE.Mesh(geometry, lightsMat);
    earthGroup.add(lightsMesh);

    // Clouds material
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: loader.load("./textures/04_earthcloudmap.jpg"),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      alphaMap: loader.load("./textures/05_earthcloudmaptrans.jpg"),
    });
    const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
    cloudsMesh.scale.setScalar(1.003);
    earthGroup.add(cloudsMesh);

    // Fresnel glow material
    const fresnelMat = getFresnelMat();
    const glowMesh = new THREE.Mesh(geometry, fresnelMat);
    glowMesh.scale.setScalar(1.01);
    earthGroup.add(glowMesh);

    // Add stars
    const stars = getStarfield({ numStars: 2000 });
    scene.add(stars);

    // Add dramatic lighting for strong day-night effect
    const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
    sunLight.position.set(-3, 2, 2); // Position light to create strong shadows
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    scene.add(sunLight);

    // Add ambient light for subtle fill lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
    scene.add(ambientLight);

    // Animation loop
    function animate() {
      animationRef.current = requestAnimationFrame(animate);

      // Handle transition animation (bottom right)
      if (animationStateRef.current.isAnimating) {
        const currentTime = Date.now();
        const elapsed = currentTime - animationStateRef.current.startTime;
        const progress = Math.min(
          elapsed / animationStateRef.current.duration,
          1
        );

        // Easing function for smooth animation
        const easeInOutCubic = (t) =>
          t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        const easedProgress = easeInOutCubic(progress);

        // Animate camera position
        const camera = cameraRef.current;
        const earthGroup = earthGroupRef.current;
        const animState = animationStateRef.current;

        camera.position.x =
          animState.startCamera.x +
          (animState.endCamera.x - animState.startCamera.x) * easedProgress;
        camera.position.y =
          animState.startCamera.y +
          (animState.endCamera.y - animState.startCamera.y) * easedProgress;
        camera.position.z =
          animState.startCamera.z +
          (animState.endCamera.z - animState.startCamera.z) * easedProgress;

        // Animate Earth position
        earthGroup.position.x =
          animState.startEarth.x +
          (animState.endEarth.x - animState.startEarth.x) * easedProgress;
        earthGroup.position.y =
          animState.startEarth.y +
          (animState.endEarth.y - animState.startEarth.y) * easedProgress;
        earthGroup.position.z =
          animState.startEarth.z +
          (animState.endEarth.z - animState.startEarth.z) * easedProgress;

        // Scale down Earth slightly
        const scale = 1 - easedProgress * 0.3; // Scale down to 70% of original size
        earthGroup.scale.setScalar(scale);

        if (progress >= 1) {
          animationStateRef.current.isAnimating = false;
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }
      }

      // Handle left transition animation (bottom left)
      if (leftAnimationStateRef.current.isAnimating) {
        const currentTime = Date.now();
        const elapsed = currentTime - leftAnimationStateRef.current.startTime;
        const progress = Math.min(
          elapsed / leftAnimationStateRef.current.duration,
          1
        );

        // Easing function for smooth animation
        const easeInOutCubic = (t) =>
          t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        const easedProgress = easeInOutCubic(progress);

        // Animate camera position
        const camera = cameraRef.current;
        const earthGroup = earthGroupRef.current;
        const leftAnimState = leftAnimationStateRef.current;

        camera.position.x =
          leftAnimState.startCamera.x +
          (leftAnimState.endCamera.x - leftAnimState.startCamera.x) *
            easedProgress;
        camera.position.y =
          leftAnimState.startCamera.y +
          (leftAnimState.endCamera.y - leftAnimState.startCamera.y) *
            easedProgress;
        camera.position.z =
          leftAnimState.startCamera.z +
          (leftAnimState.endCamera.z - leftAnimState.startCamera.z) *
            easedProgress;

        // Animate Earth position
        earthGroup.position.x =
          leftAnimState.startEarth.x +
          (leftAnimState.endEarth.x - leftAnimState.startEarth.x) *
            easedProgress;
        earthGroup.position.y =
          leftAnimState.startEarth.y +
          (leftAnimState.endEarth.y - leftAnimState.startEarth.y) *
            easedProgress;
        earthGroup.position.z =
          leftAnimState.startEarth.z +
          (leftAnimState.endEarth.z - leftAnimState.startEarth.z) *
            easedProgress;

        if (progress >= 1) {
          leftAnimationStateRef.current.isAnimating = false;
        }
      }

      // Handle right transition animation (bottom right)
      if (rightAnimationStateRef.current.isAnimating) {
        const currentTime = Date.now();
        const elapsed = currentTime - rightAnimationStateRef.current.startTime;
        const progress = Math.min(
          elapsed / rightAnimationStateRef.current.duration,
          1
        );

        // Easing function for smooth animation
        const easeInOutCubic = (t) =>
          t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        const easedProgress = easeInOutCubic(progress);

        // Animate camera position
        const camera = cameraRef.current;
        const earthGroup = earthGroupRef.current;
        const rightAnimState = rightAnimationStateRef.current;

        camera.position.x =
          rightAnimState.startCamera.x +
          (rightAnimState.endCamera.x - rightAnimState.startCamera.x) *
            easedProgress;
        camera.position.y =
          rightAnimState.startCamera.y +
          (rightAnimState.endCamera.y - rightAnimState.startCamera.y) *
            easedProgress;
        camera.position.z =
          rightAnimState.startCamera.z +
          (rightAnimState.endCamera.z - rightAnimState.startCamera.z) *
            easedProgress;

        // Animate Earth position
        earthGroup.position.x =
          rightAnimState.startEarth.x +
          (rightAnimState.endEarth.x - rightAnimState.startEarth.x) *
            easedProgress;
        earthGroup.position.y =
          rightAnimState.startEarth.y +
          (rightAnimState.endEarth.y - rightAnimState.startEarth.y) *
            easedProgress;
        earthGroup.position.z =
          rightAnimState.startEarth.z +
          (rightAnimState.endEarth.z - rightAnimState.startEarth.z) *
            easedProgress;

        if (progress >= 1) {
          rightAnimationStateRef.current.isAnimating = false;
        }
      }

      earthMesh.rotation.y += 0.001;
      lightsMesh.rotation.y += 0.001;
      cloudsMesh.rotation.y += 0.00115;
      glowMesh.rotation.y += 0.001;
      stars.rotation.y -= 0.0001;

      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    // Function to start the transition animation
    const startTransition = () => {
      animationStateRef.current.isAnimating = true;
      animationStateRef.current.startTime = Date.now();
    };

    // Function to start the left transition animation
    const startLeftTransition = () => {
      leftAnimationStateRef.current.isAnimating = true;
      leftAnimationStateRef.current.startTime = Date.now();
    };

    // Function to start the right transition animation
    const startRightTransition = () => {
      rightAnimationStateRef.current.isAnimating = true;
      rightAnimationStateRef.current.startTime = Date.now();
    };

    // Expose the startTransition function to parent component
    if (animateToBottomRight) {
      startTransition();
    }

    if (animateToBottomLeft) {
      startLeftTransition();
    }

    // Handle window resize
    function handleWindowResize() {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    }

    window.addEventListener("resize", handleWindowResize, false);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", handleWindowResize, false);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [animateToBottomRight]);

  // Function to trigger animation from parent component
  const triggerAnimation = () => {
    if (animationStateRef.current) {
      animationStateRef.current.isAnimating = true;
      animationStateRef.current.startTime = Date.now();
    }
  };

  // Function to trigger left animation from parent component
  const triggerLeftAnimation = () => {
    if (leftAnimationStateRef.current) {
      leftAnimationStateRef.current.isAnimating = true;
      leftAnimationStateRef.current.startTime = Date.now();
    }
  };

  // Function to trigger right animation from parent component
  const triggerRightAnimation = () => {
    if (rightAnimationStateRef.current) {
      rightAnimationStateRef.current.isAnimating = true;
      rightAnimationStateRef.current.startTime = Date.now();
    }
  };

  // Expose the trigger function via ref
  useEffect(() => {
    if (ref) {
      ref.current = {
        triggerAnimation: triggerAnimation,
        triggerLeftAnimation: triggerLeftAnimation,
        triggerRightAnimation: triggerRightAnimation,
      };
    }
  }, [ref]);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100vw",
        height: "500vh",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 5,
      }}
    />
  );
});

export default ThreeJSEarth;
