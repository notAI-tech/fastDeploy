import _utils
import multiprocessing

f_run = open('_run_utils.sh', 'w')

_delete_older_than = int(_utils.TIMEOUT) + 2
delete_older_than = f"'-{_delete_older_than} seconds'"

#f_run.write(f'watch -n{_delete_older_than} "find /ramdisk -not -newermt {delete_older_than} -delete"* &' + '\n')

if not _utils.WORKERS:
    n_workers = max(3, int((multiprocessing.cpu_count()/4) + 1))
    batch_size = int(open(_utils.batch_size_file_path).read().strip())
    n_workers = min(n_workers, batch_size + 1)
    _utils.logger.info(f'WORKERS={n_workers}; batch_size={batch_size}; cpu_count={multiprocessing.cpu_count()}')
else:
    n_workers = _utils.WORKERS
    _utils.logger.info(f'WORKERS={n_workers} from supplied config.')

f_run.write(f'gunicorn --preload --timeout={int(_utils.TIMEOUT * 4)} -b 0.0.0.0:8080 _app:app --workers={n_workers} --worker-connections=1000 --worker-class=gevent' + '\n')
