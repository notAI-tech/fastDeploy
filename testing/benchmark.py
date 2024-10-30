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

# Configure logging
logging.basicConfig(format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

def load_input_source(input_path):
    """Load either JSON file or import example_function from Python file"""
    if input_path.endswith('.json'):
        with open(input_path, 'r') as f:
            return {'type': 'json', 'data': json.load(f)}
    elif input_path.endswith('.py'):
        # Convert to absolute path and split directory and filename
        abs_path = os.path.abspath(input_path)
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
            
            return {'type': 'function', 'data': module.example_function}
        finally:
            # Always restore original directory
            os.chdir(original_dir)
    else:
        raise ValueError("Input file must be .json or .py")

class BenchmarkRunner:
    def __init__(self, target_rps, duration_seconds, server_url, 
                 warmup_seconds=5, input_source=None, request_batch_size=1, 
                 log_dir=None, debug=False):
        self.target_rps = target_rps
        self.duration_seconds = duration_seconds
        self.warmup_seconds = warmup_seconds
        self.server_url = server_url
        self.input_source = input_source
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

    def generate_payload(self):
        """Generate payload based on input source type"""
        if self.input_source['type'] == 'json':
            return [self.input_source['data'][random.randint(0, len(self.input_source['data']) - 1)] 
                   for _ in range(self.request_batch_size)]
        else:  # function
            return self.input_source['data']()

    def make_request(self, request_id, is_warmup=False):
        start_time = time.time()
        
        try:
            inps = self.generate_payload()
            
            if self.debug:
                logger.debug(f"Request {request_id} - Sending input: {inps}...")
            
            results = self.client.infer(inps, unique_id=request_id)
            latency = (time.time() - start_time) * 1000  # Convert to ms
            
            if self.log_dir:
                self._log_request(request_id, inps, results, latency)
            
            if results['success']:
                if not is_warmup:
                    self.successes += 1
                    self.latencies.append(latency)
                
                if self.debug:
                    logger.debug(f"Request {request_id} - Success - Latency: {latency:.2f}ms")
                return True
            else:
                if not is_warmup:
                    self.failures += 1
                
                logger.error(f"Request {request_id} - Failed - Error: {results.get('reason', 'Unknown error')}")
                return False
                
        except Exception as e:
            self.failures += 1
            self.errors.append(str(e))
            
            logger.error(f"Request {request_id} - Exception - Error: {str(e)}")
            return False

    def _log_request(self, request_id, inputs, outputs, latency):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        log_entry = {
            'timestamp': timestamp,
            'request_id': request_id,
            'inputs': inputs,
            'outputs': outputs,
            'latency_ms': latency
        }
        log_file = os.path.join(self.log_dir, f'request_{timestamp}_{request_id}.json')
        with open(log_file, 'w') as f:
            json.dump(log_entry, f, indent=2)

    def run_benchmark(self):
        """Run the benchmark with rate limiting"""
        if self.target_rps:
            sleep_time = 1.0 / self.target_rps
        else:
            sleep_time = 0
            
        if self.debug:
            logger.debug(f"Starting warmup period ({self.warmup_seconds}s)")
        
        # Warmup period
        warmup_start = time.time()
        warmup_requests = 0
        warmup_pbar = tqdm(desc="Warmup", total=self.warmup_seconds, unit="s", mininterval=1.0)
        last_update = warmup_start
        
        while time.time() - warmup_start < self.warmup_seconds:
            self.make_request(request_id=f"warm-{warmup_requests}", is_warmup=True)
            warmup_requests += 1
            if sleep_time > 0:
                time.sleep(sleep_time)
            
            # Update progress bar
            current_time = time.time()
            elapsed = min(current_time - warmup_start, self.warmup_seconds)
            warmup_pbar.n = elapsed
            warmup_pbar.refresh()
        
        warmup_pbar.close()
        
        if self.debug:
            logger.debug(f"Warmup complete - {warmup_requests} requests made")
            
        # Main benchmark loop
        start_time = time.time()
        requests_made = 0
        
        if self.debug:
            logger.debug("Starting main benchmark loop")
        
        benchmark_pbar = tqdm(desc="Benchmark", total=self.duration_seconds, unit="s", mininterval=1.0)
        last_update = start_time
        
        while time.time() - start_time < self.duration_seconds:
            request_start = time.time()
            self.make_request(request_id=f"req-{requests_made}")
            requests_made += 1
            
            # Rate limiting
            elapsed = time.time() - request_start
            if sleep_time > elapsed:
                time.sleep(sleep_time - elapsed)
            
            # Update progress bar
            current_time = time.time()
            elapsed = min(current_time - start_time, self.duration_seconds)
            benchmark_pbar.n = elapsed
            benchmark_pbar.refresh()
        
        benchmark_pbar.close()
                
        # Calculate metrics
        if self.latencies:
            total_time = time.time() - start_time
            p95 = np.percentile(self.latencies, 95)
            p99 = np.percentile(self.latencies, 99)
            avg_latency = np.mean(self.latencies)
            total_requests = self.successes + self.failures
            actual_rps = total_requests / total_time
            
            results = {
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'total_requests': total_requests,
                'successes': self.successes,
                'failures': self.failures,
                'success_rate': (self.successes/total_requests)*100 if total_requests > 0 else 0,
                'average_latency_ms': float(avg_latency),
                'p95_latency_ms': float(p95),
                'p99_latency_ms': float(p99),
                'actual_rps': float(actual_rps),
                'target_rps': self.target_rps,
                'duration_seconds': self.duration_seconds,
                'warmup_seconds': self.warmup_seconds,
                'request_batch_size': self.request_batch_size,
                'errors': self.errors[:10],  # First 10 errors
            }
            return results
        return None

def main():
    parser = argparse.ArgumentParser(description='API Benchmark Tool')
    parser.add_argument('--server_url', type=str, required=True, help='Server URL')
    parser.add_argument('--target_rps', type=int, default=None, help='Target requests per second')
    parser.add_argument('--duration', type=int, default=60, help='Test duration in seconds')
    parser.add_argument('--warmup', type=int, default=5, help='Warmup period in seconds')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('--input_file', type=str, required=True, help='Input .json or .py file path')
    parser.add_argument('--request_batch_size', type=int, default=1, help='Request batch size')
    parser.add_argument('--log_dir', type=str, default=None, help='Directory to log request inputs and outputs')
    parser.add_argument('--results_file', type=str, default='benchmark_results.json', 
                       help='File to write benchmark results')
    args = parser.parse_args()

    if args.debug:
        logger.setLevel(logging.DEBUG)

    # Load input source (either JSON data or example_function)
    input_source = load_input_source(args.input_file)

    # Initialize and run benchmark
    runner = BenchmarkRunner(
        target_rps=args.target_rps,
        duration_seconds=args.duration,
        server_url=args.server_url,
        warmup_seconds=args.warmup,
        input_source=input_source,
        request_batch_size=args.request_batch_size,
        log_dir=args.log_dir,
        debug=args.debug
    )
    
    print(f"\nStarting benchmark...")
    print(f"Target RPS: {args.target_rps or 'unlimited'}")
    print(f"Duration: {args.duration} seconds (+ {args.warmup} seconds warmup)")
    print(f"Request batch size: {args.request_batch_size}")
    print(f"Input source: {args.input_file} ({input_source['type']})\n")
    
    results = runner.run_benchmark()
    
    if results:
        # Write results to file
        with open(args.results_file, 'w') as f:
            json.dump(results, f, indent=2)
            
        print("\nBenchmark Results:")
        print("=" * 50)
        print(f"Total Requests: {results['total_requests']}")
        print(f"Successes: {results['successes']}")
        print(f"Failures: {results['failures']}")
        print(f"Success Rate: {results['success_rate']:.2f}%")
        print(f"\nLatency (ms):")
        print(f"  Average: {results['average_latency_ms']:.2f}")
        print(f"  P95: {results['p95_latency_ms']:.2f}")
        print(f"  P99: {results['p99_latency_ms']:.2f}")
        print(f"\nActual RPS: {results['actual_rps']:.2f}")
        print(f"Target RPS: {results['target_rps'] or 'unlimited'}")
        
        if results['errors']:
            print("\nSample Errors:")
            for error in results['errors']:
                print(f"  - {error}")
                
        print(f"\nFull results written to: {args.results_file}")
    
if __name__ == "__main__":
    main()
