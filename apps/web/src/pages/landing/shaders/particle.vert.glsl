uniform float uTime;
attribute float aPhase;
attribute float aSize;
varying float vAlpha;

void main() {
  vAlpha = 0.35 + 0.35 * sin(uTime * 1.5 + aPhase);
  vec3 pos = position;
  pos.y += sin(uTime * 0.8 + aPhase) * 0.08;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * (220.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
