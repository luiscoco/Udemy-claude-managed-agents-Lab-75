# Lab 70 checkpoint: Python Managed client bridge

The independent Python pin is `anthropic==1.7.0`; npm remains `@anthropic-ai/sdk@0.133.0`. The installed global Python package and its session create/stream/send/retrieve/archive, agent lookup and custom-tool event types were inspected without provider calls. The selected isolated interpreter ignores that user-site installation and reports the package absent, so live readiness is disabled with explicit venv installation commands. No pip install or live run is part of checks.

A fixed-argument, narrow-environment JSON-lines worker implements standard-library offline fixtures and an official Python Managed adapter. Node owns custom-tool validation and sends correlated `sevt_` results. Output, diagnostics, calls, deadlines and active processes are bounded. Retained sessions use owner-scoped handles and require confirmed idle; close and shutdown request cleanup. Process termination alone never proves a remote stop.

Focused tests cover missing interpreter, readiness without network, one-shot and retained protocol, host custom tools, malformed stdout, stderr truncation and graceful cancellation. The application/extension build, guide checks and browser demonstration are run for this checkpoint. Python API capability inspection is distinct from a billed provider integration test, which was not performed.
