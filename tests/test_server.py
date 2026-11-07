"""
Unit tests for VeloTrack HTTP Request Handler and API routes (Socket-free mock test).
Runs cleanly in sandboxed environments without opening TCP connections.
"""

import sys
import os
import io
import json
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from velotrack.server import VeloTrackRequestHandler


class MockSocket:
    def __init__(self, request_bytes):
        self.rfile = io.BytesIO(request_bytes)
        self.wfile = io.BytesIO()

    def makefile(self, mode, *args, **kwargs):
        if 'r' in mode:
            return self.rfile
        elif 'w' in mode or 'b' in mode:
            return self.wfile
        return self.wfile

    def sendall(self, data):
        self.wfile.write(data)


def simulate_http_request(method, path, body=None, headers=None):
    """Simulates an HTTP request against VeloTrackRequestHandler without opening network sockets."""
    headers = headers or {}
    req_lines = [f"{method} {path} HTTP/1.1", "Host: localhost"]
    for k, v in headers.items():
        req_lines.append(f"{k}: {v}")

    body_bytes = b""
    if body is not None:
        if isinstance(body, dict):
            body_bytes = json.dumps(body).encode("utf-8")
            req_lines.append("Content-Type: application/json")
        elif isinstance(body, str):
            body_bytes = body.encode("utf-8")
        else:
            body_bytes = body
        req_lines.append(f"Content-Length: {len(body_bytes)}")

    raw_request = ("\r\n".join(req_lines) + "\r\n\r\n").encode("utf-8") + body_bytes

    sock = MockSocket(raw_request)

    try:
        handler = VeloTrackRequestHandler(sock, ("127.0.0.1", 12345), None)
    except Exception:
        pass

    sock.wfile.seek(0)
    raw_response = sock.wfile.read()

    parts = raw_response.split(b"\r\n\r\n", 1)
    header_part = parts[0].decode("utf-8", errors="replace")
    body_part = parts[1] if len(parts) > 1 else b""

    status_line = header_part.split("\r\n")[0]
    status_code = int(status_line.split(" ")[1]) if " " in status_line else 500

    resp_headers = {}
    for line in header_part.split("\r\n")[1:]:
        if ": " in line:
            hk, hv = line.split(": ", 1)
            resp_headers[hk.lower()] = hv

    return status_code, resp_headers, body_part


class TestVeloTrackRequestHandler(unittest.TestCase):

    def test_api_health(self):
        status, headers, body = simulate_http_request("GET", "/api/health")
        self.assertEqual(status, 200)
        self.assertIn("application/json", headers.get("content-type", ""))
        data = json.loads(body.decode("utf-8"))
        self.assertEqual(data["status"], "healthy")

    def test_serve_index_html(self):
        status, headers, body = simulate_http_request("GET", "/")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers.get("content-type", ""))
        content = body.decode("utf-8")
        self.assertIn("VeloTrack", content)
        self.assertIn("Smarter Routes.<br>Lower Costs.<br>Happier Drivers.", content)
        self.assertIn("hero-canvas", content)
        self.assertIn("yard-canvas", content)

    def test_serve_static_files(self):
        # CSS
        status, headers, body = simulate_http_request("GET", "/static/css/main.css")
        self.assertEqual(status, 200)
        self.assertIn("text/css", headers.get("content-type", ""))
        self.assertIn("--bg-primary", body.decode("utf-8"))

        # JS
        status, headers, body = simulate_http_request("GET", "/static/js/scene-hero.js")
        self.assertEqual(status, 200)
        self.assertIn("javascript", headers.get("content-type", ""))
        self.assertIn("createDeliveryVan", body.decode("utf-8"))

    def test_api_config(self):
        status, headers, body = simulate_http_request("GET", "/api/config")
        self.assertEqual(status, 200)
        data = json.loads(body.decode("utf-8"))
        self.assertIn("pricing", data)
        self.assertIn("benchmarks", data)
        self.assertEqual(len(data["pricing"]), 3)

    def test_api_demo_scenario(self):
        status, headers, body = simulate_http_request("GET", "/api/demo-scenario")
        self.assertEqual(status, 200)
        data = json.loads(body.decode("utf-8"))
        self.assertIn("stops", data)
        self.assertIn("optimized_waypoints", data)
        self.assertGreater(len(data["stops"]), 3)

    def test_api_telemetry(self):
        status, headers, body = simulate_http_request("GET", "/api/telemetry")
        self.assertEqual(status, 200)
        data = json.loads(body.decode("utf-8"))
        self.assertEqual(len(data["vehicles"]), 5)

    def test_api_roi_post(self):
        payload = {"fleet_size": 25, "avg_miles_day": 115, "fuel_price": 3.85, "driver_wage": 26.50}
        status, headers, body = simulate_http_request("POST", "/api/roi", body=payload)
        self.assertEqual(status, 200)
        data = json.loads(body.decode("utf-8"))
        self.assertEqual(data["fleet_size"], 25)
        self.assertGreater(data["total_annual_savings"], 50000)
        self.assertGreater(data["annual_fuel_dollars_saved"], 10000)

    def test_api_reroute_post(self):
        payload = {"incident_type": "arterial_congestion"}
        status, headers, body = simulate_http_request("POST", "/api/reroute", body=payload)
        self.assertEqual(status, 200)
        data = json.loads(body.decode("utf-8"))
        self.assertEqual(data["status"], "re-routed")
        self.assertIn("avoided_delay_min", data["optimization_results"])

    def test_api_book_demo_post(self):
        payload = {
            "name": "David Martinez",
            "email": "dmartinez@caldistributors.com",
            "company": "Cal Wholesale Distributors",
            "fleet_size": "16-40 vehicles",
            "phone": "510-555-8821",
            "fleet_type": "Food & Beverage"
        }
        status, headers, body = simulate_http_request("POST", "/api/book-demo", body=payload)
        self.assertEqual(status, 200)
        data = json.loads(body.decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertEqual(data["booking"]["company"], "Cal Wholesale Distributors")


if __name__ == "__main__":
    unittest.main()
