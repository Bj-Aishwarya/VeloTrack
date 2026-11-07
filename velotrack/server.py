"""
VeloTrack Backend HTTP & API Server.
Zero external dependencies - built using Python's robust standard library.
Provides REST APIs for route optimization, ROI calculator, telematics stream,
and demo booking, while serving the responsive 3D web application.
"""

import os
import json
import mimetypes
import logging
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any

from .config import DEFAULT_HOST, DEFAULT_PORT, PRICING_PLANS, BENCHMARKS, FLEET_PROFILES
from .optimizer import calculate_fleet_roi, get_default_demo_scenario
from .telemetry import get_live_fleet_telematics, simulate_dynamic_reroute

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
)
logger = logging.getLogger("velotrack")

# In-memory store for demo leads & bookings
DEMO_BOOKINGS = []


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handle requests in separate threads for snappy concurrency."""
    daemon_threads = True
    allow_reuse_address = True


class VeloTrackRequestHandler(SimpleHTTPRequestHandler):
    """
    Custom request handler that exposes REST API endpoints alongside
    serving the modern 3D front-end assets.
    """

    def __init__(self, *args, **kwargs):
        # Resolve base directory for static assets and templates
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.static_dir = os.path.join(self.base_dir, "static")
        self.template_dir = os.path.join(self.base_dir, "velotrack", "templates")
        super().__init__(*args, **kwargs)

    def _send_json_response(self, data: Any, status: int = 200):
        """Sends a JSON response with appropriate headers."""
        try:
            payload = json.dumps(data, indent=2).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()
            self.wfile.write(payload)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_OPTIONS(self):
        """Handle CORS pre-flight requests."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        """Handle GET requests for static files, templates, and API queries."""
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        # REST API endpoints
        if path == "/api/health":
            self._send_json_response({"status": "healthy", "service": "VeloTrack Fleet Engine", "version": "2.4.0"})
            return

        elif path == "/api/config":
            self._send_json_response({
                "pricing": PRICING_PLANS,
                "benchmarks": BENCHMARKS,
                "fleet_profiles": FLEET_PROFILES,
            })
            return

        elif path == "/api/demo-scenario":
            scenario = get_default_demo_scenario()
            self._send_json_response(scenario)
            return

        elif path == "/api/telemetry":
            telemetry = get_live_fleet_telematics()
            self._send_json_response({"timestamp": os.times(), "vehicles": telemetry})
            return

        elif path == "/api/bookings":
            self._send_json_response({"total_bookings": len(DEMO_BOOKINGS), "bookings": DEMO_BOOKINGS})
            return

        # Serve Main HTML
        elif path in ("/", "/index.html"):
            index_path = os.path.join(self.template_dir, "index.html")
            if os.path.exists(index_path):
                self._serve_file(index_path, "text/html; charset=utf-8")
            else:
                self.send_error(404, "Template index.html not found")
            return

        # Serve Static Files (/static/...)
        elif path.startswith("/static/"):
            relative_path = path[len("/static/"):].lstrip("/")
            file_path = os.path.join(self.static_dir, relative_path)
            # Security check to prevent path traversal
            if not os.path.abspath(file_path).startswith(os.path.abspath(self.static_dir)):
                self.send_error(403, "Access forbidden")
                return

            if os.path.exists(file_path) and os.path.isfile(file_path):
                mime_type, _ = mimetypes.guess_type(file_path)
                if not mime_type:
                    if file_path.endswith(".js"):
                        mime_type = "application/javascript"
                    elif file_path.endswith(".css"):
                        mime_type = "text/css"
                    else:
                        mime_type = "application/octet-stream"
                self._serve_file(file_path, mime_type)
            else:
                self.send_error(404, f"File {relative_path} not found")
            return

        # Fallback 404
        self.send_error(404, f"Path {path} not found")

    def do_POST(self):
        """Handle POST requests for computation and form submission."""
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"
            body_json = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception as e:
            logger.warning(f"Error parsing POST payload: {e}")
            self._send_json_response({"error": "Invalid JSON payload", "details": str(e)}, status=400)
            return

        # API: Calculate Fleet ROI
        if path == "/api/roi":
            fleet_size = body_json.get("fleet_size", 25)
            avg_miles_day = body_json.get("avg_miles_day", 115)
            fuel_price = body_json.get("fuel_price", 3.85)
            driver_wage = body_json.get("driver_wage", 26.50)

            result = calculate_fleet_roi(
                fleet_size=fleet_size,
                avg_miles_day=avg_miles_day,
                fuel_price=fuel_price,
                driver_wage=driver_wage
            )
            self._send_json_response(result)
            return

        # API: Simulate Dynamic Re-Route
        elif path == "/api/reroute":
            incident = body_json.get("incident_type", "arterial_congestion")
            reroute_data = simulate_dynamic_reroute(incident_type=incident)
            self._send_json_response(reroute_data)
            return

        # API: Book a Demo
        elif path == "/api/book-demo":
            name = body_json.get("name", "").strip()
            email = body_json.get("email", "").strip()
            company = body_json.get("company", "").strip()
            fleet_size = body_json.get("fleet_size", "10-25")
            phone = body_json.get("phone", "").strip()
            fleet_type = body_json.get("fleet_type", "Logistics & Delivery")

            if not name or not email or "@" not in email:
                self._send_json_response({
                    "success": False,
                    "error": "Valid name and work email are required to schedule a live fleet audit."
                }, status=400)
                return

            booking_record = {
                "id": f"DEMO-{len(DEMO_BOOKINGS) + 101}",
                "name": name,
                "email": email,
                "company": company or "Independent Fleet",
                "fleet_size": fleet_size,
                "phone": phone,
                "fleet_type": fleet_type,
                "created_at": os.times()[4] if hasattr(os, 'times') else "now",
            }
            DEMO_BOOKINGS.append(booking_record)
            logger.info(f"New Demo Booking Registered: {booking_record['company']} ({booking_record['email']})")

            self._send_json_response({
                "success": True,
                "message": f"Demo confirmed! Our senior logistics solutions engineer will contact {email} within 2 business hours.",
                "booking": booking_record
            })
            return

        self.send_error(404, f"API endpoint {path} not found")

    def _serve_file(self, file_path: str, content_type: str):
        """Reads and transmits a local file."""
        try:
            with open(file_path, "rb") as f:
                content = f.read()

            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-cache, max-age=0")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            logger.error(f"Failed to serve file {file_path}: {e}")
            self.send_error(500, f"Error reading file: {e}")

    def log_message(self, format, *args):
        """Suppress standard clutter in console, keep informative logs."""
        pass


def run_server(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT):
    """Starts the VeloTrack multi-threaded server."""
    server_address = (host, port)
    httpd = ThreadedHTTPServer(server_address, VeloTrackRequestHandler)
    print(f"\n=======================================================")
    print(f"  VeloTrack Fleet Optimization Platform (Python 3.14)")
    print(f"  Live Server: http://localhost:{port}")
    print(f"  Industrial Tech 3D Experience Ready")
    print(f"=======================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[VeloTrack] Server shutting down gracefully...")
        httpd.server_close()
