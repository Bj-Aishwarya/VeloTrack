/**
 * VeloTrack - 3D Micro-Icon Mini Canvases
 * Renders small, grounded 3D mechanical models for the Benefits & Problem cards
 * that gently float and respond to hover.
 */

(function () {
  'use strict';

  let iconRetries = 0;

  function initMicroIcons() {
    if (typeof THREE === 'undefined') {
      iconRetries++;
      if (iconRetries > 4) {
        setup2DFallbackIcons();
        return;
      }
      setTimeout(initMicroIcons, 250);
      return;
    }

    setupBenefitIcon('icon-fuel-canvas', 'fuel');
    setupBenefitIcon('icon-time-canvas', 'clock');
    setupBenefitIcon('icon-capacity-canvas', 'cube');
  }

  function setup2DFallbackIcons() {
    draw2DIcon('icon-fuel-canvas', 'fuel');
    draw2DIcon('icon-time-canvas', 'clock');
    draw2DIcon('icon-capacity-canvas', 'cube');
  }

  function draw2DIcon(canvasId, type) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 72;
    canvas.height = 72;

    let rot = 0;
    function loop() {
      rot += 0.02;
      ctx.clearRect(0, 0, 72, 72);
      ctx.save();
      ctx.translate(36, 36);
      ctx.rotate(rot);

      if (type === 'fuel') {
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(12, -12);
        ctx.stroke();
      } else if (type === 'clock') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -14);
        ctx.moveTo(0, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -16, 32, 32);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.strokeRect(-10, -10, 20, 20);
      }

      ctx.restore();
      requestAnimationFrame(loop);
    }
    loop();
  }

  function setupBenefitIcon(canvasId, type) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const parent = canvas.parentElement;
    const w = parent.clientWidth || 72;
    const h = parent.clientHeight || 72;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 20);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(amb);

    const dir = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dir.position.set(3, 4, 3);
    scene.add(dir);

    // Geometry based on type
    let meshGroup = new THREE.Group();

    if (type === 'fuel') {
      // 3D Fuel Nozzle / Pressure Meter Gauge
      const ringGeo = new THREE.TorusGeometry(1.0, 0.12, 12, 24, Math.PI * 1.5);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3, metalness: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      meshGroup.add(ring);

      const dialNeedle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.08, 0.9, 8),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      dialNeedle.position.set(0, 0.25, 0);
      dialNeedle.rotation.z = -0.5;
      meshGroup.add(dialNeedle);

    } else if (type === 'clock') {
      // Precision Gyroscopic Chrono Ring
      const outerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.9, 1.1, 24),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, metalness: 0.6 })
      );
      meshGroup.add(outerRing);

      const innerCross1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
      );
      meshGroup.add(innerCross1);

      const centerDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.2 })
      );
      meshGroup.add(centerDot);

    } else if (type === 'cube') {
      // 3D Cargo Container / Pallet Bin
      const cubeMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.4,
        metalness: 0.3
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), cubeMat);
      meshGroup.add(box);

      // Wireframe overlay to emphasize structural packing
      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(box.geometry),
        new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
      );
      meshGroup.add(wire);
    }

    scene.add(meshGroup);

    // Hover acceleration
    let rotSpeed = 0.015;
    let isHover = false;

    parent.addEventListener('mouseenter', () => {
      isHover = true;
      rotSpeed = 0.045;
    });

    parent.addEventListener('mouseleave', () => {
      isHover = false;
      rotSpeed = 0.015;
    });

    function animate() {
      requestAnimationFrame(animate);

      meshGroup.rotation.y += rotSpeed;
      meshGroup.rotation.x = Math.sin(Date.now() * 0.002) * 0.15;

      renderer.render(scene, camera);
    }
    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMicroIcons);
  } else {
    initMicroIcons();
  }
})();
