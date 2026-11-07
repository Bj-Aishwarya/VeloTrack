"""
Configuration and domain constants for VeloTrack Fleet Optimization Platform.
Indian Rupee (₹) benchmarks, realistic fleet metrics and pricing tiers.
"""

from typing import Dict, Any

# Server settings
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8000

# Currency symbol
CURRENCY_SYMBOL = "₹"

# Industry Benchmark Averages (standard commercial fleet operations)
BENCHMARKS = {
    "fuel_cost_per_liter": 94.80,          # Average diesel price per litre in ₹
    "driver_hourly_wage": 185.0,           # Average commercial driver hourly wage in ₹
    "average_km_per_vehicle_day": 140.0,   # Average daily run in km
    "avg_stops_per_driver": 38,
    "manual_routing_waste_pct": 0.28,      # 28% reduction in fuel/km with VeloTrack
    "overtime_reduction_pct": 0.35,        # 35% reduction in overtime hours
    "utilization_improvement_pct": 0.34,   # 34% increase in vehicle cubic utilization
    "on_time_baseline_pct": 82.4,          # Manual routing on-time %
    "on_time_velotrack_pct": 99.4,         # VeloTrack optimized on-time %
}

# Pricing Plans (in Indian Rupees ₹)
PRICING_PLANS = [
    {
        "id": "per-vehicle",
        "name": "Per-Vehicle Fleet",
        "badge": "Most Popular for 10-50 Vans",
        "price_monthly": 3499,
        "price_annual": 2799,
        "currency": "₹",
        "billing_unit": "per vehicle / month",
        "description": "Full automated dynamic routing, live dispatcher console, and driver turn-by-turn mobile app.",
        "features": [
            "Unlimited stops & dynamic re-optimizations",
            "Multi-compartment & vehicle capacity limits",
            "Driver mobile app (iOS & Android) with turn-by-turn",
            "Real-time GPS telematics & geofenced arrival alerts",
            "Proof-of-delivery (photo, signature, OTP & barcode scan)",
            "Standard REST API & Webhooks",
            "Standard 99.9% uptime SLA"
        ],
        "cta_text": "Start 14-Day Free Trial",
        "cta_highlight": True
    },
    {
        "id": "per-delivery",
        "name": "Per-Delivery Flex",
        "badge": "For On-Demand & E-Commerce",
        "price_monthly": 6.50,
        "price_annual": 5.20,
        "currency": "₹",
        "billing_unit": "per completed delivery stop",
        "description": "Zero monthly fixed commitments. Pay strictly as your order volumes scale up or fluctuate seasonally.",
        "features": [
            "Zero minimum vehicle commitments",
            "Sub-second route clustering API for high-volume ingest",
            "Dynamic SLA time-window reservation engine",
            "Live customer SMS/WhatsApp tracking link with ETA",
            "Autonomous re-dispatch on cancellations/add-ons",
            "High-concurrency webhook streaming",
            "Developer sandbox & SDKs"
        ],
        "cta_text": "Get API Credentials",
        "cta_highlight": False
    },
    {
        "id": "enterprise",
        "name": "Enterprise Dedicated",
        "badge": "For 50+ Fleets & 3PLs",
        "price_monthly": None,
        "price_annual": None,
        "currency": "₹",
        "billing_unit": "custom fleet volume contract",
        "description": "Custom routing heuristics, on-premise or dedicated cloud enclave, and deep TMS/ERP enterprise connectors.",
        "features": [
            "Dedicated routing optimization worker nodes",
            "Deep bidirectional sync (SAP, Oracle, Blue Yonder, Samsara)",
            "Hazardous material & heavy freight constraint engines",
            "Custom shift rule and driver rest enforcement",
            "Air-gapped / ISO 27001 / SOC2 Type II compliance",
            "24/7/365 dedicated logistics operations escalation desk",
            "Custom algorithmic objective tuning (cost vs SLA vs driver satisfaction)"
        ],
        "cta_text": "Speak with Enterprise Solutions",
        "cta_highlight": False
    }
]

# Fleet Profiles for Demo
FLEET_PROFILES = {
    "courier_express": {
        "name": "Metro Express Couriers",
        "vehicles": 18,
        "stops_per_day": 720,
        "avg_km_day": 135,
        "category": "E-Commerce / Last-Mile",
        "active_routes": 18,
    },
    "beverage_distribution": {
        "name": "Apex Food & Beverage Distributors",
        "vehicles": 32,
        "stops_per_day": 416,
        "avg_km_day": 180,
        "category": "Food & Beverage Distribution",
        "active_routes": 32,
    },
    "field_service": {
        "name": "Precision Technical Field Services",
        "vehicles": 14,
        "stops_per_day": 84,
        "avg_km_day": 110,
        "category": "Field Maintenance",
        "active_routes": 14,
    }
}
