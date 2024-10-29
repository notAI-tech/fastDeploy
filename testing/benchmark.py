import time
import logging
import argparse
import json
import random
import threading
import numpy as np
from tqdm import tqdm
import queue
import requests
from datetime import datetime
import os
import uuid
import importlib.util
from fdclient import FDClient

# Configure logging
logging.basicConfig(format='%(asctime)s [%(threadName)s] - %(message)s')
logger = logging.getLogger(__name__)

def load_input_source(sample_path):
    """Load either JSON file or import example_function from Python file"""
    if sample_path.endswith('.json'):
        with open(sample_path, 'r') as f:
            return {'type': 'json', 'data': json.load(f)}
    elif sample_path.endswith('.py'):
        # Convert to absolute path and split directory and filename
        abs_path = os.path.abspath(sample_path)
        directory = os.path.dirname(abs_path)
        filename = os.path.basename(abs_path)
        
        # Store current directory
        original_dir = os.getcwd()
        
        try:
            # Change to the script's directory
            os.chdir(directory)
            
            # Import the module
            module_name = os.path.splitext(filename)[0]
            spec = importlib.util.spec_from_file_location(module_name, filename)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            if not hasattr(module, 'example_function'):
                raise ValueError("Python file must contain example_function()")
            
            # Return the function while still in the correct directory
            return {'type': 'function', 'data': module.example_function}
        finally:
            # Always restore original directory
            os.chdir(original_dir)
    else:
        raise ValueError("Input file must be .json or .py")

