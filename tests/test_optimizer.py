"""
Unit tests for VeloTrack routing engine and ROI computations.
"""

import sys
import os
import unittest

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from velotrack.optimizer import calculate_fleet_roi, get_default_demo_scenario
from velotrack.telemetry import get_live_fleet_telematics, simulate_dynamic_reroute
from velotrack.config import PRICING_PLANS, BENCHMARKS


class TestVeloTrackCore(unittest.TestCase):

    def test_roi_calculation_reasonable_metrics(self):
        """Verify ROI calculations produce valid economics."""
        res = calculate_fleet_roi(fleet_size=20, avg_miles_day=110, fuel_price=3.90, driver_wage=25.0)
        self.assertGreater(res["total_annual_savings"], 10000)
        self.assertGreater(res["annual_fuel_dollars_saved"], 1000)
        self.assertGreater(res["co2_metric_tons_saved"], 0)
        self.assertGreater(res["net_annual_roi_pct"], 100)
        self.assertEqual(res["fleet_size"], 20)

    def test_demo_scenario_structure(self):
        """Verify demo route scenario has waypoints, depot, and vehicle status."""
        scenario = get_default_demo_scenario()
        self.assertIn("depot", scenario)
        self.assertIn("stops", scenario)
        self.assertIn("optimized_waypoints", scenario)
        self.assertIn("vehicle_capacity", scenario)
        self.assertIn("driver_shift", scenario)
        self.assertIn("comparison", scenario)
        self.assertGreater(len(scenario["stops"]), 3)
        self.assertGreater(len(scenario["optimized_waypoints"]), 5)

    def test_telemetry_stream(self):
        """Verify live telematics generator outputs structured vehicle state."""
        vehicles = get_live_fleet_telematics()
        self.assertEqual(len(vehicles), 5)
        for v in vehicles:
            self.assertIn("id", v)
            self.assertIn("speed_mph", v)
            self.assertIn("fuel_or_battery_pct", v)
            self.assertIn("next_stop", v)

    def test_dynamic_reroute(self):
        """Verify dynamic reroute algorithm simulation response."""
        res = simulate_dynamic_reroute()
        self.assertEqual(res["status"], "re-routed")
        self.assertIn("avoided_delay_min", res["optimization_results"])
        self.assertGreater(res["optimization_results"]["avoided_delay_min"], 0)

    def test_pricing_plans_integrity(self):
        """Verify pricing plans have required tiers."""
        plan_ids = [p["id"] for p in PRICING_PLANS]
        self.assertIn("per-vehicle", plan_ids)
        self.assertIn("per-delivery", plan_ids)
        self.assertIn("enterprise", plan_ids)


if __name__ == "__main__":
    unittest.main()
