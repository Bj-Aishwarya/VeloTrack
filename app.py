#!/usr/bin/env python3
"""
VeloTrack - Premium 3D Fleet & Delivery Optimization Platform
Entry point script.
"""

import sys
import os
import argparse

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from velotrack.server import run_server
from velotrack.config import DEFAULT_PORT, DEFAULT_HOST

def main():
    parser = argparse.ArgumentParser(description="VeloTrack Fleet Optimization Platform Server")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Port to bind (default: {DEFAULT_PORT})")
    parser.add_argument("--host", type=str, default=DEFAULT_HOST, help=f"Host address (default: {DEFAULT_HOST})")
    args = parser.parse_args()

    run_server(host=args.host, port=args.port)

if __name__ == "__main__":
    main()