class BenchmarkRunner:
    def __init__(self, target_rps, duration_seconds, server_url, 
                 warmup_seconds=5, input_source=None, concurrent_users=50, 
                 request_batch_size=1, log_dir=None, debug=False):
        self.target_rps = target_rps
        self.duration_seconds = duration_seconds
        self.warmup_seconds = warmup_seconds
        self.server_url = server_url
        self.input_source = input_source
        self.concurrent_users = concurrent_users
        self.request_batch_size = request_batch_size
        self.log_dir = log_dir
        self.debug = debug
        
        # Initialize metrics storage
        self.latencies = []
        self.errors = []
        self.successes = 0
        self.failures = 0
        
        # Create log directory if specified
        if self.log_dir:
            os.makedirs(self.log_dir, exist_ok=True)
        
        self.client = FDClient(server_url=self.server_url, request_timeout=10)

        # Per-user metrics
        self.user_metrics = {}
        self.metrics_lock = threading.Lock()

    def generate_payload(self):
        """Generate payload based on input source type"""
        if self.input_source['type'] == 'json':
            return [self.input_source['data'][random.randint(0, len(self.input_source['data']) - 1)] for _ in range(self.request_batch_size)]
        else:  # function
            return self.input_source['data']()

    def make_request(self, user_id, request_id, is_warmup=False):
        start_time = time.time()
        
        try:
            inps = self.generate_payload()
            
            if self.debug:
                logger.debug(f"User {user_id} - Request {request_id} - Sending input: {inps}...")
            
            results = self.client.infer(inps, unique_id=request_id)
            latency = (time.time() - start_time) * 1000  # Convert to ms
            
            if self.log_dir:
                self._log_request(user_id, request_id, inps, results, latency)
            
            if results['success']:
                if not is_warmup:
                    with self.metrics_lock:
                        self.successes += 1
                        self.latencies.append(latency)
                        
                        if user_id not in self.user_metrics:
                            self.user_metrics[user_id] = {
                                'successes': 0,
                                'failures': 0,
                                'latencies': []
                            }
                        self.user_metrics[user_id]['successes'] += 1
                        self.user_metrics[user_id]['latencies'].append(latency)
                
                if self.debug:
                    logger.debug(
                        f"User {user_id} - Request {request_id} - Success - "
                        f"Latency: {latency:.2f}ms - "
                    )
                return True
            else:
                if not is_warmup:
                    with self.metrics_lock:
                        self.failures += 1
                        if user_id not in self.user_metrics:
                            self.user_metrics[user_id] = {
                                'successes': 0,
                                'failures': 0,
                                'latencies': []
                            }
                        self.user_metrics[user_id]['failures'] += 1
                
                logger.error(
                    f"User {user_id} - Request {request_id} - Failed - "
                    f"Error: {results.get('reason', 'Unknown error')}"
                )
                return False
                
        except Exception as e:
            with self.metrics_lock:
                self.failures += 1
                self.errors.append(str(e))
                if user_id not in self.user_metrics:
                    self.user_metrics[user_id] = {
                        'successes': 0,
                        'failures': 0,
                        'latencies': []
                    }
                self.user_metrics[user_id]['failures'] += 1
            
            logger.error(
                f"User {user_id} - Request {request_id} - Exception - "
                f"Error: {str(e)}"
            )
            return False

    def _log_request(self, user_id, request_id, inputs, outputs, latency):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        log_entry = {
            'timestamp': timestamp,
            'user_id': user_id,
            'request_id': request_id,
            'inputs': inputs,
            'outputs': outputs,
            'latency_ms': latency
        }
        log_file = os.path.join(self.log_dir, f'request_{timestamp}_{request_id}.json')
        with open(log_file, 'w') as f:
            json.dump(log_entry, f, indent=2)

    def run_user_session(self, user_id, progress_queue):
        """Run a single user session with rate limiting"""
        if self.target_rps:
            sleep_time = 1.0 / self.target_rps
        else:
            sleep_time = 0
            
        total_requests = int(self.duration_seconds * (self.target_rps or 10))  # Default to 10 RPS if not specified
        
        pbar = tqdm(total=total_requests, 
                   desc=f'User {user_id}',
                   position=user_id,
                   leave=True)
        
        if self.debug:
            logger.debug(f"User {user_id} - Starting warmup period ({self.warmup_seconds}s)")
        
        # Warmup period
        warmup_start = time.time()
        warmup_requests = 0
        while time.time() - warmup_start < self.warmup_seconds:
            self.make_request(user_id, request_id=f"r{user_id}-warm-{warmup_requests}", is_warmup=True)
            warmup_requests += 1
        
        if self.debug:
            logger.debug(f"User {user_id} - Warmup complete - {warmup_requests} requests made")
            
        # Main benchmark loop
        start_time = time.time()
        requests_made = 0
        
        if self.debug:
            logger.debug(f"User {user_id} - Starting main benchmark loop")
        
        while time.time() - start_time < self.duration_seconds:
            request_start = time.time()
            self.make_request(user_id, request_id=f"r{user_id}-{requests_made}")
            requests_made += 1
            pbar.update(1)
            
            # Rate limiting
            elapsed = time.time() - request_start
            if sleep_time > elapsed:
                time.sleep(sleep_time - elapsed)
                
        pbar.close()
        
        # Calculate user-specific metrics
        user_stats = self.user_metrics.get(user_id, {})
        user_latencies = user_stats.get('latencies', [])
        
        user_results = {
            'user_id': user_id,
            'requests_made': requests_made,
            'duration': time.time() - start_time,
            'successes': user_stats.get('successes', 0),
            'failures': user_stats.get('failures', 0)
        }
        
        if user_latencies:
            user_results.update({
                'avg_latency': np.mean(user_latencies),
                'p95_latency': np.percentile(user_latencies, 95),
                'p99_latency': np.percentile(user_latencies, 99)
            })
        
        if self.debug:
            logger.debug(
                f"User {user_id} - Benchmark complete - "
                f"Requests: {requests_made}, "
                f"Successes: {user_stats.get('successes', 0)}, "
                f"Failures: {user_stats.get('failures', 0)}"
            )
        
        progress_queue.put(user_results)

    def run_benchmark(self):
        """Run the benchmark with multiple concurrent users"""
        threads = []
        progress_queue = queue.Queue()
        
        if self.debug:
            logger.debug(f"Starting benchmark with {self.concurrent_users} users")
        
        # Start user threads
        for i in range(self.concurrent_users):
            thread = threading.Thread(
                target=self.run_user_session,
                args=(i, progress_queue),
                name=f"User-{i}"
            )
            threads.append(thread)
            thread.start()
            
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
            
        # Collect results
        user_results = []
        while not progress_queue.empty():
            user_results.append(progress_queue.get())
            
        # Calculate metrics
        if self.latencies:
            p95 = np.percentile(self.latencies, 95)
            p99 = np.percentile(self.latencies, 99)
            avg_latency = np.mean(self.latencies)
            total_requests = self.successes + self.failures
            actual_rps = total_requests / self.duration_seconds
            
            return {
                'total_requests': total_requests,
                'successes': self.successes,
                'failures': self.failures,
                'average_latency_ms': avg_latency,
                'p95_latency_ms': p95,
                'p99_latency_ms': p99,
                'actual_rps': actual_rps,
                'target_rps_per_user': self.target_rps,
                'errors': self.errors[:10],  # First 10 errors
                'user_results': user_results  # Individual user metrics
            }
        return None

