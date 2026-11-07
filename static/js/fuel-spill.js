/**
 * VeloTrack - Interactive Fuel Spillage Cursor Effect
 * Simulates viscous diesel oil droplets and iridescent petrol slick ripples
 * spilling onto the tarmac surface as the user moves their cursor over fuel cards.
 */

(function () {
  'use strict';

  function initFuelSpillage() {
    const spillZones = document.querySelectorAll('.fuel-spill-zone');
    if (!spillZones.length) return;

    spillZones.forEach(zone => {
      attachFuelCanvas(zone);
    });
  }

  function attachFuelCanvas(zone) {
    const canvas = document.createElement('canvas');
    canvas.className = 'fuel-spill-canvas';
    zone.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let particles = [];
    let prevMouse = { x: null, y: null, time: 0 };
    let isHovered = false;
    let animId = null;

    function resize() {
      const rect = zone.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    resize();
    window.addEventListener('resize', resize);

    zone.addEventListener('mouseenter', (e) => {
      isHovered = true;
      const rect = zone.getBoundingClientRect();
      prevMouse.x = e.clientX - rect.left;
      prevMouse.y = e.clientY - rect.top;
      prevMouse.time = performance.now();
      if (!animId) loop();
    });

    zone.addEventListener('mouseleave', () => {
      isHovered = false;
      prevMouse.x = null;
      prevMouse.y = null;
    });

    zone.addEventListener('mousemove', (e) => {
      const rect = zone.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();

      if (prevMouse.x !== null) {
        const dx = x - prevMouse.x;
        const dy = y - prevMouse.y;
        const dt = Math.max(now - prevMouse.time, 1);
        const speed = Math.sqrt(dx * dx + dy * dy) / dt;

        // Spawn droplets based on cursor velocity
        const count = Math.min(Math.floor(speed * 3) + 1, 6);
        for (let i = 0; i < count; i++) {
          particles.push(createDroplet(x, y, dx * 0.15, dy * 0.15, speed));
        }
      }

      prevMouse.x = x;
      prevMouse.y = y;
      prevMouse.time = now;
    });

    function createDroplet(x, y, vx, vy, speed) {
      const angle = Math.random() * Math.PI * 2;
      const spread = (Math.random() * 2 + 0.5) * Math.min(speed, 3);
      const isLargeSplash = Math.random() < 0.25;

      return {
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: vx * 0.4 + Math.cos(angle) * spread,
        vy: vy * 0.4 + Math.sin(angle) * spread,
        radius: isLargeSplash ? Math.random() * 5 + 4 : Math.random() * 3 + 1.5,
        targetRadius: isLargeSplash ? Math.random() * 9 + 6 : Math.random() * 5 + 2.5,
        alpha: 0.85,
        decay: Math.random() * 0.015 + 0.012,
        // Iridescent petrol hues (amber diesel core + cyan/magenta rainbow sheen)
        hueVariation: Math.random(),
        sheenAngle: Math.random() * Math.PI * 2
      };
    }

    function loop() {
      ctx.clearRect(0, 0, width, height);

      // Render & update droplets
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Physics: Viscous liquid deceleration & spread
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.82;
        p.vy *= 0.82;

        // Surface tension spreading into tarmac puddle
        if (p.radius < p.targetRadius) {
          p.radius += (p.targetRadius - p.radius) * 0.12;
        }

        p.alpha -= p.decay;

        if (p.alpha <= 0.01) {
          particles.splice(i, 1);
          continue;
        }

        // Draw Fuel Spill Puddle
        ctx.save();
        ctx.translate(p.x, p.y);

        // 1. Iridescent outer petrol rainbow sheen
        const grad = ctx.createRadialGradient(0, 0, p.radius * 0.2, 0, 0, p.radius * 1.4);
        if (p.hueVariation < 0.4) {
          // Amber-gold diesel core with cyan petrol rim
          grad.addColorStop(0, `rgba(217, 119, 6, ${p.alpha * 0.9})`);
          grad.addColorStop(0.5, `rgba(180, 83, 9, ${p.alpha * 0.75})`);
          grad.addColorStop(0.85, `rgba(14, 165, 233, ${p.alpha * 0.5})`);
          grad.addColorStop(1, `rgba(6, 182, 212, 0)`);
        } else if (p.hueVariation < 0.75) {
          // Dark motor oil with purple-teal sheen
          grad.addColorStop(0, `rgba(120, 53, 15, ${p.alpha * 0.95})`);
          grad.addColorStop(0.6, `rgba(217, 70, 239, ${p.alpha * 0.6})`);
          grad.addColorStop(0.88, `rgba(14, 165, 233, ${p.alpha * 0.45})`);
          grad.addColorStop(1, `rgba(15, 23, 42, 0)`);
        } else {
          // Golden iridescent kerosene
          grad.addColorStop(0, `rgba(245, 158, 11, ${p.alpha * 0.9})`);
          grad.addColorStop(0.5, `rgba(234, 88, 12, ${p.alpha * 0.7})`);
          grad.addColorStop(0.85, `rgba(52, 211, 153, ${p.alpha * 0.4})`);
          grad.addColorStop(1, `rgba(245, 158, 11, 0)`);
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        // Slightly irregular organic liquid puddle shape
        ctx.ellipse(0, 0, p.radius * 1.15, p.radius * 0.85, p.sheenAngle, 0, Math.PI * 2);
        ctx.fill();

        // 2. Wet specular highlight point
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(-p.radius * 0.25, -p.radius * 0.25, Math.max(p.radius * 0.18, 0.8), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      if (particles.length > 0 || isHovered) {
        animId = requestAnimationFrame(loop);
      } else {
        animId = null;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFuelSpillage);
  } else {
    initFuelSpillage();
  }
})();
