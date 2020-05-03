import _utils
import multiprocessing

f_run = open("_run_utils.sh", "w")

if not _utils.WORKERS:
    n_workers = max(3, int((multiprocessing.cpu_count()) + 1))
    batch_size = int(open(_utils.batch_size_file_path).read().strip())
    n_workers = min(n_workers, batch_size + 1)
    _utils.logger.info(
        f"WORKERS={n_workers}; batch_size={batch_size}; cpu_count={multiprocessing.cpu_count()}"
    )
else:
    n_workers = _utils.WORKERS
    _utils.logger.info(f"WORKERS={n_workers} from supplied config.")

f_run.write(
    f"gunicorn --preload --timeout={int(_utils.TIMEOUT * 4)} -b 0.0.0.0:8080 _app:app --workers={n_workers} --worker-connections=1000 --worker-class=gevent"
    + "\n"
)