def validate_url(url):
    try:
        result = requests.get(url)
        return result.status_code == 200
    except:
        return False

def main():
    parser = argparse.ArgumentParser(description='API Benchmark Tool')
    parser.add_argument('--host', type=str, required=True, help='Server hostname or IP')
    parser.add_argument('--port', type=int, required=False, help='Server port')
    parser.add_argument('--rps_per_user', type=int, default=None, help='Target requests per second per user')
    parser.add_argument('--duration', type=int, default=60, help='Test duration in seconds')
    parser.add_argument('--warmup', type=int, default=5, help='Warmup period in seconds')
    parser.add_argument('--users', type=int, default=2, help='Number of concurrent users')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('--sample_json', type=str, default=None, help='Input .json or .py file path', required=True)
    parser.add_argument('--request_batch_size', type=int, default=1, help='Request batch size')
    parser.add_argument('--log_dir', type=str, default=None, help='Directory to log request inputs and outputs')
    args = parser.parse_args()

    if args.debug:
        logger.setLevel(logging.DEBUG)

    # Construct and validate server URL
    if not args.host.startswith("http"):
        server_url = f"http://{args.host}:{args.port}"
    else:
        server_url = args.host

    # Load input source (either JSON data or example_function)
    input_source = load_input_source(args.sample_json)

    # Initialize and run benchmark
    runner = BenchmarkRunner(
        target_rps=args.rps_per_user,
        duration_seconds=args.duration,
        server_url=server_url,
        warmup_seconds=args.warmup,
        input_source=input_source,
        concurrent_users=args.users,
        request_batch_size=args.request_batch_size,
        log_dir=args.log_dir,
        debug=args.debug
    )
    
    print(f"\nStarting benchmark with {args.users} concurrent users...")
    print(f"Target RPS per user: {args.rps_per_user or 'unlimited'}")
    print(f"Duration: {args.duration} seconds (+ {args.warmup} seconds warmup)")
    print(f"Request batch size: {args.request_batch_size}")
    print(f"Input source: {args.sample_json} ({input_source['type']})\n")
    
    results = runner.run_benchmark()
    
    if results:
        print("\nOverall Benchmark Results:")
        print("=" * 50)
        print(f"Total Requests: {results['total_requests']}")
        print(f"Successes: {results['successes']}")
        print(f"Failures: {results['failures']}")
        print(f"Success Rate: {(results['successes']/results['total_requests'])*100:.2f}%")
        print(f"\nOverall Latency (ms):")
        print(f"  Average: {results['average_latency_ms']:.2f}")
        print(f"  P95: {results['p95_latency_ms']:.2f}")
        print(f"  P99: {results['p99_latency_ms']:.2f}")
        print(f"\nActual RPS: {results['actual_rps']:.2f}")
        print(f"Target RPS per user: {results['target_rps_per_user'] or 'unlimited'}")
        
        print("\nPer-User Results:")
        print("=" * 50)
        for user_result in results['user_results']:
            print(f"\nUser {user_result['user_id']}:")
            print(f"  Requests Made: {user_result['requests_made']}")
            print(f"  Successes: {user_result['successes']}")
            print(f"  Failures: {user_result['failures']}")
            if 'avg_latency' in user_result:
                print(f"  Average Latency (ms): {user_result['avg_latency']:.2f}")
                print(f"  P95 Latency (ms): {user_result['p95_latency']:.2f}")
                print(f"  P99 Latency (ms): {user_result['p99_latency']:.2f}")
        
        if results['errors']:
            print("\nSample Errors:")
            for error in results['errors']:
                print(f"  - {error}")
    
if __name__ == "__main__":
    main()