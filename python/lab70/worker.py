"""One bounded JSON-lines request. Offline mode imports no provider package."""
import asyncio
import importlib.metadata
import json
import os
import sys
import threading
import time
import uuid

PIN = "1.7.0"
MAX_LINE = 12000


def emit(kind, **values):
    print(json.dumps({"type": kind, **values}, ensure_ascii=True), flush=True)


def read_line():
    line = sys.stdin.buffer.readline(MAX_LINE + 1)
    if not line or len(line) > MAX_LINE:
        raise ValueError("Bounded input required")
    return json.loads(line)


def capability():
    try:
        version = importlib.metadata.version("anthropic")
        import anthropic
        client = anthropic.Anthropic(api_key="offline", max_retries=0)
        methods = all(callable(getattr(client.beta.sessions, name, None)) for name in ("create", "retrieve", "archive"))
        methods = methods and all(callable(getattr(client.beta.sessions.events, name, None)) for name in ("stream", "send"))
        methods = methods and callable(getattr(client.beta.agents, "retrieve", None))
        client.close()
        ready = version == PIN and methods
        return version, ready, "Verified local API surface; no network request." if ready else "Install the exact requirements.txt pin in the selected interpreter."
    except Exception:
        return "not-installed", False, "Create .venv and install python/lab70/requirements.txt explicitly; readiness never installs packages."


def result(outcome, session_id=None, retained=False, interruption="not-needed", cleanup="simulated", text=""):
    emit("result", outcome=outcome, session_id=session_id, retained=retained,
         interruption=interruption, cleanup=cleanup, text=text[:2000])


def offline(request):
    scenario = request["scenario"]
    if scenario == "malformed-stdout":
        print("not-json", flush=True)
        return
    if scenario == "stderr-flood":
        sys.stderr.write("authored diagnostic " + "x" * 10000)
        sys.stderr.flush()
    session_id = request.get("session_id") or "sesn_fixture_" + uuid.uuid4().hex
    emit("session", id=session_id, status="idle")
    if request["operation"] == "close":
        result("completed", session_id, cleanup="simulated-archive", text="Idle fixture session closed.")
        return
    emit("progress", text="Python worker established its authored session-event adapter before sending a message.")
    if scenario == "hang":
        while True:
            control = read_line()
            if control.get("type") == "cancel":
                result("cancelled", session_id, interruption="simulated", cleanup="simulated-archive", text="Local fixture cancellation acknowledged.")
                return
    text = "Python fixture reply: " + request["prompt"]
    if scenario == "custom-tool":
        event_id = "sevt_" + uuid.uuid4().hex
        emit("tool_use", id=event_id, name="format_observation", input={"species": "Aurora Finch", "count": 3})
        control = read_line()
        if control.get("type") == "cancel":
            result("cancelled", session_id, interruption="simulated", cleanup="simulated-archive")
            return
        if control.get("type") != "user.custom_tool_result" or control.get("custom_tool_use_id") != event_id:
            raise ValueError("Correlated host tool result required")
        text = control["content"][0]["text"]
        emit("progress", text="Host custom-tool result correlated by sevt_ event ID; no Python hooks or business effect.")
    retained = request["operation"] in ("retained-start", "retained-turn")
    result("completed", session_id, retained, cleanup="confirmed-idle-retained" if retained else "simulated-archive", text=text)


