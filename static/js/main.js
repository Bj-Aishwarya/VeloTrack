/**
 * VeloTrack - Main Application Controller
 * Handles Theme Toggling, ROI Calculator, Pricing Switch,
 * Demo Modals, and Telemetry Updates.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initRoiCalculator();
    initPricingBillingToggle();
    initDemoModals();
    initTelemetryStream();
    initSmoothScrolling();
  });

  /* --------------------------------------------------------------------------
     1. Theme Toggle (Dark Primary / Light Option)
     -------------------------------------------------------------------------- */
  function initThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (!toggleBtn) return;

    // Default to dark mode
    const savedTheme = localStorage.getItem('velotrack_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('velotrack_theme', next);
      updateThemeIcon(next);
    });
  }

  function updateThemeIcon(theme) {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (!toggleBtn) return;

    if (theme === 'light') {
      toggleBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
        </svg>
      `;
      toggleBtn.setAttribute('title', 'Switch to Dark Mode');
    } else {
      toggleBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
      toggleBtn.setAttribute('title', 'Switch to Light Mode');
    }
  }

  /* Helper: Format Indian Rupee Currency */
  function formatINR(num) {
    if (isNaN(num)) return '₹0';
    const s = Math.round(num).toString();
    if (s.length <= 3) return '₹' + s;
    const lastThree = s.substring(s.length - 3);
    let remaining = s.substring(0, s.length - 3);
    const parts = [];
    while (remaining.length > 2) {
      parts.unshift(remaining.substring(remaining.length - 2));
      remaining = remaining.substring(0, remaining.length - 2);
    }
    if (remaining.length > 0) parts.unshift(remaining);
    parts.push(lastThree);
    return '₹' + parts.join(',');
  }

  /* --------------------------------------------------------------------------
     2. Interactive ROI Fleet Calculator (Rupee Economics)
     -------------------------------------------------------------------------- */
  function initRoiCalculator() {
    const fleetSlider = document.getElementById('calc-fleet-size');
    const milesSlider = document.getElementById('calc-miles-day');
    const fuelSlider = document.getElementById('calc-fuel-cost');
    const wageSlider = document.getElementById('calc-driver-wage');

    if (!fleetSlider || !milesSlider) return;

    let debounceTimer;

    function runCalculation() {
      const fleetSize = parseInt(fleetSlider.value, 10);
      const kmOrMiles = parseFloat(milesSlider.value);
      const fuel = parseFloat(fuelSlider.value);
      const wage = parseFloat(wageSlider.value);

      // Update text displays
      const fleetValEl = document.getElementById('calc-fleet-val');
      const milesValEl = document.getElementById('calc-miles-val');
      const fuelValEl = document.getElementById('calc-fuel-val');
      const wageValEl = document.getElementById('calc-wage-val');

      if (fleetValEl) fleetValEl.innerText = `${fleetSize} vehicles`;
      if (milesValEl) milesValEl.innerText = `${kmOrMiles} km / day`;
      if (fuelValEl) fuelValEl.innerText = `₹${fuel.toFixed(2)} / L`;
      if (wageValEl) wageValEl.innerText = `₹${wage.toFixed(2)} / hr`;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        VeloTrackAPI.calculateROI(fleetSize, kmOrMiles, fuel, wage)
          .then(data => {
            updateRoiUI(data);
          })
          .catch(err => {
            console.error('ROI calculation error:', err);
          });
      }, 100);
    }

    [fleetSlider, milesSlider, fuelSlider, wageSlider].forEach(slider => {
      if (slider) slider.addEventListener('input', runCalculation);
    });

    // Run initial calculation
    runCalculation();
  }

  function updateRoiUI(data) {
    const totalEl = document.getElementById('roi-total-savings');
    const monthlyEl = document.getElementById('roi-monthly-savings');
    const fuelEl = document.getElementById('roi-fuel-saved');
    const overtimeEl = document.getElementById('roi-overtime-saved');
    const co2El = document.getElementById('roi-co2-saved');
    const paybackEl = document.getElementById('roi-payback-days');

    const formattedAnnual = data.total_annual_savings_formatted || formatINR(data.total_annual_savings);
    const formattedMonthly = data.monthly_savings_formatted || formatINR(data.monthly_savings);
    const formattedFuel = data.annual_fuel_dollars_formatted || formatINR(data.annual_fuel_dollars_saved);

    if (totalEl) totalEl.innerText = formattedAnnual;
    if (monthlyEl) monthlyEl.innerText = `${formattedMonthly} / mo net operational savings`;
    if (fuelEl) fuelEl.innerText = formattedFuel;
    if (overtimeEl) overtimeEl.innerText = `${data.driver_overtime_hours_saved.toLocaleString()} hrs`;
    if (co2El) co2El.innerText = `${data.co2_metric_tons_saved} tons`;
    if (paybackEl) paybackEl.innerText = `${data.payback_days} days`;
  }

  /* --------------------------------------------------------------------------
     3. Pricing Billing Switch (Monthly vs Annual in ₹ Rupees)
     -------------------------------------------------------------------------- */
  function initPricingBillingToggle() {
    const switchBtn = document.getElementById('pricing-billing-switch');
    if (!switchBtn) return;

    let isAnnual = false;

    switchBtn.addEventListener('click', () => {
      isAnnual = !isAnnual;
      switchBtn.classList.toggle('switch-active', isAnnual);

      const vehiclePriceEl = document.getElementById('price-vehicle-amt');
      const deliveryPriceEl = document.getElementById('price-delivery-amt');
      const vehicleUnitEl = document.getElementById('price-vehicle-unit');

      if (isAnnual) {
        if (vehiclePriceEl) vehiclePriceEl.innerText = '₹2,799';
        if (deliveryPriceEl) deliveryPriceEl.innerText = '₹5.20';
        if (vehicleUnitEl) vehicleUnitEl.innerText = '/ vehicle / mo (billed annually)';
      } else {
        if (vehiclePriceEl) vehiclePriceEl.innerText = '₹3,499';
        if (deliveryPriceEl) deliveryPriceEl.innerText = '₹6.50';
        if (vehicleUnitEl) vehicleUnitEl.innerText = '/ vehicle / mo (billed monthly)';
      }
    });
  }

  /* --------------------------------------------------------------------------
     4. Demo Modals & Submission Flow
     -------------------------------------------------------------------------- */
  function initDemoModals() {
    const modal = document.getElementById('demo-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const openBtns = document.querySelectorAll('.open-demo-modal-btn');
    const demoForm = document.getElementById('modal-demo-form');
    const yardForm = document.getElementById('yard-demo-form');

    function openModal() {
      if (modal) modal.classList.add('open');
    }

    function closeModal() {
      if (modal) modal.classList.remove('open');
    }

    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Modal form submission
    if (demoForm) {
      demoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(demoForm, true);
      });
    }

    // Yard bottom CTA quick form
    if (yardForm) {
      yardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(yardForm, false);
      });
    }
  }

  function handleFormSubmit(formEl, isModal) {
    const submitBtn = formEl.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `Scheduling Audit...`;

    const payload = {
      name: formEl.querySelector('[name="name"]').value,
      email: formEl.querySelector('[name="email"]').value,
      company: formEl.querySelector('[name="company"]').value,
      fleet_size: formEl.querySelector('[name="fleet_size"]').value,
      phone: formEl.querySelector('[name="phone"]') ? formEl.querySelector('[name="phone"]').value : '',
      fleet_type: formEl.querySelector('[name="fleet_type"]') ? formEl.querySelector('[name="fleet_type"]').value : 'Logistics'
    };

    VeloTrackAPI.bookDemo(payload)
      .then(res => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (res.success) {
          formEl.innerHTML = `
            <div style="text-align:center;padding:24px 0;">
              <div style="width:52px;height:52px;border-radius:50%;background:rgba(16,185,129,0.15);border:1px solid #10b981;color:#10b981;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 style="font-size:1.3rem;margin-bottom:8px;color:#f1f5f9;">Fleet Audit Confirmed!</h3>
              <p style="font-size:0.9rem;color:#94a3b8;line-height:1.5;">${res.message}</p>
              <div style="margin-top:18px;font-family:monospace;font-size:0.8rem;color:#0ea5e9;background:#0d1420;padding:8px 12px;border-radius:4px;display:inline-block;">
                Audit Ticket Reference: ${res.booking.id}
              </div>
            </div>
          `;
        } else {
          alert(res.error || 'Unable to schedule demo. Please check required fields.');
        }
      })
      .catch(err => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        alert('Network error. Please verify the Python server is running.');
      });
  }

  /* --------------------------------------------------------------------------
     5. Live Telemetry Poller (Real-time fleet status)
     -------------------------------------------------------------------------- */
  function initTelemetryStream() {
    function poll() {
      VeloTrackAPI.getTelemetry()
        .then(data => {
          if (data && data.vehicles) {
            updateTelemetryDOM(data.vehicles);
          }
        })
        .catch(() => {});
    }

    // Poll every 5 seconds
    setInterval(poll, 5000);
  }

  function updateTelemetryDOM(vehicles) {
    vehicles.forEach(v => {
      const vEl = document.querySelector(`[data-vehicle-id="${v.id}"]`);
      if (vEl) {
        const speedEl = vEl.querySelector('.vehicle-speed');
        if (speedEl) speedEl.innerText = `${v.speed_mph} mph`;
      }
    });
  }

  /* --------------------------------------------------------------------------
     6. Smooth Scrolling for Navigation
     -------------------------------------------------------------------------- */
  function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
})();
