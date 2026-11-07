/**
 * VeloTrack - Hero 3D Dusk City Scene
 * Realistic city street at dusk with detailed delivery vehicles,
 * subtle reflections, warm headlights, soft street lighting,
 * and an animated 3D route line with glowing waypoints.
 */

(function () {
  'use strict';

  let scene, camera, renderer, clock;
  let vehicles = [];
  let routeSpline, routeMesh, pulseMesh;
  let waypointsGroup;
  let isOrbiting = true;
  let targetOrbitAngle = 0;
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let canvasContainer;
  let initRetries = 0;

  // Dusk Palette
  const COLORS = {
    skyDusk: 0x0c121e,
    fogDusk: 0x0e1524,
    asphalt: 0x141822,
    sidewalk: 0x1f2737,
    curb: 0x2d3748,
    buildingMatte: 0x18202e,
    buildingGlass: 0x1b273b,
    windowWarm: 0xf59e0b,
    windowCool: 0x38bdf8,
    routeTeal: 0x0ea5e9,
    routeGlow: 0x38bdf8,
    headlightWarm: 0xfff4d6,
    taillightRed: 0xef4444,
    vanBodyWhite: 0xdde4ed,
    vanBodyDark: 0x1e2736,
    metalBrushed: 0x475569
  };

  function init() {
    canvasContainer = document.getElementById('hero-canvas-container');
    const canvas = document.getElementById('hero-canvas');
    if (!canvasContainer || !canvas) return;

    if (typeof THREE === 'undefined') {
      initRetries++;
      if (initRetries > 4) {
        console.info('[VeloTrack 3D] Three.js unavailable - launching graceful procedural canvas fallback.');
        runHero2DFallback(canvas, canvasContainer);
        return;
      }
      setTimeout(init, 250);
      return;
    }

    // 1. Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.skyDusk);
    scene.fog = new THREE.FogExp2(COLORS.fogDusk, 0.016);

    clock = new THREE.Clock();

    // 2. Camera setup - cinematic dusk perspective
    const aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(42, aspect, 0.5, 300);
    camera.position.set(22, 14, 26);
    camera.lookAt(0, 1.5, 0);

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    // 4. Lighting - Dusk Golden-Blue contrast
    setupLighting();

    // 5. Build Environment (Asphalt, City Blocks, Architecture)
    buildStreetEnvironment();

    // 6. Build Fleet Delivery Vehicles
    buildFleetVehicles();

    // 7. Build 3D Route Spline & Glowing Waypoints
    buildAnimatedRoute();

    // 8. Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    setupControls();

    // 9. Start Animation Loop
    animate();
  }

  function setupLighting() {
    // Ambient dusk light (cool navy sky fill)
    const ambientLight = new THREE.AmbientLight(0x233148, 1.2);
    scene.add(ambientLight);

    // Directional dusk sun - low angle warm amber
    const duskSun = new THREE.DirectionalLight(0xffb074, 1.8);
    duskSun.position.set(40, 25, -35);
    duskSun.castShadow = true;
    duskSun.shadow.mapSize.width = 2048;
    duskSun.shadow.mapSize.height = 2048;
    duskSun.shadow.camera.near = 10;
    duskSun.shadow.camera.far = 120;
    duskSun.shadow.camera.left = -35;
    duskSun.shadow.camera.right = 35;
    duskSun.shadow.camera.top = 35;
    duskSun.shadow.camera.bottom = -35;
    duskSun.shadow.bias = -0.0008;
    scene.add(duskSun);

    // Subtle cool fill from opposite side
    const coolFill = new THREE.DirectionalLight(0x38bdf8, 0.4);
    coolFill.position.set(-30, 20, 30);
    scene.add(coolFill);

    // Street light fixtures with warm spot cones
    addStreetLamp(-14, 0, -8);
    addStreetLamp(6, 0, -8);
    addStreetLamp(20, 0, -8);
    addStreetLamp(-14, 0, 8);
    addStreetLamp(6, 0, 8);
    addStreetLamp(20, 0, 8);
  }

  function addStreetLamp(x, y, z) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x222938, roughness: 0.6, metalness: 0.8 });
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6, 8);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, 3, z);
    pole.castShadow = true;
    scene.add(pole);

    const armGeo = new THREE.BoxGeometry(1.2, 0.08, 0.08);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(x + (z > 0 ? -0.5 : 0.5), 5.9, z);
    scene.add(arm);

    // Light fixture bulb
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe8ba });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), bulbMat);
    bulb.position.set(x + (z > 0 ? -1 : 1), 5.8, z);
    scene.add(bulb);

    // Warm street spot light cone
    const spot = new THREE.SpotLight(0xffd599, 1.4, 24, Math.PI / 4, 0.5, 1);
    spot.position.copy(bulb.position);
    spot.target.position.set(bulb.position.x, 0, z);
    scene.add(spot);
    scene.add(spot.target);
  }

  function buildStreetEnvironment() {
    // 1. Asphalt Ground Plane
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: COLORS.asphalt,
      roughness: 0.75,
      metalness: 0.15
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Main Avenue Road with divider lines
    const roadMarkingsMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
    const yellowCenterMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });

    // Double yellow center divider
    for (let i = -60; i < 60; i += 4) {
      const line1 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.12), yellowCenterMat);
      line1.rotation.x = -Math.PI / 2;
      line1.position.set(i, 0.02, -0.15);
      scene.add(line1);

      const line2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.12), yellowCenterMat);
      line2.rotation.x = -Math.PI / 2;
      line2.position.set(i, 0.02, 0.15);
      scene.add(line2);
    }

    // White dashed lane dividers
    for (let i = -60; i < 60; i += 6) {
      const dashNorth = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.14), roadMarkingsMat);
      dashNorth.rotation.x = -Math.PI / 2;
      dashNorth.position.set(i, 0.02, -3.8);
      scene.add(dashNorth);

      const dashSouth = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.14), roadMarkingsMat);
      dashSouth.rotation.x = -Math.PI / 2;
      dashSouth.position.set(i, 0.02, 3.8);
      scene.add(dashSouth);
    }

    // Pedestrian crosswalk stripes at intersections
    [-18, 14].forEach(crossX => {
      for (let z = -6.5; z <= 6.5; z += 1.2) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 3.2), roadMarkingsMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(crossX, 0.025, z);
        scene.add(stripe);
      }
    });

    // Sidewalks
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: COLORS.sidewalk,
      roughness: 0.85,
      metalness: 0.05
    });

    const northSidewalk = new THREE.Mesh(new THREE.BoxGeometry(160, 0.25, 12), sidewalkMat);
    northSidewalk.position.set(0, 0.125, -13);
    northSidewalk.receiveShadow = true;
    scene.add(northSidewalk);

    const southSidewalk = new THREE.Mesh(new THREE.BoxGeometry(160, 0.25, 12), sidewalkMat);
    southSidewalk.position.set(0, 0.125, 13);
    southSidewalk.receiveShadow = true;
    scene.add(southSidewalk);

    // City Buildings - Clean industrial tech architecture
    buildCityArchitecture();
  }

  function buildCityArchitecture() {
    const buildingMatDark = new THREE.MeshStandardMaterial({
      color: 0x141b27,
      roughness: 0.8,
      metalness: 0.25
    });

    const buildingMatConcrete = new THREE.MeshStandardMaterial({
      color: 0x1a2333,
      roughness: 0.9,
      metalness: 0.15
    });

    const windowWarmMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const windowCoolMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    // North side buildings
    const northConfigs = [
      { x: -38, z: -22, w: 16, h: 28, d: 14, mat: buildingMatDark },
      { x: -20, z: -23, w: 14, h: 36, d: 15, mat: buildingMatConcrete },
      { x: -4, z: -21, w: 15, h: 22, d: 13, mat: buildingMatDark },
      { x: 12, z: -24, w: 14, h: 42, d: 16, mat: buildingMatConcrete },
      { x: 28, z: -22, w: 15, h: 32, d: 14, mat: buildingMatDark },
      { x: 44, z: -23, w: 14, h: 24, d: 15, mat: buildingMatConcrete }
    ];

    // South side buildings
    const southConfigs = [
      { x: -34, z: 22, w: 15, h: 26, d: 14, mat: buildingMatConcrete },
      { x: -16, z: 23, w: 16, h: 38, d: 15, mat: buildingMatDark },
      { x: 2, z: 22, w: 14, h: 30, d: 14, mat: buildingMatConcrete },
      { x: 18, z: 24, w: 15, h: 22, d: 15, mat: buildingMatDark },
      { x: 36, z: 22, w: 16, h: 35, d: 14, mat: buildingMatConcrete }
    ];

    [...northConfigs, ...southConfigs].forEach((cfg, idx) => {
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d), cfg.mat);
      bldg.position.set(cfg.x, cfg.h / 2, cfg.z);
      bldg.castShadow = true;
      bldg.receiveShadow = true;
      scene.add(bldg);

      // Add architectural setbacks and subtle glowing windows
      const floors = Math.floor(cfg.h / 3.5);
      const cols = Math.floor(cfg.w / 2.2);

      const winGroup = new THREE.Group();
      for (let f = 1; f < floors; f++) {
        for (let c = 1; c < cols; c++) {
          if (Math.random() > 0.45) { // Realistic scattered office window lights
            const winMat = Math.random() > 0.8 ? windowCoolMat : windowWarmMat;
            const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), winMat);
            const wx = (c - cols / 2) * 2.0;
            const wy = f * 3.5 - cfg.h / 2 + 1.2;
            const wz = cfg.z < 0 ? cfg.d / 2 + 0.05 : -cfg.d / 2 - 0.05;
            win.position.set(cfg.x + wx, wy + cfg.h / 2, cfg.z + wz);
            if (cfg.z > 0) win.rotation.y = Math.PI;
            winGroup.add(win);
          }
        }
      }
      scene.add(winGroup);
    });
  }

  function createDeliveryVan(type, colorHex) {
    const vanGroup = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.4
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0a101d,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });

    const bumperMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.8,
      metalness: 0.2
    });

    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.9,
      metalness: 0.1
    });

    const wheelRimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.8
    });

    // 1. Cargo Van Body
    if (type === 'sprinter') {
      // Main cargo body
      const cargoGeo = new THREE.BoxGeometry(4.4, 2.2, 1.9);
      const cargo = new THREE.Mesh(cargoGeo, bodyMat);
      cargo.position.set(-0.3, 1.45, 0);
      cargo.castShadow = true;
      vanGroup.add(cargo);

      // Cab front nose
      const cabGeo = new THREE.BoxGeometry(1.6, 1.7, 1.85);
      const cab = new THREE.Mesh(cabGeo, bodyMat);
      cab.position.set(2.4, 1.15, 0);
      cab.castShadow = true;
      vanGroup.add(cab);

      // Windshield
      const windshieldGeo = new THREE.BoxGeometry(0.8, 0.9, 1.7);
      const windshield = new THREE.Mesh(windshieldGeo, glassMat);
      windshield.position.set(2.2, 1.6, 0);
      windshield.rotation.z = -0.32;
      vanGroup.add(windshield);

      // Bumpers
      const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 1.95), bumperMat);
      frontBumper.position.set(3.2, 0.5, 0);
      vanGroup.add(frontBumper);

      const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 1.95), bumperMat);
      rearBumper.position.set(-2.55, 0.5, 0);
      vanGroup.add(rearBumper);

    } else if (type === 'box_truck') {
      // Heavy duty cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.6, 2.2), bodyMat);
      cab.position.set(2.8, 1.6, 0);
      cab.castShadow = true;
      vanGroup.add(cab);

      // Windshield
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 2.0), glassMat);
      windshield.position.set(3.81, 1.85, 0);
      vanGroup.add(windshield);

      // Large Corrugated Cargo Box
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x2b384e,
        roughness: 0.5,
        metalness: 0.3
      });
      const cargoBox = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.2, 2.4), boxMat);
      cargoBox.position.set(-1.1, 2.1, 0);
      cargoBox.castShadow = true;
      vanGroup.add(cargoBox);

      // Cab aerodynamic roof deflector
      const deflector = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 2.1), bodyMat);
      deflector.position.set(2.2, 3.2, 0);
      deflector.rotation.z = -0.4;
      vanGroup.add(deflector);
    }

    // Wheels (4 or 6 wheels)
    const wheelPositions = type === 'box_truck'
      ? [[3.0, 0.5, 1.15], [3.0, 0.5, -1.15], [-1.8, 0.5, 1.2], [-1.8, 0.5, -1.2], [-2.9, 0.5, 1.2], [-2.9, 0.5, -1.2]]
      : [[2.0, 0.45, 1.0], [2.0, 0.45, -1.0], [-1.6, 0.45, 1.0], [-1.6, 0.45, -1.0]];

    wheelPositions.forEach(pos => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.32, 16), wheelMat);
      tire.rotation.x = Math.PI / 2;
      tire.position.set(pos[0], pos[1], pos[2]);
      tire.castShadow = true;

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.34, 12), wheelRimMat);
      rim.rotation.x = Math.PI / 2;
      tire.add(rim);

      vanGroup.add(tire);
    });

    // Headlights (Warm LED)
    const lightGeo = new THREE.BoxGeometry(0.12, 0.2, 0.35);
    const headMat = new THREE.MeshBasicMaterial({ color: COLORS.headlightWarm });

    const leftHead = new THREE.Mesh(lightGeo, headMat);
    leftHead.position.set(type === 'box_truck' ? 3.82 : 3.22, 0.9, 0.7);
    vanGroup.add(leftHead);

    const rightHead = new THREE.Mesh(lightGeo, headMat);
    rightHead.position.set(type === 'box_truck' ? 3.82 : 3.22, 0.9, -0.7);
    vanGroup.add(rightHead);

    // Forward light spot from vehicle
    const vehicleSpot = new THREE.SpotLight(0xfff1cf, 2.2, 22, Math.PI / 5, 0.4, 1.2);
    vehicleSpot.position.set(type === 'box_truck' ? 4.0 : 3.4, 0.9, 0);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(15, 0, 0);
    vanGroup.add(targetObj);
    vehicleSpot.target = targetObj;
    vanGroup.add(vehicleSpot);

    // Taillights (Red LED)
    const tailMat = new THREE.MeshBasicMaterial({ color: COLORS.taillightRed });
    const leftTail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.18), tailMat);
    leftTail.position.set(type === 'box_truck' ? -4.02 : -2.52, 1.1, 0.82);
    vanGroup.add(leftTail);

    const rightTail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.18), tailMat);
    rightTail.position.set(type === 'box_truck' ? -4.02 : -2.52, 1.1, -0.82);
    vanGroup.add(rightTail);

    // Ground Contact Shadow plane underneath vehicle
    const shadowGeo = new THREE.PlaneGeometry(type === 'box_truck' ? 9.0 : 6.0, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x05070c,
      transparent: true,
      opacity: 0.65
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.04, 0);
    vanGroup.add(shadowMesh);

    return vanGroup;
  }

  function buildFleetVehicles() {
    // Vehicle 1: Lead Sprinter Van navigating east along Avenue
    const van1 = createDeliveryVan('sprinter', 0xe2e8f0);
    van1.position.set(-16, 0, -2.2);
    scene.add(van1);
    vehicles.push({
      mesh: van1,
      speed: 0.08,
      laneZ: -2.2,
      minX: -45,
      maxX: 45,
      direction: 1
    });

    // Vehicle 2: Heavy Box Truck moving west along opposite lane
    const truck = createDeliveryVan('box_truck', 0x1e293b);
    truck.rotation.y = Math.PI;
    truck.position.set(24, 0, 2.2);
    scene.add(truck);
    vehicles.push({
      mesh: truck,
      speed: 0.055,
      laneZ: 2.2,
      minX: -45,
      maxX: 45,
      direction: -1
    });

    // Vehicle 3: Stopped Courier Van at delivery stop #2 with hazard indicators
    const van3 = createDeliveryVan('sprinter', 0x0ea5e9);
    van3.position.set(2, 0, -5.2);
    scene.add(van3);
  }

  function buildAnimatedRoute() {
    // 3D Spline Points representing the optimized delivery path
    const curvePoints = [
      new THREE.Vector3(-36, 0.35, -2.2),
      new THREE.Vector3(-24, 0.35, -2.2),
      new THREE.Vector3(-14, 0.35, -5.0), // Stop 1
      new THREE.Vector3(-2, 0.35, -5.2),  // Stop 2
      new THREE.Vector3(12, 0.35, -2.2),
      new THREE.Vector3(22, 0.35, 2.2),   // Crossover
      new THREE.Vector3(34, 0.35, 2.2)
    ];

    routeSpline = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(routeSpline, 120, 0.14, 8, false);

    const tubeMat = new THREE.MeshStandardMaterial({
      color: COLORS.routeTeal,
      roughness: 0.2,
      metalness: 0.6,
      emissive: COLORS.routeTeal,
      emissiveIntensity: 0.6
    });

    routeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(routeMesh);

    // Glowing Pulse packet travelling along the route
    const pulseGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95
    });
    pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    scene.add(pulseMesh);

    // Light attached to route pulse
    const pulseLight = new THREE.PointLight(0x38bdf8, 2.5, 8);
    pulseMesh.add(pulseLight);

    // Stop Waypoints
    waypointsGroup = new THREE.Group();
    const waypointsData = [
      { pos: new THREE.Vector3(-14, 0.05, -5.0), id: "01", label: "Stop 01 · 14:18" },
      { pos: new THREE.Vector3(-2, 0.05, -5.2), id: "02", label: "Stop 02 · 14:52" },
      { pos: new THREE.Vector3(22, 0.05, 2.2), id: "03", label: "Stop 03 · 15:24" }
    ];

    waypointsData.forEach(wp => {
      // Base glowing ring on ground
      const ringGeo = new THREE.RingGeometry(0.8, 1.1, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: COLORS.routeTeal,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(wp.pos);
      ring.position.y = 0.05;
      waypointsGroup.add(ring);

      // Pulsing pillar
      const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 2.0, 12),
        new THREE.MeshStandardMaterial({
          color: COLORS.routeTeal,
          emissive: COLORS.routeTeal,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.7
        })
      );
      cylinder.position.set(wp.pos.x, 1.05, wp.pos.z);
      waypointsGroup.add(cylinder);

      // Waypoint marker pin head
      const pinHead = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35, 1),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: COLORS.routeTeal,
          emissiveIntensity: 0.8
        })
      );
      pinHead.position.set(wp.pos.x, 2.2, wp.pos.z);
      waypointsGroup.add(pinHead);
    });

    scene.add(waypointsGroup);
  }

  function setupControls() {
    const orbitToggle = document.getElementById('toggle-orbit-btn');
    if (orbitToggle) {
      orbitToggle.addEventListener('click', function () {
        isOrbiting = !isOrbiting;
        this.classList.toggle('active', isOrbiting);
        this.innerHTML = isOrbiting
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Pause Orbit'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume Orbit';
      });
    }

    const resetCam = document.getElementById('reset-camera-btn');
    if (resetCam) {
      resetCam.addEventListener('click', function () {
        camera.position.set(22, 14, 26);
        camera.lookAt(0, 1.5, 0);
        targetOrbitAngle = 0;
      });
    }
  }

  function onMouseMove(e) {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
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

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // 1. Vehicles movement
    vehicles.forEach(v => {
      v.mesh.position.x += v.speed * v.direction;
      if (v.direction > 0 && v.mesh.position.x > v.maxX) {
        v.mesh.position.x = v.minX;
      } else if (v.direction < 0 && v.mesh.position.x < v.minX) {
        v.mesh.position.x = v.maxX;
      }
    });

    // 2. Route pulse animation along spline
    if (routeSpline && pulseMesh) {
      const loopTime = 6.0; // seconds for complete route pulse
      const t = (elapsed % loopTime) / loopTime;
      const pos = routeSpline.getPointAt(t);
      pulseMesh.position.copy(pos);
    }

    // 3. Waypoint markers gentle bob
    if (waypointsGroup) {
      waypointsGroup.children.forEach((child, idx) => {
        if (child.geometry instanceof THREE.OctahedronGeometry) {
          child.rotation.y = elapsed * 1.5;
          child.position.y = 2.2 + Math.sin(elapsed * 2.5 + idx) * 0.12;
        }
      });
    }

    // 4. Smooth Mouse Parallax tracking
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // 5. Restrained slow camera orbital drift
    if (isOrbiting) {
      targetOrbitAngle += delta * 0.045; // calm, dignified pace
    }

    const radius = 34;
    const camX = Math.cos(targetOrbitAngle) * radius + mouse.x * 3.5;
    const camZ = Math.sin(targetOrbitAngle) * radius * 0.85 + mouse.y * 2.0;
    const camY = 14 - mouse.y * 2.5;

    camera.position.x += (camX - camera.position.x) * 0.04;
    camera.position.y += (camY - camera.position.y) * 0.04;
    camera.position.z += (camZ - camera.position.z) * 0.04;
    camera.lookAt(0, 1.8, 0);

    renderer.render(scene, camera);
  }

  /* --------------------------------------------------------------------------
     Procedural Canvas Fallback (For offline environments or WebGL restrictions)
     -------------------------------------------------------------------------- */
  function runHero2DFallback(canvas, container) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let progress = 0;
    const waypoints = [
      { x: 0.15, y: 0.65, label: 'Depot 01' },
      { x: 0.35, y: 0.45, label: 'Stop 01 · 14:18' },
      { x: 0.58, y: 0.60, label: 'Stop 02 · 14:52' },
      { x: 0.78, y: 0.38, label: 'Stop 03 · 15:24' }
    ];

    function render2D() {
      const w = canvas.width;
      const h = canvas.height;
      progress += 0.003;

      // Dusk gradient background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0c121e');
      skyGrad.addColorStop(0.6, '#141c2c');
      skyGrad.addColorStop(1, '#090d15');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle road grid perspective lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 80) {
        ctx.beginPath();
        ctx.moveTo(i, h * 0.3);
        ctx.lineTo(i * 1.4 - w * 0.2, h);
        ctx.stroke();
      }

      // Draw Main Arterial Road
      ctx.fillStyle = '#101724';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.55);
      ctx.lineTo(w, h * 0.35);
      ctx.lineTo(w, h * 0.75);
      ctx.lineTo(0, h * 0.95);
      ctx.closePath();
      ctx.fill();

      // Yellow Road Divider
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.75);
      ctx.lineTo(w, h * 0.55);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Optimized Route Curve
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(waypoints[0].x * w, waypoints[0].y * h);
      for (let i = 1; i < waypoints.length; i++) {
        const xc = (waypoints[i - 1].x + waypoints[i].x) / 2 * w;
        const yc = (waypoints[i - 1].y + waypoints[i].y) / 2 * h;
        ctx.quadraticCurveTo(waypoints[i - 1].x * w, waypoints[i - 1].y * h, xc, yc);
      }
      ctx.lineTo(waypoints[waypoints.length - 1].x * w, waypoints[waypoints.length - 1].y * h);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Flowing Pulse Packet
      const pulseT = (progress * 2) % 1;
      const pulseIdx = Math.min(waypoints.length - 2, Math.floor(pulseT * (waypoints.length - 1)));
      const subT = (pulseT * (waypoints.length - 1)) - pulseIdx;
      const px = (waypoints[pulseIdx].x + (waypoints[pulseIdx + 1].x - waypoints[pulseIdx].x) * subT) * w;
      const py = (waypoints[pulseIdx].y + (waypoints[pulseIdx + 1].y - waypoints[pulseIdx].y) * subT) * h;

      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Waypoints Pins
      waypoints.forEach((wp, idx) => {
        const wx = wp.x * w;
        const wy = wp.y * h;

        ctx.fillStyle = idx === 0 ? '#f59e0b' : '#0ea5e9';
        ctx.beginPath();
        ctx.arc(wx, wy, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText(wp.label, wx + 10, wy - 4);
      });

      // Moving Vehicle with warm headlights
      const vx = ((progress * 180) % (w + 100)) - 50;
      const vy = h * 0.72 - (vx / w) * (h * 0.16);

      // Headlight Beam
      const lightGrad = ctx.createRadialGradient(vx + 32, vy, 2, vx + 90, vy, 60);
      lightGrad.addColorStop(0, 'rgba(255, 244, 214, 0.45)');
      lightGrad.addColorStop(1, 'rgba(255, 244, 214, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(vx + 30, vy - 6);
      ctx.lineTo(vx + 110, vy - 24);
      ctx.lineTo(vx + 110, vy + 24);
      ctx.lineTo(vx + 30, vy + 6);
      ctx.closePath();
      ctx.fill();

      // Vehicle Chassis
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(vx - 20, vy - 8, 48, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(vx + 18, vy - 7, 10, 14);

      // Red Taillight
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(vx - 22, vy - 6, 3, 12);

      requestAnimationFrame(render2D);
    }
    render2D();
  }

  // Self-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
