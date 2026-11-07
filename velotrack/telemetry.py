"""
Live Fleet Telematics Simulator for VeloTrack.
Streams real-time vehicle positions, battery/fuel status, speed, and dynamically
responds to live road incident alerts with re-sequencing.
"""

import time
import math
import random
from typing import List, Dict, Any


def get_live_fleet_telematics() -> List[Dict[str, Any]]:
    """
    Simulates real-time telemetry from 5 active fleet vehicles across urban routes.
    """
    current_timestamp = time.strftime("%H:%M:%S")
    now_seed = time.time() / 10.0

    vehicles = [
        {
            "id": "VAN-01",
            "name": "Sprinter 2500 #01",
            "driver": "Elena Rostova",
            "type": "Sprinter Van",
            "status": "In Transit",
            "speed_mph": round(28.5 + math.sin(now_seed * 1.1) * 6, 1),
            "fuel_or_battery_pct": 74,
            "fuel_type": "Diesel",
            "capacity_utilization": "89%",
            "current_location": "Market & 5th St",
            "next_stop": "STP-204 (Omni Logistics)",
            "eta": "14:38",
            "variance_min": -2, # 2 minutes ahead of schedule
            "telemetry": {
                "engine_temp_f": 194,
                "tire_pressure_psi": 44,
                "idle_time_min": 4.2
            }
        },
        {
            "id": "VAN-04",
            "name": "E-Transit 350 #04",
            "driver": "Marcus Vance",
            "type": "Electric Cargo Van",
            "status": "At Delivery Stop",
            "speed_mph": 0.0,
            "fuel_or_battery_pct": 68,
            "fuel_type": "Electric (EV)",
            "capacity_utilization": "86%",
            "current_location": "Mission Bay Blvd S",
            "next_stop": "STP-102 (Pacific Bioscience)",
            "eta": "14:52",
            "variance_min": 0, # Exactly on schedule
            "telemetry": {
                "battery_temp_c": 28,
                "kwh_per_mile": 0.78,
                "regenerative_kwh": 3.8
            }
        },
        {
            "id": "TRK-09",
            "name": "Freightliner M2 #09",
            "driver": "Dave Kincaid",
            "type": "24ft Box Truck",
            "status": "In Transit",
            "speed_mph": round(34.2 + math.cos(now_seed * 0.9) * 4, 1),
            "fuel_or_battery_pct": 82,
            "fuel_type": "Diesel",
            "capacity_utilization": "94%",
            "current_location": "US-101 Northbound",
            "next_stop": "STP-310 (West Coast Cold Storage)",
            "eta": "15:10",
            "variance_min": +1,
            "telemetry": {
                "engine_temp_f": 202,
                "gross_weight_lbs": 21400,
                "reefer_temp_f": 34.2 # refrigerated cargo
            }
        },
        {
            "id": "VAN-07",
            "name": "Transit Connect #07",
            "driver": "Samira Khan",
            "type": "Compact Courier Van",
            "status": "In Transit",
            "speed_mph": round(22.0 + math.sin(now_seed * 1.5) * 5, 1),
            "fuel_or_battery_pct": 59,
            "fuel_type": "Gasoline",
            "capacity_utilization": "92%",
            "current_location": "Embarcadero South",
            "next_stop": "STP-188 (Bay Courier Depot)",
            "eta": "14:46",
            "variance_min": -3, # Ahead
            "telemetry": {
                "engine_temp_f": 188,
                "tire_pressure_psi": 36,
                "idle_time_min": 2.1
            }
        },
        {
            "id": "VAN-12",
            "name": "BrightDrop Zevo #12",
            "driver": "Tariq Owens",
            "type": "Electric Delivery Van",
            "status": "In Transit",
            "speed_mph": round(26.4 + math.cos(now_seed * 1.3) * 7, 1),
            "fuel_or_battery_pct": 81,
            "fuel_type": "Electric (EV)",
            "capacity_utilization": "81%",
            "current_location": "Folsom & 8th St",
            "next_stop": "STP-402 (Foundry Co-Op)",
            "eta": "15:04",
            "variance_min": 0,
            "telemetry": {
                "battery_temp_c": 27,
                "kwh_per_mile": 0.72,
                "regenerative_kwh": 4.1
            }
        }
    ]

    return vehicles


def simulate_dynamic_reroute(incident_type: str = "arterial_congestion") -> Dict[str, Any]:
    """
    Simulates VeloTrack's sub-second real-time re-optimization when an operational
    incident occurs (e.g. accident on bridge, sudden road closure, or order priority change).
    """
    return {
        "status": "re-routed",
        "incident": {
            "type": incident_type,
            "location": "Bay Bridge Westbound / 5th St Off-Ramp",
            "delay_without_optimization_min": 32,
            "detected_at": time.strftime("%H:%M:%S"),
        },
        "optimization_results": {
            "time_to_recalculate_ms": 142,
            "stops_reordered": ["STP-104 swapped with STP-103", "STP-105 routed via Embarcadero arterial"],
            "avoided_delay_min": 24,
            "final_variance_min": +2,
            "fuel_burn_delta_pct": -4.2,
            "driver_notified": True,
            "driver_message": "Traffic detected on 5th St. Route updated: take Folsom St bypass to avoid 24 min delay."
        }
    }
