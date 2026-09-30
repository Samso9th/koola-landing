#!/usr/bin/env python3
"""Compatibility entry point; export the current brand through the browser."""
from pathlib import Path
import subprocess
subprocess.run(['node', str(Path(__file__).with_name('export-brand.cjs'))], check=True)
