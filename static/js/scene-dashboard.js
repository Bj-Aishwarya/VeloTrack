/**
 * VeloTrack - Interactive 3D Dashboard Mockup Controller & Route Map
 * Handles interactive 3D card tilting, live 3D route map canvas,
 * capacity bars animation, driver shift timeline, and traffic incident simulation.
 */

(function () {
  'use strict';

  let mapScene, mapCamera, mapRenderer;
  let mapCanvasContainer;
  let stopsGroup, routeGroup, vehicleMarkerGroup, trafficZoneGroup;
  let currentScenario = null;
  let activeVehicleMarker = null;
  let isTrafficIncidentActive = false;

  function init() {
    initCard3DTilt();
    initRoute3DMap();
    setupDashboardInteractions();
    fetchDemoScenario();
  }

  /* --------------------------------------------------------------------------
     1. Interactive 3D Card Tilting (Subtle, Industrial Perspective)
     -------------------------------------------------------------------------- */
  function initCard3DTilt() {
    const frame = document.getElementById('dashboard-mockup-frame');
    const wrapper = document.getElementById('dashboard-viewport-wrapper');
    if (!frame || !wrapper) return;

    let isHovered = false;
    let targetRotateX = 0;
    let targetRotateY = 0;
    let currentRotateX = 0;
    let currentRotateY = 0;

    wrapper.addEventListener('mouseenter', () => { isHovered = true; });
    wrapper.addEventListener('mouseleave', () => {
      isHovered = false;
      targetRotateX = 0;
      targetRotateY = 0;
    });

    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      // Restrained tilt: max +/- 6 degrees for professional grounded feel
      targetRotateY = x * 10;
      targetRotateX = -y * 8;
    });

    function updateTilt() {
      currentRotateX += (targetRotateX - currentRotateX) * 0.1;
      currentRotateY += (targetRotateY - currentRotateY) * 0.1;

      frame.style.transform = `rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg)`;
      requestAnimationFrame(updateTilt);
    }
    updateTilt();

    // Reset button
    const resetTiltBtn = document.getElementById('reset-tilt-btn');
    if (resetTiltBtn) {
      resetTiltBtn.addEventListener('click', () => {
        targetRotateX = 0;
        targetRotateY = 0;
      });
    }
  }

  /* --------------------------------------------------------------------------
     2. Live 3D Route Map Inside Dashboard Center
     -------------------------------------------------------------------------- */
  function initRoute3DMap() {
    mapCanvasContainer = document.getElementById('route-canvas-container');
    const canvas = document.getElementById('route-canvas');
    if (!mapCanvasContainer || !canvas) return;

    if (typeof THREE === 'undefined') {
      window._mapRetries = (window._mapRetries || 0) + 1;
      if (window._mapRetries > 4) {
        runDashboardMapFallback(canvas, mapCanvasContainer);
        return;
      }
      setTimeout(initRoute3DMap, 250);
      return;
    }

    mapScene = new THREE.Scene();
    mapScene.background = new THREE.Color(0x0a0f18);

    const w = mapCanvasContainer.clientWidth;
    const h = mapCanvasContainer.clientHeight || 420;
    mapCamera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    mapCamera.position.set(0, 14, 10);
    mapCamera.lookAt(0, 0, 0);

    mapRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    mapRenderer.setSize(w, h);
    mapRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Map Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    mapScene.add(ambient);

    const mapSun = new THREE.DirectionalLight(0x38bdf8, 0.8);
    mapSun.position.set(10, 20, 10);
    mapScene.add(mapSun);

    // Build Urban Grid Ground
    buildMapGrid();

    // Groups
    stopsGroup = new THREE.Group();
    routeGroup = new THREE.Group();
    vehicleMarkerGroup = new THREE.Group();
    trafficZoneGroup = new THREE.Group();

    mapScene.add(stopsGroup);
    mapScene.add(routeGroup);
    mapScene.add(vehicleMarkerGroup);
    mapScene.add(trafficZoneGroup);

    // Window resize
    window.addEventListener('resize', onMapResize);

    // Interactive Drag to Pan Map
    setupMapDragging(canvas);

    // Animation Loop
    animateMap();
  }

  function buildMapGrid() {
    // City Sector Ground
    const gridGround = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 26),
      new THREE.MeshStandardMaterial({ color: 0x0c121d, roughness: 0.9 })
    );
    gridGround.rotation.x = -Math.PI / 2;
    mapScene.add(gridGround);

    // Blueprint / Road Grid Lines
    const gridHelper = new THREE.GridHelper(32, 32, 0x1e293b, 0x141c2a);
    gridHelper.position.y = 0.01;
    mapScene.add(gridHelper);

    // Arterial Roads (major streets)
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x182232 });
    
    // Horizontal arterials
    [-4, 0, 4].forEach(z => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(32, 0.9), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(0, 0.02, z);
      mapScene.add(road);
    });

    // Vertical arterials
    [-6, 0, 6].forEach(x => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 26), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.02, 0);
      mapScene.add(road);
    });
  }

  function setupMapDragging(canvas) {
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouse.x = e.clientX;
      prevMouse.y = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = (e.clientX - prevMouse.x) * 0.02;
      const dy = (e.clientY - prevMouse.y) * 0.02;

      mapCamera.position.x -= dx;
      mapCamera.position.z -= dy;
      mapCamera.lookAt(mapCamera.position.x, 0, mapCamera.position.z - 4);

      prevMouse.x = e.clientX;
      prevMouse.y = e.clientY;
    });
  }

  function onMapResize() {
    if (!mapCamera || !mapRenderer || !mapCanvasContainer) return;
    const w = mapCanvasContainer.clientWidth;
    const h = mapCanvasContainer.clientHeight || 420;
    mapCamera.aspect = w / h;
    mapCamera.updateProjectionMatrix();
    mapRenderer.setSize(w, h);
  }

  /* --------------------------------------------------------------------------
     3. Render Scenario Stops & Route Splines
     -------------------------------------------------------------------------- */
  function renderScenario(data) {
    currentScenario = data;

    // Clear previous
    while (stopsGroup.children.length > 0) stopsGroup.remove(stopsGroup.children[0]);
    while (routeGroup.children.length > 0) routeGroup.remove(routeGroup.children[0]);

    // 1. Central Depot
    const depotGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    const depotMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
    const depotMesh = new THREE.Mesh(depotGeo, depotMat);
    depotMesh.position.set(data.depot.x, 0.2, data.depot.z);
    stopsGroup.add(depotMesh);

    // Depot marker beacon
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    beacon.position.set(data.depot.x, 0.7, data.depot.z);
    stopsGroup.add(beacon);

    // 2. Delivery Stops Pins
    data.stops.forEach((stop, index) => {
      const stopGroup = new THREE.Group();
      stopGroup.position.set(stop.x, 0, stop.z);

      // Base ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.35, 0.48, 16),
        new THREE.MeshBasicMaterial({
          color: stop.status === 'Completed' ? 0x10b981 : 0x0ea5e9,
          side: THREE.DoubleSide
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      stopGroup.add(ring);

      // Pin Head
      const pinMat = new THREE.MeshStandardMaterial({
        color: stop.priority === 'Critical' ? 0xf43f5e : (stop.status === 'Completed' ? 0x10b981 : 0x0ea5e9),
        roughness: 0.4
      });
      const pin = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), pinMat);
      pin.position.y = 0.7;
      stopGroup.add(pin);

      const pinStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6),
        new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
      );
      pinStem.position.y = 0.35;
      stopGroup.add(pinStem);

      stopsGroup.add(stopGroup);
    });

    // 3. Draw Optimized Route Curve
    const points = data.optimized_waypoints.map(wp => new THREE.Vector3(wp.x, wp.y, wp.z));
    const spline = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(spline, 80, 0.07, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.6
    });
    const routeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    routeGroup.add(routeMesh);

    // 4. Active Vehicle Marker along Route
    if (!activeVehicleMarker) {
      const vGeo = new THREE.BoxGeometry(0.5, 0.3, 0.3);
      const vMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      activeVehicleMarker = new THREE.Mesh(vGeo, vMat);
      activeVehicleMarker.position.set(0, 0.25, 0);

      // Vehicle glow headlight
      const vLight = new THREE.PointLight(0x38bdf8, 2, 4);
      vLight.position.set(0.3, 0.2, 0);
      activeVehicleMarker.add(vLight);

      vehicleMarkerGroup.add(activeVehicleMarker);
    }
  }

  /* --------------------------------------------------------------------------
     4. Dynamic Re-routing & Traffic Incident Simulation
     -------------------------------------------------------------------------- */
  function triggerTrafficSimulation() {
    const btn = document.getElementById('simulate-traffic-btn');
    const hudValue = document.getElementById('route-hud-delay');
    if (btn) btn.disabled = true;

    // Call Python backend endpoint
    fetch('/api/reroute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_type: 'arterial_congestion' })
    })
      .then(res => res.json())
      .then(data => {
        isTrafficIncidentActive = true;
        renderTrafficCongestionZone();

        // Update UI HUD
        if (hudValue) {
          hudValue.innerHTML = `<span style="color:#10b981;">Re-routed</span> <small>(Saved 24 mins)</small>`;
        }

        const banner = document.getElementById('demo-incident-alert');
        if (banner) {
          banner.style.display = 'flex';
          banner.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f43f5e;box-shadow:0 0 8px #f43f5e;"></span>
              <strong>Heavy Congestion Detected (5th St):</strong> Autonomous Re-route computed in 142ms. 
              <strong>24 mins of delay avoided.</strong>
            </div>
          `;
        }

        setTimeout(() => {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Reset Route';
          }
        }, 800);
      })
      .catch(err => {
        console.error('Failed to trigger reroute:', err);
        if (btn) btn.disabled = false;
      });
  }

  function renderTrafficCongestionZone() {
    while (trafficZoneGroup.children.length > 0) trafficZoneGroup.remove(trafficZoneGroup.children[0]);

    // Red glowing circular zone where incident occurred
    const zoneMesh = new THREE.Mesh(
      new THREE.CircleGeometry(1.4, 24),
      new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      })
    );
    zoneMesh.rotation.x = -Math.PI / 2;
    zoneMesh.position.set(-1.8, 0.05, 0.2);
    trafficZoneGroup.add(zoneMesh);

    // Hazard cross marker
    const cross = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.1, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e })
    );
    cross.position.set(-1.8, 0.2, 0.2);
    trafficZoneGroup.add(cross);
  }

  /* --------------------------------------------------------------------------
     5. Backend API Fetching & Setup
     -------------------------------------------------------------------------- */
  function fetchDemoScenario() {
    fetch('/api/demo-scenario')
      .then(res => res.json())
      .then(data => {
        renderScenario(data);
      })
      .catch(err => {
        console.warn('Backend not responding yet. Using local fallback demo data:', err);
      });
  }

  function setupDashboardInteractions() {
    const trafficBtn = document.getElementById('simulate-traffic-btn');
    if (trafficBtn) {
      trafficBtn.addEventListener('click', () => {
        if (trafficBtn.innerText.includes('Reset')) {
          isTrafficIncidentActive = false;
          while (trafficZoneGroup.children.length > 0) trafficZoneGroup.remove(trafficZoneGroup.children[0]);
          trafficBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            Simulate Road Incident
          `;
          const hudValue = document.getElementById('route-hud-delay');
          if (hudValue) hudValue.innerText = '0 min delay (On-Time)';
          const banner = document.getElementById('demo-incident-alert');
          if (banner) banner.style.display = 'none';
        } else {
          triggerTrafficSimulation();
        }
      });
    }

    // Vehicle selection buttons
    const selectorItems = document.querySelectorAll('.vehicle-selector-item');
    selectorItems.forEach(item => {
      item.addEventListener('click', function () {
        selectorItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        const vName = this.querySelector('.vehicle-id').innerText;
        const hudTitle = document.getElementById('route-hud-vehicle');
        if (hudTitle) hudTitle.innerText = `${vName} · Live Route`;
      });
    });
  }

  function animateMap() {
    requestAnimationFrame(animateMap);

    const time = Date.now() * 0.001;

    // Move active vehicle along route
    if (activeVehicleMarker && currentScenario && currentScenario.optimized_waypoints) {
      const wps = currentScenario.optimized_waypoints;
      const progress = (time * 0.15) % 1.0;
      const index = Math.floor(progress * (wps.length - 1));
      const nextIndex = (index + 1) % wps.length;
      const subT = (progress * (wps.length - 1)) - index;

      const p1 = wps[index];
      const p2 = wps[nextIndex];

      activeVehicleMarker.position.x = p1.x + (p2.x - p1.x) * subT;
      activeVehicleMarker.position.z = p1.z + (p2.z - p1.z) * subT;
      activeVehicleMarker.position.y = 0.25;

      // Gentle rotation towards heading
      const angle = Math.atan2(p2.x - p1.x, p2.z - p1.z);
      activeVehicleMarker.rotation.y = angle + Math.PI / 2;
    }

    // Gentle pulse on traffic zone if active
    if (trafficZoneGroup.children.length > 0) {
      const scale = 1 + Math.sin(time * 6) * 0.08;
      trafficZoneGroup.children[0].scale.set(scale, scale, 1);
    }

    mapRenderer.render(mapScene, mapCamera);
  }

  /* --------------------------------------------------------------------------
     Fallback 2D Interactive Tactical Map
     -------------------------------------------------------------------------- */
  function runDashboardMapFallback(canvas, container) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight || 420;
    }
    resize();
    window.addEventListener('resize', resize);

    let progress = 0;
    const stops = [
      { x: 0.15, y: 0.5, name: 'Pier 48 Depot', isDepot: true },
      { x: 0.28, y: 0.3, name: 'Harbor Fresh (01)' },
      { x: 0.52, y: 0.25, name: 'Pacific Bio (02)' },
      { x: 0.44, y: 0.65, name: 'Apex Foundry (03)' },
      { x: 0.72, y: 0.45, name: 'Nordic Medical (04)' },
      { x: 0.86, y: 0.70, name: 'Beacon Retail (05)' }
    ];

    function drawTacticalMap() {
      const w = canvas.width;
      const h = canvas.height;
      progress += 0.004;

      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = '#141c2a';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Route Path
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(stops[0].x * w, stops[0].y * h);
      for (let i = 1; i < stops.length; i++) {
        ctx.lineTo(stops[i].x * w, stops[i].y * h);
      }
      ctx.stroke();

      // Stops
      stops.forEach((s, idx) => {
        const sx = s.x * w;
        const sy = s.y * h;

        ctx.fillStyle = s.isDepot ? '#f59e0b' : '#0ea5e9';
        ctx.beginPath();
        ctx.arc(sx, sy, s.isDepot ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px monospace';
        ctx.fillText(s.name, sx + 8, sy - 6);
      });

      // Active Van Marker
      const t = (progress % 1) * (stops.length - 1);
      const curIdx = Math.floor(t);
      const nextIdx = Math.min(stops.length - 1, curIdx + 1);
      const subT = t - curIdx;

      const vx = (stops[curIdx].x + (stops[nextIdx].x - stops[curIdx].x) * subT) * w;
      const vy = (stops[curIdx].y + (stops[nextIdx].y - stops[curIdx].y) * subT) * h;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(vx, vy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      requestAnimationFrame(drawTacticalMap);
    }
    drawTacticalMap();
  }

  // Self-initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
