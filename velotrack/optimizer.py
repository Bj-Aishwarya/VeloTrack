"""
VeloTrack Route Optimization and Operations Analytics Engine.
Calculates optimal stop sequences, respects vehicle capacity, delivery time windows,
traffic penalties, and produces operational savings comparisons in Indian Rupees (₹).
"""

import math
import random
from typing import List, Dict, Any, Tuple
from .config import BENCHMARKS, CURRENCY_SYMBOL


def format_inr(number: float) -> str:
    """Formats a number in Indian numbering format (e.g. ₹12,45,000)."""
    s = str(int(round(number)))
    if len(s) <= 3:
        return f"₹{s}"
    last_three = s[-3:]
    remaining = s[:-3]
    parts = []
    while len(remaining) > 2:
        parts.insert(0, remaining[-2:])
        remaining = remaining[:-2]
    if remaining:
        parts.insert(0, remaining)
    parts.append(last_three)
    return f"₹{','.join(parts)}"


def calculate_fleet_roi(
    fleet_size: int,
    avg_miles_day: float = 140.0,
    fuel_price: float = 94.80,
    driver_wage: float = 185.0,
    working_days_per_year: int = 260
) -> Dict[str, Any]:
    """
    Computes tangible, auditable operational savings in Indian Rupees (₹)
    from switching from manual dispatch to VeloTrack's optimization engine.
    """
    fleet_size = max(1, int(fleet_size))
    avg_distance_day = max(20.0, float(avg_miles_day))
    fuel_price = max(10.0, float(fuel_price))
    driver_wage = max(50.0, float(driver_wage))

    # Baseline daily fleet metrics
    total_daily_distance = fleet_size * avg_distance_day
    annual_distance = total_daily_distance * working_days_per_year

    # Commercial van fuel economy: ~4.8 km per litre (~11.3 MPG)
    avg_kpl = 4.8
    baseline_annual_fuel_liters = annual_distance / avg_kpl
    baseline_annual_fuel_cost = baseline_annual_fuel_liters * fuel_price

    # Distance & Fuel Savings: 28% reduction by eliminating backtracking & empty miles
    reduced_distance = annual_distance * BENCHMARKS["manual_routing_waste_pct"]
    saved_fuel_liters = baseline_annual_fuel_liters * BENCHMARKS["manual_routing_waste_pct"]
    saved_fuel_rupees = saved_fuel_liters * fuel_price

    # Overtime & Labor Hours Saved:
    # Driver wastes ~0.85 hrs daily in avoidable traffic/bad sequencing
    wasted_hours_per_day_per_driver = 0.85
    saved_labor_hours_annual = fleet_size * wasted_hours_per_day_per_driver * working_days_per_year
    saved_labor_rupees = saved_labor_hours_annual * (driver_wage * 1.30)  # including benefits/overtime

    # Vehicle Wear & Tear: approx ₹8.50 per km saved in tires, brakes, oil & depreciation
    saved_maintenance_rupees = reduced_distance * 8.50

    # Total Annual Net Savings
    total_annual_savings = saved_fuel_rupees + saved_labor_rupees + saved_maintenance_rupees
    monthly_savings = total_annual_savings / 12.0

    # Platform cost estimate (Per-Vehicle plan @ ₹3,499/mo)
    monthly_platform_cost = fleet_size * 3499.0
    annual_platform_cost = monthly_platform_cost * 12.0
    net_annual_roi_pct = round(((total_annual_savings - annual_platform_cost) / max(1.0, annual_platform_cost)) * 100, 1)

    # Environmental CO2 reduction: ~2.68 kg CO2 per litre of diesel
    co2_metric_tons_saved = round((saved_fuel_liters * 2.68) / 1000.0, 1)

    return {
        "currency": CURRENCY_SYMBOL,
        "fleet_size": fleet_size,
        "total_annual_savings": round(total_annual_savings, 2),
        "total_annual_savings_formatted": format_inr(total_annual_savings),
        "monthly_savings": round(monthly_savings, 2),
        "monthly_savings_formatted": format_inr(monthly_savings),
        "annual_fuel_dollars_saved": round(saved_fuel_rupees, 2),
        "annual_fuel_dollars_formatted": format_inr(saved_fuel_rupees),
        "annual_labor_dollars_saved": round(saved_labor_rupees, 2),
        "annual_maintenance_saved": round(saved_maintenance_rupees, 2),
        "annual_fuel_gallons_saved": round(saved_fuel_liters, 1), # liters
        "annual_miles_cut": round(reduced_distance, 0),
        "driver_overtime_hours_saved": round(saved_labor_hours_annual, 0),
        "co2_metric_tons_saved": co2_metric_tons_saved,
        "net_annual_roi_pct": net_annual_roi_pct,
        "monthly_platform_cost": round(monthly_platform_cost, 2),
        "payback_days": round((annual_platform_cost / max(1.0, total_annual_savings)) * 365, 0),
    }


