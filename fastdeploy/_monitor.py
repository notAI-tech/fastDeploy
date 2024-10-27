import psutil
import time
import os
from . import _utils


def monitor_processes(interval=1):
    try:
        pids = []

        processes = {pid: psutil.Process(pid) for pid in pids}

        # Try to initialize GPU monitoring
        try:
            import pynvml

            pynvml.nvmlInit()
            num_gpus = pynvml.nvmlDeviceGetCount()
            handles = [pynvml.nvmlDeviceGetHandleByIndex(i) for i in range(num_gpus)]
            gpu_monitoring = True
        except (ImportError, pynvml.NVMLError):
            gpu_monitoring = False
            print("GPU monitoring is not available.")

        while True:
            data = {}

            # Monitor each process
            for pid, process in processes.items():
                try:
                    with process.oneshot():
                        cpu_percent = process.cpu_percent(interval=None)
                        memory_info = process.memory_info()
                        create_time = process.create_time()

                        data[pid] = {
                            "name": process.name(),
                            "cmdline": process.cmdline(),
                            "status": process.status(),
                            "cpu_percent": cpu_percent,
                            "memory_mb": memory_info.rss / 1024 / 1024,
                            "uptime": time.time() - create_time,
                            "num_threads": process.num_threads(),
                            "username": process.username(),
                            "nice": process.nice(),
                            "io_counters": process.io_counters()._asdict()
                            if hasattr(process, "io_counters")
                            else None,
                        }
                except psutil.NoSuchProcess:
                    data[pid] = {"error": "Process not found"}
                except psutil.AccessDenied:
                    data[pid] = {"error": "Access denied"}

            # GPU monitoring (if available)
            if gpu_monitoring:
                for i, handle in enumerate(handles):
                    try:
                        gpu_util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                        gpu_memory = pynvml.nvmlDeviceGetMemoryInfo(handle)
                        data[f"gpu_{i}"] = {
                            "utilization": gpu_util.gpu,
                            "memory_used_mb": gpu_memory.used / 1024 / 1024,
                            "memory_total_mb": gpu_memory.total / 1024 / 1024,
                        }
                    except pynvml.NVMLError:
                        data[f"gpu_{i}"] = {"error": "GPU information not available"}

            yield data
            time.sleep(interval)

    except:
        print("Monitoring stopped.")
    finally:
        if gpu_monitoring:
            pynvml.nvmlShutdown()
