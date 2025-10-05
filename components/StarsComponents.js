import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import getStarfield from "./getStarfield.js";
import { getFresnelMat } from "./getFresnelMat.js";

export default function ThreeJSEarth() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);

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

      earthMesh.rotation.y += 0.001;
      lightsMesh.rotation.y += 0.001;
      cloudsMesh.rotation.y += 0.00115;
      glowMesh.rotation.y += 0.001;
      stars.rotation.y -= 0.0001;

      controls.update();
      renderer.render(scene, camera);
    }

    animate();

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
  }, []);

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
}