async def live(request):
    version, capable, _ = capability()
    if not capable:
        result("error", cleanup="not-needed", text="Selected interpreter lacks verified anthropic==" + PIN + "; found " + version)
        return
    import anthropic
    key = os.environ.get("ANTHROPIC_API_KEY")
    agent_id = os.environ.get("LAB70_AGENT_ID")
    environment_id = os.environ.get("LAB70_ENVIRONMENT_ID")
    if not key or not agent_id or not environment_id:
        result("error", cleanup="not-needed", text="Server live configuration is incomplete.")
        return
    controls = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def reader():
        try:
            for _ in range(8):
                value = read_line()
                loop.call_soon_threadsafe(controls.put_nowait, value)
        except Exception:
            pass

    threading.Thread(target=reader, daemon=True).start()
    cancelled = asyncio.Event()
    replies = asyncio.Queue()

    async def control_pump():
        while True:
            value = await controls.get()
            if value.get("type") == "cancel":
                cancelled.set()
            elif value.get("type") == "user.custom_tool_result":
                await replies.put(value)

    pump = asyncio.create_task(control_pump())
    client = anthropic.AsyncAnthropic(api_key=key, timeout=10.0, max_retries=0)
    session_id = request.get("session_id")
    stream = None
    prompt_sent = False
    success = False
    retained = False
    cleanup = "pending"
    interruption = "not-needed"
    text = ""
    try:
        if request["operation"] == "close":
            session = await client.beta.sessions.retrieve(session_id, timeout=3.0)
        elif session_id:
            session = await client.beta.sessions.retrieve(session_id, timeout=3.0)
            if session.status != "idle":
                raise ValueError("Retained session is not confirmed idle")
        else:
            await client.beta.agents.retrieve(agent_id, timeout=3.0)
            tools = []
            if request["scenario"] == "custom-tool":
                tools = [{"type": "custom", "name": "format_observation", "description": "Format one fictional bird observation.",
                          "input_schema": request["tool_schema"]}]
            session = await client.beta.sessions.create(
                agent={"type": "agent_with_overrides", "id": agent_id, "tools": tools, "mcp_servers": [], "skills": [],
                       "system": "Answer briefly. Use format_observation when it is provided; no other tools are available."},
                environment_id=environment_id, title="Lab 70 Python client",
                budget={"type": "limit", "max_list_cost": {"amount": 100, "currency": "USD"}}, timeout=10.0)
            session_id = session.id
        emit("session", id=session_id, status=session.status)
        expected_tools = 1 if request["scenario"] == "custom-tool" else 0
        if session.agent.mcp_servers or session.agent.skills or session.agent.multiagent or len(session.agent.tools) != expected_tools:
            raise ValueError("Resolved tool configuration differs")
        if any(tool.type != "custom" or tool.name != "format_observation" for tool in session.agent.tools):
            raise ValueError("Unexpected resolved tool")
        if request["operation"] == "close":
            if session.status != "idle":
                raise ValueError("Close requires confirmed idle")
            success = True
        else:
            if cancelled.is_set():
                raise ValueError("Local cancellation")
            stream = await client.beta.sessions.events.stream(session_id, event_deltas=["agent.message"], timeout=10.0)
            prompt_sent = True
            await client.beta.sessions.events.send(session_id, events=[{"type": "user.message", "content": [{"type": "text", "text": request["prompt"]}]}], timeout=5.0)
            seen = set()
            pending = {}
            iterator = stream.__aiter__()
            deadline = time.monotonic() + 25
            for _ in range(80):
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise ValueError("Turn deadline")
                next_event = asyncio.create_task(anext(iterator))
                cancel_wait = asyncio.create_task(cancelled.wait())
                done, _ = await asyncio.wait([next_event, cancel_wait], timeout=remaining, return_when=asyncio.FIRST_COMPLETED)
                if cancel_wait in done or next_event not in done:
                    next_event.cancel()
                    cancel_wait.cancel()
                    raise ValueError("Local cancellation or deadline")
                cancel_wait.cancel()
                event = next_event.result()
                value = event.model_dump(mode="json")
                kind = value.get("type", "")
                event_id = value.get("id")
                if event_id and event_id in seen:
                    continue
                if event_id:
                    seen.add(event_id)
                if kind == "agent.message":
                    text = "".join(block.get("text", "") for block in value.get("content", []) if block.get("type") == "text")[:2000]
                    emit("progress", text=text)
                elif kind == "agent.custom_tool_use":
                    if len(pending) >= 2:
                        raise ValueError("Tool call bound")
                    pending[event_id] = value
                    emit("tool_use", id=event_id, name=value.get("name"), input=value.get("input"))
                elif kind == "session.status_idle":
                    reason = value.get("stop_reason", {}).get("type")
                    if reason == "end_turn":
                        success = True
                        break
                    if reason != "requires_action" or not pending:
                        raise ValueError("Unexpected idle reason")
                    for tool_id in list(pending):
                        reply = await asyncio.wait_for(replies.get(), timeout=5.0)
                        if cancelled.is_set() or reply.get("custom_tool_use_id") != tool_id:
                            raise ValueError("Mismatched host tool reply")
                        await client.beta.sessions.events.send(session_id, events=[reply], timeout=5.0)
                        del pending[tool_id]
                elif kind == "session.error":
                    raise ValueError("Remote session error")
    except Exception:
        success = False
    finally:
        if stream:
            try:
                await stream.close()
            except Exception:
                pass
        if session_id:
            if prompt_sent and not success:
                try:
                    await client.beta.sessions.events.send(session_id, events=[{"type": "user.interrupt"}], timeout=3.0)
                    interruption = "acknowledged-unconfirmed"
                except Exception:
                    interruption = "unconfirmed"
            idle = False
            until = time.monotonic() + 6
            while time.monotonic() < until:
                try:
                    current = await client.beta.sessions.retrieve(session_id, timeout=3.0)
                    if current.status == "idle":
                        idle = True
                        break
                    if current.status == "terminated":
                        cleanup = "terminated"
                        break
                except Exception:
                    break
                await asyncio.sleep(0.1)
            if idle:
                if interruption == "acknowledged-unconfirmed":
                    interruption = "confirmed-idle"
                retained = success and request["operation"] in ("retained-start", "retained-turn")
                if retained:
                    cleanup = "confirmed-idle-retained"
                else:
                    try:
                        await client.beta.sessions.archive(session_id, timeout=3.0)
                        cleanup = "archived"
                    except Exception:
                        cleanup = "archive-unconfirmed"
        pump.cancel()
        try:
            await client.close()
        except Exception:
            pass
    outcome = "completed" if success else "cancelled" if cancelled.is_set() else "error"
    result(outcome, session_id, retained, interruption, cleanup,
           text if success else "Python turn did not complete; inspect interruption and cleanup separately.")


def main():
    request = read_line()
    if request.get("mode") == "readiness":
        version, capable, reason = capability()
        emit("readiness", version=version, capable=capable, reason=reason)
        return
    allowed = {"mode", "operation", "scenario", "prompt", "session_id", "tool_schema"}
    if set(request) - allowed or request.get("mode") not in ("offline", "live") or request.get("operation") not in ("one-shot", "retained-start", "retained-turn", "close"):
        raise ValueError("Closed worker request required")
    if not isinstance(request.get("prompt"), str) or len(request["prompt"]) > 500:
        raise ValueError("Bounded prompt required")
    if request["mode"] == "offline":
        offline(request)
    else:
        asyncio.run(live(request))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        result("error", cleanup="unconfirmed", text="Worker protocol or execution failed.")
