"""Production deadlines count awake time; active Windows jobs inhibit sleep."""
import ctypes
import os
import time
from contextlib import contextmanager

if os.name == 'nt':
    _kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    _unbiased = _kernel.QueryUnbiasedInterruptTime
    _unbiased.argtypes = [ctypes.POINTER(ctypes.c_ulonglong)]
    _unbiased.restype = ctypes.c_int
    _execution_state = _kernel.SetThreadExecutionState
    _execution_state.argtypes = [ctypes.c_uint]
    _execution_state.restype = ctypes.c_uint


def awake_time():
    if os.name != 'nt':
        return time.monotonic()
    ticks = ctypes.c_ulonglong()
    if not _unbiased(ctypes.byref(ticks)):
        raise ctypes.WinError(ctypes.get_last_error())
    return ticks.value / 10_000_000


@contextmanager
def active_production():
    """Keep the system awake while this calling thread owns production work."""
    previous = None
    if os.name == 'nt':
        previous = _execution_state(0x80000001)  # CONTINUOUS | SYSTEM_REQUIRED
        if not previous:
            raise ctypes.WinError(ctypes.get_last_error())
    try:
        yield
    finally:
        if previous is not None:
            _execution_state(previous)
