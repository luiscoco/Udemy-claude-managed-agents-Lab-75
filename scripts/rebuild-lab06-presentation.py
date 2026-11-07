"""Compatibility entry point for the reviewed Lab 01-style Lab 06 generator."""
from pathlib import Path
import runpy

runpy.run_path(str(Path(__file__).with_name('restyle-lab06-presentation.py')), run_name='__main__')
