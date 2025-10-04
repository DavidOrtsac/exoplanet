import * as THREE from "three";

export function getFresnelMat() {
  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 color;
    uniform float fresnelPower;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      float fresnel = 1.0 - abs(dot(normal, viewDirection));
      fresnel = pow(fresnel, fresnelPower);
      
      gl_FragColor = vec4(color, fresnel);
    }
  `;

  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0x4a90e2) },
      fresnelPower: { value: 2.0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
}
