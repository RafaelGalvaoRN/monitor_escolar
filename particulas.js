// Partículas
const particlesContainer = document.querySelector(".particles");

if (particlesContainer) {
  const NUM_PARTICLES = 90;   // quantidade
  const SIZE_MIN = 2;         // px
  const SIZE_MAX = 7;         // px
  const OP_MIN = 0.45;        // opacidade mínima
  const OP_MAX = 0.95;        // opacidade máxima
  const DUR_MIN = 8;          // duração mínima (s)
  const DUR_MAX = 20;         // duração máxima (s)
  const DRIFT_MIN = -40;      // deslocamento horizontal mínimo (px)
  const DRIFT_MAX = 40;       // deslocamento horizontal máximo (px)

  // paleta suave
  const COLORS = ["#ffffff", "#d9fbff", "#bfe9ff", "#e6f7ff"];

  for (let i = 0; i < NUM_PARTICLES; i++) {
    const p = document.createElement("div");
    p.className = "particle";

    const size = Math.random() * (SIZE_MAX - SIZE_MIN) + SIZE_MIN;
    const opacity = Math.random() * (OP_MAX - OP_MIN) + OP_MIN;
    const delay = Math.random() * DUR_MAX + "s";
    const duration = (Math.random() * (DUR_MAX - DUR_MIN) + DUR_MIN) + "s";
    const left = Math.random() * 100 + "%";
    const drift = (Math.random() * (DRIFT_MAX - DRIFT_MIN) + DRIFT_MIN) + "px";
    const hue = COLORS[Math.floor(Math.random() * COLORS.length)];

    // CSS custom properties para usar no CSS
    p.style.setProperty("--size", size + "px");
    p.style.setProperty("--opacity", opacity);
    p.style.setProperty("--delay", delay);
    p.style.setProperty("--duration", duration);
    p.style.setProperty("--drift", drift);
    p.style.setProperty("--color", hue);

    p.style.left = left;

    particlesContainer.appendChild(p);
  }
}
