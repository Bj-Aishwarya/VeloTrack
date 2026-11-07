/**
 * VeloTrack - Calm Night Fleet Yard 3D Scene (Final CTA)
 * A realistic, disciplined logistics fleet yard at night:
 * warehouse loading bays, high-mast yard lighting, orderly parked delivery vans,
 * soft reflections on damp asphalt. Inspires confidence and operational calm.
 */

(function () {
  'use strict';

  let scene, camera, renderer, clock;
  let canvasContainer;
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  const PALETTE = {
    nightSky: 0x060911,
    nightFog: 0x070c16,
    asphaltDamp: 0x0d121c,
    warehouseWall: 0x141b27,
    warehouseBayDoor: 0x1f293d,
    bayIllumination: 0xffedd5,
    mastLight: 0xf8fafc,
    yellowLines: 0xd97706,
    vanMatte: 0x1e2736,
    vanWhite: 0xcfd8e3,
    taillightGlow: 0xdc2626
  };

  function init() {
    canvasContainer = document.getElementById('yard-canvas-container');
    const canvas = document.getElementById('yard-canvas');
    if (!canvasContainer || !canvas) return;

    if (typeof THREE === 'undefined') {
      window._yardRetries = (window._yardRetries || 0) + 1;
      if (window._yardRetries > 4) {
        runYard2DFallback(canvas, canvasContainer);
        return;
      }
      setTimeout(init, 300);
      return;
    }

    // 1. Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(PALETTE.nightSky);
    scene.fog = new THREE.FogExp2(PALETTE.nightFog, 0.022);

    clock = new THREE.Clock();

    // 2. Camera setup - low angle looking across orderly depot
    const aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(40, aspect, 0.5, 200);
    camera.position.set(18, 5.5, 22);
    camera.lookAt(-4, 2.0, 0);

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Night Lighting
    setupNightLighting();

    // 5. Build Logistics Depot Yard Environment
    buildDepotWarehouse();
    buildParkingBays();
    buildParkedFleet();

    // 6. Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', (e) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // 7. Loop
    animate();
  }

  function setupNightLighting() {
    // Ambient night sky fill (deep navy/slate)
    const ambient = new THREE.AmbientLight(0x131d2e, 0.7);
    scene.add(ambient);

    // High-mast yard security floodlights
    addHighMastFloodlight(-10, 14, 8, -6, 0, 0);
    addHighMastFloodlight(16, 14, 8, 12, 0, 0);
  }

  function addHighMastFloodlight(x, y, z, targetX, targetY, targetZ) {
    // Lattice steel pole
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.8 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, y, 8), poleMat);
    mast.position.set(x, y / 2, z);
    scene.add(mast);

    // Fixture head
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.6), poleMat);
    head.position.set(x, y, z);
    scene.add(head);

    // Bright fixture lens
    const lens = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(x, y - 0.16, z);
    scene.add(lens);

    // Industrial Yard Spot Light
    const spot = new THREE.SpotLight(0xf1f5f9, 3.2, 38, Math.PI / 3.2, 0.6, 1.4);
    spot.position.set(x, y, z);
    spot.castShadow = true;
    spot.shadow.bias = -0.001;

    const target = new THREE.Object3D();
    target.position.set(targetX, targetY, targetZ);
    scene.add(target);
    spot.target = target;

    scene.add(spot);
  }

  function buildDepotWarehouse() {
    // Damp asphalt ground
    const groundGeo = new THREE.PlaneGeometry(120, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: PALETTE.asphaltDamp,
      roughness: 0.3, // Damp reflection
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Main Distribution Warehouse Building along the rear
    const bldgGeo = new THREE.BoxGeometry(90, 12, 24);
    const bldgMat = new THREE.MeshStandardMaterial({
      color: PALETTE.warehouseWall,
      roughness: 0.85,
      metalness: 0.2
    });
    const bldg = new THREE.Mesh(bldgGeo, bldgMat);
    bldg.position.set(0, 6, -18);
    bldg.castShadow = true;
    bldg.receiveShadow = true;
    scene.add(bldg);

    // Warehouse Loading Docks / Roll-up Bay Doors
    const doorMat = new THREE.MeshStandardMaterial({
      color: PALETTE.warehouseBayDoor,
      roughness: 0.5,
      metalness: 0.4
    });

    const bayXPositions = [-24, -12, 0, 12, 24];
    bayXPositions.forEach((bx, idx) => {
      // Roll up door
      const door = new THREE.Mesh(new THREE.BoxGeometry(6.4, 5.0, 0.3), doorMat);
      door.position.set(bx, 2.7, -5.9);
      scene.add(door);

      // Dock shelter / bumper rubber
      const bumperLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.2, 0.4), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
      bumperLeft.position.set(bx - 3.3, 2.7, -5.8);
      scene.add(bumperLeft);

      const bumperRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.2, 0.4), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
      bumperRight.position.set(bx + 3.3, 2.7, -5.8);
      scene.add(bumperRight);

      // Warm overhead dock light
      const bayLight = new THREE.PointLight(0xffedd5, 1.2, 10);
      bayLight.position.set(bx, 5.5, -5.2);
      scene.add(bayLight);

      const lampFixture = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffedd5 })
      );
      lampFixture.position.copy(bayLight.position);
      scene.add(lampFixture);
    });
  }

  function buildParkingBays() {
    const lineMat = new THREE.MeshBasicMaterial({ color: PALETTE.yellowLines });

    // Parking slot stripe dividers for orderly fleet staging
    for (let x = -30; x <= 30; x += 6.5) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 9.5), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.02, 1.5);
      scene.add(line);
    }
  }

  function createParkedVan(colorHex, hasTaillightGlow) {
    const vanGroup = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.4,
      metalness: 0.3
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8
    });

    // Body
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.2, 5.2), bodyMat);
    cargo.position.set(0, 1.4, 0);
    cargo.castShadow = true;
    vanGroup.add(cargo);

    // Cab nose
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, 1.4), bodyMat);
    cab.position.set(0, 1.1, 3.1);
    cab.castShadow = true;
    vanGroup.add(cab);

    // Windshield
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.2), darkMat);
    glass.position.set(0, 1.55, 3.6);
    glass.rotation.x = 0.3;
    vanGroup.add(glass);

    // Wheels
    const wheelPositions = [[-1.1, 0.45, 1.8], [1.1, 0.45, 1.8], [-1.1, 0.45, -1.8], [1.1, 0.45, -1.8]];
    wheelPositions.forEach(p => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 12), darkMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(p[0], p[1], p[2]);
      vanGroup.add(wheel);
    });

    // Tail light glow on selected vans (subtle staging state)
    if (hasTaillightGlow) {
      const redTailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const leftTail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.08), redTailMat);
      leftTail.position.set(-0.85, 1.2, -2.62);
      vanGroup.add(leftTail);

      const rightTail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.08), redTailMat);
      rightTail.position.set(0.85, 1.2, -2.62);
      vanGroup.add(rightTail);
    }

    return vanGroup;
  }

  function buildParkedFleet() {
    // Fleet of disciplined, orderly delivery vans staged for tomorrow's morning departure
    const fleetConfig = [
      { x: -26.5, z: 1.5, color: PALETTE.vanWhite, glow: false },
      { x: -20.0, z: 1.5, color: PALETTE.vanWhite, glow: true },
      { x: -13.5, z: 1.5, color: 0x1e293b, glow: false },
      { x: -7.0, z: 1.5, color: PALETTE.vanWhite, glow: false },
      { x: -0.5, z: 1.5, color: 0x0284c7, glow: true }, // VeloTrack Fleet flagship van
      { x: 6.0, z: 1.5, color: PALETTE.vanWhite, glow: false },
      { x: 12.5, z: 1.5, color: PALETTE.vanWhite, glow: false },
      { x: 19.0, z: 1.5, color: 0x1e293b, glow: false }
    ];

    fleetConfig.forEach(cfg => {
      const van = createParkedVan(cfg.color, cfg.glow);
      van.position.set(cfg.x, 0, cfg.z);
      van.rotation.y = Math.PI; // Backed into parking spots (standard logistics protocol)
      scene.add(van);
    });
  }

  function onWindowResize() {
    if (!camera || !renderer || !canvasContainer) return;
    const w = canvasContainer.clientWidth;
    const h = canvasContainer.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function animate() {
    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    // Mouse parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.04;
    mouse.y += (mouse.targetY - mouse.y) * 0.04;

    // Very gentle camera breathing drift
    camera.position.x = 18 + Math.sin(elapsed * 0.08) * 1.5 + mouse.x * 1.5;
    camera.position.y = 5.5 + Math.cos(elapsed * 0.06) * 0.3 - mouse.y * 0.8;
    camera.lookAt(-4, 2.0, 0);

    renderer.render(scene, camera);
  }

  /* --------------------------------------------------------------------------
     Calm Night Fleet Yard Procedural 2D Fallback
     -------------------------------------------------------------------------- */
  function runYard2DFallback(canvas, container) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight || 500;
    }
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    function drawNightYard() {
      const w = canvas.width;
      const h = canvas.height;
      t += 0.005;

      // Dark Night Sky
      ctx.fillStyle = '#060911';
      ctx.fillRect(0, 0, w, h);

      // Warehouse Silhouette in Background
      ctx.fillStyle = '#111722';
      ctx.fillRect(0, h * 0.22, w, h * 0.32);

      // Warehouse Bay Doors (Illuminated)
      for (let x = 60; x < w - 60; x += 140) {
        // Roll-up door
        ctx.fillStyle = '#1a2332';
        ctx.fillRect(x, h * 0.32, 90, h * 0.22);

        // Overhead Dock Light glow
        const dockGrad = ctx.createRadialGradient(x + 45, h * 0.30, 2, x + 45, h * 0.45, 75);
        dockGrad.addColorStop(0, 'rgba(255, 237, 213, 0.4)');
        dockGrad.addColorStop(1, 'rgba(255, 237, 213, 0)');
        ctx.fillStyle = dockGrad;
        ctx.beginPath();
        ctx.arc(x + 45, h * 0.38, 70, 0, Math.PI * 2);
        ctx.fill();
      }

      // Damp Asphalt Ground
      const groundGrad = ctx.createLinearGradient(0, h * 0.54, 0, h);
      groundGrad.addColorStop(0, '#0d121c');
      groundGrad.addColorStop(1, '#060911');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, h * 0.54, w, h * 0.46);

      // High-mast floodlight cones
      [w * 0.25, w * 0.75].forEach(mx => {
        // Light pole
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(mx, h * 0.15);
        ctx.lineTo(mx, h * 0.56);
        ctx.stroke();

        // Flood cone
        const coneGrad = ctx.createRadialGradient(mx, h * 0.15, 10, mx, h * 0.7, 180);
        coneGrad.addColorStop(0, 'rgba(248, 250, 252, 0.2)');
        coneGrad.addColorStop(1, 'rgba(248, 250, 252, 0)');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(mx, h * 0.15);
        ctx.lineTo(mx - 140, h * 0.85);
        ctx.lineTo(mx + 140, h * 0.85);
        ctx.closePath();
        ctx.fill();
      });

      // Parked Fleet Vans
      for (let vx = 40; vx < w; vx += 110) {
        // Yellow parking slot divider
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vx - 15, h * 0.65);
        ctx.lineTo(vx - 15, h * 0.95);
        ctx.stroke();

        // Van Body
        ctx.fillStyle = (vx % 220 === 40) ? '#0284c7' : '#cbd5e1';
        ctx.fillRect(vx, h * 0.68, 72, 38);

        // Dark Cab Glass
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(vx + 52, h * 0.70, 16, 20);

        // Soft Red Taillight Glow
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(vx, h * 0.76, 3, 10);
      }

      requestAnimationFrame(drawNightYard);
    }
    drawNightYard();
  }

  // Self-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