def get_default_demo_scenario(scenario_type: str = "urban_delivery") -> Dict[str, Any]:
    """
    Returns realistic sample fleet routes, stops, and dynamic re-routing comparison
    for interactive 3D dashboard visualization.
    """
    depot = {
        "id": "depot-01",
        "name": "Central Logistics Hub - Pier 48",
        "lat": 37.7712,
        "lng": -122.3891,
        "x": 0.0,
        "z": 0.0,
        "capacity_pallets": 480,
    }

    stops = [
        {
            "id": "STP-101",
            "name": "Harbor Fresh Organics",
            "address": "450 7th Street, Sector 4",
            "x": -2.8,
            "z": 1.4,
            "demand_boxes": 14,
            "weight_lbs": 320,
            "window": "14:00 - 14:45",
            "priority": "High",
            "status": "Completed",
            "eta": "14:18",
            "driver": "Marcus Vance",
            "vehicle": "Van 04 (Electric E-Transit)",
        },
        {
            "id": "STP-102",
            "name": "Pacific Bioscience Labs",
            "address": "1200 Tech Center Blvd",
            "x": 1.2,
            "z": 3.6,
            "demand_boxes": 8,
            "weight_lbs": 160,
            "window": "14:45 - 15:30",
            "priority": "Critical",
            "status": "In-Transit",
            "eta": "14:52",
            "driver": "Marcus Vance",
            "vehicle": "Van 04 (Electric E-Transit)",
        },
        {
            "id": "STP-103",
            "name": "Apex Micro Foundry",
            "address": "888 Industrial Dist. Ring Road",
            "x": -1.5,
            "z": -2.1,
            "demand_boxes": 22,
            "weight_lbs": 480,
            "window": "15:15 - 16:00",
            "priority": "Medium",
            "status": "Scheduled",
            "eta": "15:24",
            "driver": "Marcus Vance",
            "vehicle": "Van 04 (Electric E-Transit)",
        },
        {
            "id": "STP-104",
            "name": "Nordic Medical Supply",
            "address": "2100 Harrison Logistics Zone",
            "x": -4.2,
            "z": -0.8,
            "demand_boxes": 11,
            "weight_lbs": 210,
            "window": "16:00 - 16:45",
            "priority": "High",
            "status": "Scheduled",
            "eta": "16:08",
            "driver": "Marcus Vance",
            "vehicle": "Van 04 (Electric E-Transit)",
        },
        {
            "id": "STP-105",
            "name": "Beacon Retail Flagship",
            "address": "150 Commercial Hub Avenue",
            "x": -0.5,
            "z": -4.2,
            "demand_boxes": 35,
            "weight_lbs": 790,
            "window": "16:45 - 17:30",
            "priority": "Medium",
            "status": "Scheduled",
            "eta": "16:55",
            "driver": "Marcus Vance",
            "vehicle": "Van 04 (Electric E-Transit)",
        },
        {
            "id": "STP-106",
            "name": "Koret Distribution Annex",
            "address": "333 Express Terminal Annex",
            "x": 2.6,
            "z": -3.5,
            "demand_boxes": 19,
            "weight_lbs": 410,
            "window": "17:30 - 18:15",
            "priority": "Low",
            "status": "Scheduled",
            "eta": "17:40",
            "driver": "Marcus Vance",
            "vehicle": "Van 04 (Electric E-Transit)",
        }
    ]

    optimized_waypoints = [
        {"x": 0.0, "y": 0.15, "z": 0.0, "label": "Pier 48 Depot"},
        {"x": -1.2, "y": 0.15, "z": 0.8},
        {"x": -2.8, "y": 0.15, "z": 1.4, "label": "Stop 01 · Harbor Fresh"},
        {"x": -1.1, "y": 0.15, "z": 2.5},
        {"x": 1.2, "y": 0.15, "z": 3.6, "label": "Stop 02 · Pacific Bio"},
        {"x": 0.2, "y": 0.15, "z": 0.5},
        {"x": -1.5, "y": 0.15, "z": -2.1, "label": "Stop 03 · Apex Foundry"},
        {"x": -3.1, "y": 0.15, "z": -1.2},
        {"x": -4.2, "y": 0.15, "z": -0.8, "label": "Stop 04 · Nordic Medical"},
        {"x": -2.2, "y": 0.15, "z": -3.2},
        {"x": -0.5, "y": 0.15, "z": -4.2, "label": "Stop 05 · Beacon Retail"},
        {"x": 1.5, "y": 0.15, "z": -3.8},
        {"x": 2.6, "y": 0.15, "z": -3.5, "label": "Stop 06 · Koret Annex"},
        {"x": 1.4, "y": 0.15, "z": -1.4},
        {"x": 0.0, "y": 0.15, "z": 0.0, "label": "Pier 48 Return"}
    ]

    manual_waypoints = [
        {"x": 0.0, "y": 0.15, "z": 0.0},
        {"x": -0.5, "y": 0.15, "z": -4.2},
        {"x": 1.2, "y": 0.15, "z": 3.6},
        {"x": -4.2, "y": 0.15, "z": -0.8},
        {"x": 2.6, "y": 0.15, "z": -3.5},
        {"x": -2.8, "y": 0.15, "z": 1.4},
        {"x": -1.5, "y": 0.15, "z": -2.1},
        {"x": 0.0, "y": 0.15, "z": 0.0}
    ]

    vehicle_capacity = {
        "vehicle_id": "VAN-04",
        "model": "Ford E-Transit 350 High Roof",
        "driver": "Marcus Vance",
        "cubic_volume_cuft": 487,
        "cubic_utilization_pct": 86.4,
        "payload_weight_lbs": 3800,
        "current_weight_lbs": 2980,
        "weight_utilization_pct": 78.4,
        "battery_soc_pct": 68,
        "range_remaining_mi": 92,
        "stops_total": 6,
        "stops_completed": 1,
        "time_window_accuracy_pct": 99.8,
    }

    driver_shift = {
        "shift_start": "08:00",
        "shift_end": "16:45",
        "planned_duration_hours": 8.75,
        "timeline_events": [
            {"time": "08:00 - 08:30", "type": "depot", "title": "Cross-Dock Loading & Pre-Trip Inspection", "duration_m": 30},
            {"time": "08:30 - 11:45", "type": "transit", "title": "Morning Route (Zone A - 12 Stops)", "duration_m": 195},
            {"time": "11:45 - 12:30", "type": "break", "title": "Mandated Rest & Meal Break", "duration_m": 45},
            {"time": "12:30 - 16:15", "type": "transit", "title": "Afternoon Route (Zone B - 16 Stops)", "duration_m": 225},
            {"time": "16:15 - 16:45", "type": "depot", "title": "Return Depot & Post-Trip Scan", "duration_m": 30}
        ]
    }

    comparison = {
        "currency": "₹",
        "manual_routing": {
            "total_miles": 78.4,
            "total_drive_time_min": 244,
            "fuel_cost_est": "₹2,180",
            "driver_overtime_min": 45,
            "on_time_rate_pct": 81.2,
            "empty_miles_pct": 31.8
        },
        "velotrack_optimized": {
            "total_miles": 56.1,
            "total_drive_time_min": 178,
            "fuel_cost_est": "₹1,560",
            "driver_overtime_min": 0,
            "on_time_rate_pct": 99.4,
            "empty_miles_pct": 8.2
        },
        "variance": {
            "miles_saved": 22.3,
            "miles_saved_pct": 28.4,
            "time_saved_min": 66,
            "fuel_savings_pct": 28.5,
            "overtime_prevented": "100%"
        }
    }

    return {
        "depot": depot,
        "stops": stops,
        "optimized_waypoints": optimized_waypoints,
        "manual_waypoints": manual_waypoints,
        "vehicle_capacity": vehicle_capacity,
        "driver_shift": driver_shift,
        "comparison": comparison,
    }
