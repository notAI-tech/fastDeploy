import time
import logging
import argparse
import json
import random
import numpy as np
from datetime import datetime
import os
import importlib.util
from tqdm import tqdm
from fdclient import FDClient
import multiprocessing as mp
from dataclasses import dataclass
from typing import List, Dict, Any
import queue
import signal

# Configure logging
logging.basicConfig(format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ConnectionStats:
    latencies: List[float]
    errors: List[str]
    successes: int
    failures: int
    connection_id: int


class BenchmarkProcess(mp.Process):
    def __init__(self, connection_id, server_url, target_rps, duration, 
                 input_source, request_batch_size, is_warmup, 
                 stats_queue, progress_queue, request_timeout=10):
        super().__init__()
        self.connection_id = connection_id
        self.server_url = server_url
        self.target_rps = target_rps
        self.duration = duration
        self.input_source = input_source
        self.request_batch_size = request_batch_size
        self.is_warmup = is_warmup
        self.stats_queue = stats_queue
        self.progress_queue = progress_queue
        self.request_timeout = request_timeout
        self._loaded_function = None
        
    def _load_function(self):
        """Load the Python function inside the process"""
        if self.input_source['type'] == 'function':
            path = self.input_source['path']
            directory = os.path.dirname(path)
            filename = os.path.basename(path)
            
            original_dir = os.getcwd()
            try:
                os.chdir(directory)
                module_name = os.path.splitext(filename)[0]
                spec = importlib.util.spec_from_file_location(module_name, filename)
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                if not hasattr(module, 'example_function'):
                    raise ValueError("Python file must contain example_function()")
                
                self._loaded_function = module.example_function
            finally:
                os.chdir(original_dir)

    def generate_payload(self):
        """Generate payload based on input source type"""
        if self.input_source['type'] == 'json':
            return [self.input_source['data'][random.randint(0, len(self.input_source['data']) - 1)] 
                   for _ in range(self.request_batch_size)]
        else:  # function
            if self._loaded_function is None:
                self._load_function()
            return self._loaded_function()[:self.request_batch_size]

    def run(self):
        # Handle Ctrl+C gracefully
        signal.signal(signal.SIGINT, signal.SIG_IGN)
        
        client = FDClient(server_url=self.server_url, request_timeout=self.request_timeout)
        
        if self.target_rps:
            sleep_time = 1.0 / self.target_rps
        else:
            sleep_time = 0
            
        start_time = time.time()
        stats = ConnectionStats(
            latencies=[], errors=[], successes=0, failures=0,
            connection_id=self.connection_id
        )
        requests_made = 0
        
        while time.time() - start_time < self.duration:
            request_start = time.time()
            
            try:
                # Generate and send request
                inps = self.generate_payload()
                request_id = f"{'warm' if self.is_warmup else 'req'}-conn{self.connection_id}-{requests_made}"
                
                results = client.infer(inps, unique_id=request_id)
                latency = (time.time() - request_start) * 1000  # Convert to ms
                
                if results['success']:
                    if not self.is_warmup:
                        stats.successes += 1
                        stats.latencies.append(latency)
                else:
                    if not self.is_warmup:
                        stats.failures += 1
                        stats.errors.append(results.get('reason', 'Unknown error'))
                    
            except Exception as e:
                if not self.is_warmup:
                    stats.failures += 1
                    stats.errors.append(str(e))
            
            requests_made += 1
            
            # Update progress
            elapsed = time.time() - start_time
            self.progress_queue.put((self.connection_id, min(elapsed, self.duration)))
            
            # Rate limiting
            elapsed = time.time() - request_start
            if sleep_time > elapsed:
                time.sleep(sleep_time - elapsed)
        
        # Send final stats
        self.stats_queue.put((self.connection_id, stats))

class BenchmarkRunner:
    def __init__(self, target_rps_per_connection, duration_seconds, server_url,
                 parallel_connections=1, warmup_seconds=5, input_source=None, 
                 request_batch_size=1, log_dir=None, debug=False, request_timeout=10):
        self.target_rps_per_connection = target_rps_per_connection
        self.parallel_connections = parallel_connections
        self.duration_seconds = duration_seconds
        self.warmup_seconds = warmup_seconds
        self.server_url = server_url
        self.input_source = input_source
        self.request_batch_size = request_batch_size
        self.log_dir = log_dir
        self.debug = debug
        self.request_timeout = request_timeout
        
        if self.log_dir:
            os.makedirs(self.log_dir, exist_ok=True)
            
        # For handling Ctrl+C gracefully
        self.stop_event = mp.Event()
        signal.signal(signal.SIGINT, self._handle_interrupt)

    def _handle_interrupt(self, signum, frame):
        print("\nStopping benchmark gracefully...")
        self.stop_event.set()

    def _update_progress_bars(self, progress_queue, pbars, duration, process_count):
        """Update progress bars from queue until duration is reached or stop_event is set"""
        start_time = time.time()
        while time.time() - start_time < duration and not self.stop_event.is_set():
            try:
                conn_id, progress = progress_queue.get(timeout=0.1)
                pbars[conn_id].n = progress
                pbars[conn_id].refresh()
            except queue.Empty:
                continue

    def run_benchmark(self):
        """Run the benchmark with parallel processes"""
        # Create queues for inter-process communication
        stats_queue = mp.Queue()
        progress_queue = mp.Queue()
        
        print("\nStarting warmup period...")
        
        # Create progress bars for warmup
        warmup_pbars = {
            i: tqdm(
                total=self.warmup_seconds,
                desc=f"Warmup Conn {i}",
                position=i,
                unit="s",
                leave=True
            )
            for i in range(self.parallel_connections)
        }
        
        # Start warmup processes
        warmup_processes = [
            BenchmarkProcess(
                connection_id=i,
                server_url=self.server_url,
                target_rps=self.target_rps_per_connection,
                duration=self.warmup_seconds,
                input_source=self.input_source,
                request_batch_size=self.request_batch_size,
                is_warmup=True,
                stats_queue=stats_queue,
                progress_queue=progress_queue,
                request_timeout=self.request_timeout
            )
            for i in range(self.parallel_connections)
        ]
        
        for p in warmup_processes:
            p.start()
            
        # Update warmup progress bars
        self._update_progress_bars(
            progress_queue, warmup_pbars, 
            self.warmup_seconds, self.parallel_connections
        )
        
        # Wait for warmup processes to finish
        for p in warmup_processes:
            p.join()
            
        # Clear warmup stats queue
        while not stats_queue.empty():
            stats_queue.get()
            
        # Close warmup progress bars
        for pbar in warmup_pbars.values():
            pbar.close()
        
        if self.stop_event.is_set():
            print("\nBenchmark interrupted during warmup")
            return None
            
        print("\nStarting benchmark...")
        
        # Create progress bars for benchmark
        benchmark_pbars = {
            i: tqdm(
                total=self.duration_seconds,
                desc=f"Benchmark Conn {i}",
                position=i,
                unit="s",
                leave=True
            )
            for i in range(self.parallel_connections)
        }
        
        # Start benchmark processes
        benchmark_processes = [
            BenchmarkProcess(
                connection_id=i,
                server_url=self.server_url,
                target_rps=self.target_rps_per_connection,
                duration=self.duration_seconds,
                input_source=self.input_source,
                request_batch_size=self.request_batch_size,
                is_warmup=False,
                stats_queue=stats_queue,
                progress_queue=progress_queue,
                request_timeout=self.request_timeout
            )
            for i in range(self.parallel_connections)
        ]
        
        for p in benchmark_processes:
            p.start()
            
        # Update benchmark progress bars
        self._update_progress_bars(
            progress_queue, benchmark_pbars, 
            self.duration_seconds, self.parallel_connections
        )
        
        # Collect results
        connection_stats = {}
        for _ in range(self.parallel_connections):
            conn_id, stats = stats_queue.get()
            connection_stats[conn_id] = stats
            
        # Wait for all processes to finish
        for p in benchmark_processes:
            p.join()
            
        # Close benchmark progress bars
        for pbar in benchmark_pbars.values():
            pbar.close()
            
        # Move cursor to bottom of progress bars
        print("\n" * (self.parallel_connections))
        
        if self.stop_event.is_set():
            print("\nBenchmark interrupted")
            return None
            
        # Aggregate results
        all_latencies = []
        total_successes = 0
        total_failures = 0
        all_errors = []
        
        for stats in connection_stats.values():
            all_latencies.extend(stats.latencies)
            total_successes += stats.successes
            total_failures += stats.failures
            all_errors.extend(stats.errors)
        
        if all_latencies:
            total_time = self.duration_seconds
            p50 = np.percentile(all_latencies, 50)
            p90 = np.percentile(all_latencies, 90)
            p95 = np.percentile(all_latencies, 95)
            p99 = np.percentile(all_latencies, 99)
            avg_latency = np.mean(all_latencies)
            std_latency = np.std(all_latencies)
            total_requests = total_successes + total_failures
            actual_rps = total_requests / total_time
            
            results = {
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'total_requests': total_requests,
                'successes': total_successes,
                'failures': total_failures,
                'success_rate': (total_successes/total_requests)*100 if total_requests > 0 else 0,
                'average_latency_ms': float(avg_latency),
                'std_latency_ms': float(std_latency),
                'p50_latency_ms': float(p50),
                'p90_latency_ms': float(p90),
                'p95_latency_ms': float(p95),
                'p99_latency_ms': float(p99),
                'min_latency_ms': float(min(all_latencies)),
                'max_latency_ms': float(max(all_latencies)),
                'actual_rps': float(actual_rps),
                'target_rps_per_connection': self.target_rps_per_connection,
                'parallel_connections': self.parallel_connections,
                'total_target_rps': (self.target_rps_per_connection or 0) * self.parallel_connections,
                'duration_seconds': self.duration_seconds,
                'warmup_seconds': self.warmup_seconds,
                'request_batch_size': self.request_batch_size,
                'errors': all_errors[:10] if all_errors else [],  # First 10 errors
                'error_count': len(all_errors),
                # Per-connection stats
                'connection_stats': {
                    conn_id: {
                        'requests': stats.successes + stats.failures,
                        'successes': stats.successes,
                        'failures': stats.failures,
                        'success_rate': (stats.successes/(stats.successes + stats.failures))*100 if (stats.successes + stats.failures) > 0 else 0,
                        'average_latency_ms': float(np.mean(stats.latencies)) if stats.latencies else 0,
                        'actual_rps': (stats.successes + stats.failures) / total_time
                    }
                    for conn_id, stats in connection_stats.items()
                }
            }
            return results
        return None

def format_duration(ms):
    """Format milliseconds into a readable duration."""
    if ms < 1:
        return f"{ms*1000:.2f}μs"
    elif ms < 1000:
        return f"{ms:.2f}ms"
    else:
        return f"{ms/1000:.2f}s"

def print_results(results):
    """Print formatted benchmark results."""
    if not results:
        return
    
    print("\n" + "="*80)
    print("BENCHMARK RESULTS")
    print("="*80)
    
    # Overall Statistics
    print("\n📊 OVERALL STATISTICS")
    print("-"*40)
    print(f"Total Requests:     {results['total_requests']:,}")
    print(f"Successful:         {results['successes']:,}")
    print(f"Failed:            {results['failures']:,}")
    print(f"Success Rate:       {results['success_rate']:.2f}%")
    
    # Throughput
    print("\n🚀 THROUGHPUT")
    print("-"*40)
    print(f"Actual RPS:         {results['actual_rps']:.2f}")
    print(f"Target RPS:         {results['total_target_rps'] or 'unlimited'}")
    print(f"Connections:        {results['parallel_connections']}")
    print(f"Duration:           {results['duration_seconds']}s (+ {results['warmup_seconds']}s warmup)")
    print(f"Batch Size:         {results['request_batch_size']}")
    
    # Latency Statistics
    print("\n⚡ LATENCY STATISTICS")
    print("-"*40)
    print(f"Average:           {format_duration(results['average_latency_ms'])}")
    print(f"Std Dev:           {format_duration(results['std_latency_ms'])}")
    print(f"Min:               {format_duration(results['min_latency_ms'])}")
    print(f"Max:               {format_duration(results['max_latency_ms'])}")
    print(f"P50:               {format_duration(results['p50_latency_ms'])}")
    print(f"P90:               {format_duration(results['p90_latency_ms'])}")
    print(f"P95:               {format_duration(results['p95_latency_ms'])}")
    print(f"P99:               {format_duration(results['p99_latency_ms'])}")

    # Per-Connection Statistics
    print("\n🔌 PER-CONNECTION STATISTICS")
    print("-"*40)
    for conn_id, stats in results['connection_stats'].items():
        print(f"\nConnection {conn_id}:")
        print(f"  Requests:        {stats['requests']:,}")
        print(f"  Success Rate:    {stats['success_rate']:.2f}%")
        print(f"  Actual RPS:      {stats['actual_rps']:.2f}")
        print(f"  Avg Latency:     {format_duration(stats['average_latency_ms'])}")

    # Error Summary
    if results['errors']:
        print("\n❌ ERROR SUMMARY")
        print("-"*40)
        print(f"Total Errors: {results['error_count']}")
        print("\nFirst 10 Errors:")
        for i, error in enumerate(results['errors'], 1):
            print(f"{i}. {error}")

    print("\n" + "="*80)


def main():
    parser = argparse.ArgumentParser(description='API Benchmark Tool')
    parser.add_argument('--server_url', type=str, required=True, help='Server URL')
    parser.add_argument('--target_rps_per_connection', type=int, default=None, 
                       help='Target requests per second per connection')
    parser.add_argument('--parallel_connections', type=int, default=1,
                       help='Number of parallel connections')
    parser.add_argument('--duration', type=int, default=60, help='Test duration in seconds')
    parser.add_argument('--warmup', type=int, default=5, help='Warmup period in seconds')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('--input_file', type=str, required=True, help='Input .json or .py file path')
    parser.add_argument('--request_batch_size', type=int, default=1, help='Request batch size')
    parser.add_argument('--log_dir', type=str, default=None, help='Directory to log request inputs and outputs')
    parser.add_argument('--results_file', type=str, default='benchmark_results.json', 
                       help='File to write benchmark results')
    parser.add_argument('--request_timeout', type=float, default=10, help='Request timeout in seconds')
    args = parser.parse_args()

    if args.debug:
        logger.setLevel(logging.DEBUG)

    # Load input source
    input_source = None
    if args.input_file.endswith('.json'):
        try:
            with open(args.input_file, 'r') as f:
                input_data = json.load(f)
            input_source = {'type': 'json', 'data': input_data}
        except Exception as e:
            logger.error(f"Failed to load JSON input file: {e}")
            return
    elif args.input_file.endswith('.py'):
        input_source = {'type': 'function', 'path': args.input_file}
    else:
        logger.error("Input file must be either .json or .py")
        return

    # Initialize and run benchmark
    runner = BenchmarkRunner(
        target_rps_per_connection=args.target_rps_per_connection,
        parallel_connections=args.parallel_connections,
        duration_seconds=args.duration,
        server_url=args.server_url,
        warmup_seconds=args.warmup,
        input_source=input_source,
        request_batch_size=args.request_batch_size,
        log_dir=args.log_dir,
        debug=args.debug,
        request_timeout=args.request_timeout
    )
    
    total_target_rps = (args.target_rps_per_connection or 'unlimited') 
    if args.target_rps_per_connection:
        total_target_rps = args.target_rps_per_connection * args.parallel_connections
    
    print(f"\n{'='*80}")
    print("BENCHMARK CONFIGURATION")
    print(f"{'='*80}")
    print(f"Server URL:          {args.server_url}")
    print(f"Parallel connections: {args.parallel_connections}")
    print(f"Target RPS/conn:     {args.target_rps_per_connection or 'unlimited'}")
    print(f"Total target RPS:    {total_target_rps}")
    print(f"Duration:            {args.duration}s (+ {args.warmup}s warmup)")
    print(f"Request batch size:  {args.request_batch_size}")
    print(f"Input source:        {args.input_file}")
    print(f"Log directory:       {args.log_dir or 'disabled'}")
    print(f"Debug mode:          {'enabled' if args.debug else 'disabled'}")
    print(f"Request timeout:     {args.request_timeout}s")
    print(f"{'='*80}\n")
    
    try:
        results = runner.run_benchmark()
        
        if results:
            # Write results to file
            with open(args.results_file, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"\nDetailed results saved to: {args.results_file}")
            
            # Print formatted results
            print_results(results)
        else:
            print("\nNo results generated. Benchmark may have been interrupted.")
    except KeyboardInterrupt:
        print("\nBenchmark interrupted by user.")
    except Exception as e:
        logger.error(f"Benchmark failed: {e}")
        if args.debug:
            raise

if __name__ == "__main__":
    main()