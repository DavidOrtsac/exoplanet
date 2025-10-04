import * as THREE from "three";

export default function getStarfield({ numStars = 2000 } = {}) {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    sizeAttenuation: false,
  });

  const positions = new Float32Array(numStars * 3);
  for (let i = 0; i < numStars * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 2000;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, material);
}
