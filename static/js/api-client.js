/**
 * VeloTrack - Python REST API Client
 * Interfaces with Python backend endpoints:
 * /api/roi, /api/telemetry, /api/book-demo, /api/reroute
 */

const VeloTrackAPI = (function () {
  'use strict';

  async function calculateROI(fleetSize, avgMiles, fuelPrice, driverWage) {
    const res = await fetch('/api/roi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fleet_size: fleetSize,
        avg_miles_day: avgMiles,
        fuel_price: fuelPrice,
        driver_wage: driverWage
      })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  async function getTelemetry() {
    const res = await fetch('/api/telemetry');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  async function bookDemo(data) {
    const res = await fetch('/api/book-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  }

  async function getConfig() {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  return {
    calculateROI,
    getTelemetry,
    bookDemo,
    getConfig
  };
})();
