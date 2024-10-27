import gevent
from gevent import monkey; monkey.patch_all()
import time
import numpy as np
from collections import deque
import statistics
from datetime import datetime
import argparse
import logging
import urllib.parse
from fdclient import FDClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BenchmarkRunner:
    def __init__(self, target_rps, duration_seconds, server_url, 
                 warmup_seconds=5, sample_input=None, concurrent_users=50):
        self.target_rps = target_rps
        self.duration_seconds = duration_seconds
        self.warmup_seconds = warmup_seconds
        self.sample_input = sample_input or {"default": "input"}
        self.concurrent_users = concurrent_users
        self.server_url = server_url
        
        # Initialize metrics storage
        self.latencies = []
        self.errors = []
        self.request_timestamps = deque()
        
        # For better RPS control
        self.window_size = 1.0  # 1 second rolling window
        self.start_time = None
        self.request_count = 0
        
        # Initialize client with server URL
        logger.info(f"Initializing FDClient with server URL: {self.server_url}")
        self.client = FDClient(server_url=self.server_url)

    def make_request(self):
        start_time = time.time()
        try:
            results = self.client.infer(self.sample_input)
            latency = (time.time() - start_time) * 1000  # Convert to ms
            self.latencies.append(latency)
            return True
        except Exception as e:
            self.errors.append(str(e))
            logger.error(f"Request failed: {str(e)}")
            return False

    def calculate_current_rps(self):
        """Calculate current RPS based on rolling window"""
        now = time.time()
        # Remove timestamps older than our window
        while self.request_timestamps and now - self.request_timestamps[0] > self.window_size:
            self.request_timestamps.popleft()
        return len(self.request_timestamps) / self.window_size

    def should_throttle(self):
        """More precise throttling logic"""
        if not self.start_time:
            return False
            
        elapsed_time = time.time() - self.start_time
        if elapsed_time == 0:
            return True
            
        expected_requests = self.target_rps * elapsed_time
        return self.request_count >= expected_requests

    def user_task(self):
        """Task representing a single user making requests"""
        while time.time() < self.end_time:
            # Check if we need to throttle
            if self.should_throttle():
                # Calculate sleep time based on target rate
                sleep_time = 1.0 / self.target_rps
                gevent.sleep(sleep_time)
                continue
                
            success = self.make_request()
            if success:
                now = time.time()
                self.request_timestamps.append(now)
                self.request_count += 1

    def run_benchmark(self):
        logger.info(f"Starting benchmark with target {self.target_rps} RPS")
        logger.info(f"Warming up for {self.warmup_seconds} seconds...")
        
        # Warmup phase
        warmup_end = time.time() + self.warmup_seconds
        while time.time() < warmup_end:
            self.make_request()
            gevent.sleep(1.0 / self.target_rps)
        
        # Clear warmup metrics
        self.latencies = []
        self.errors = []
        self.request_timestamps.clear()
        self.request_count = 0
        
        # Main benchmark
        self.start_time = time.time()
        self.end_time = self.start_time + self.duration_seconds
        users = [gevent.spawn(self.user_task) for _ in range(self.concurrent_users)]
        
        # Monitor and log actual RPS during the test
        def monitor_rps():
            while time.time() < self.end_time:
                current_rps = self.calculate_current_rps()
                logger.debug(f"Current RPS: {current_rps:.2f}")
                gevent.sleep(1)
        
        monitor_greenlet = gevent.spawn(monitor_rps)
        gevent.joinall([monitor_greenlet] + users)
        
        return self.calculate_metrics()

    def calculate_metrics(self):
        if not self.latencies:
            return {"error": "No successful requests recorded"}
        
        latencies = np.array(self.latencies)
        total_requests = len(self.latencies) + len(self.errors)
        error_rate = (len(self.errors) / total_requests) * 100 if total_requests > 0 else 0
        actual_duration = self.end_time - self.start_time
        
        metrics = {
            "total_requests": total_requests,
            "successful_requests": len(self.latencies),
            "failed_requests": len(self.errors),
            "error_rate": f"{error_rate:.2f}%",
            "target_rps": self.target_rps,
            "actual_rps": len(self.latencies) / actual_duration,
            "actual_duration": actual_duration,
            "server_url": self.server_url,
            "latency": {
                "min": np.min(latencies),
                "max": np.max(latencies),
                "mean": np.mean(latencies),
                "median": np.median(latencies),
                "p95": np.percentile(latencies, 95),
                "p99": np.percentile(latencies, 99),
                "std_dev": np.std(latencies)
            }
        }
        
        return metrics

def validate_url(url):
    """Validate the URL format"""
    try:
        result = urllib.parse.urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def main():
    parser = argparse.ArgumentParser(description='API Benchmark Tool')
    parser.add_argument('--host', type=str, required=True, help='Server hostname or IP')
    parser.add_argument('--port', type=int, required=True, help='Server port')
    parser.add_argument('--rps', type=int, default=10, help='Target requests per second')
    parser.add_argument('--duration', type=int, default=60, help='Test duration in seconds')
    parser.add_argument('--warmup', type=int, default=5, help='Warmup period in seconds')
    parser.add_argument('--users', type=int, default=50, help='Number of concurrent users')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    args = parser.parse_args()

    if args.debug:
        logger.setLevel(logging.DEBUG)

    # Construct and validate server URL
    server_url = f"http://{args.host}:{args.port}"
    if not validate_url(server_url):
        logger.error(f"Invalid server URL: {server_url}")
        return

    # Sample input - modify as needed
    sample_input = ["Some example sentence quick brown fox jumps over the lazy dog and the quick brown fox", "Another example sentence tiger is the fastest animal on earth"]

    runner = BenchmarkRunner(
        target_rps=args.rps,
        duration_seconds=args.duration,
        server_url=server_url,
        warmup_seconds=args.warmup,
        sample_input=sample_input,
        concurrent_users=args.users
    )

    logger.info("Starting benchmark...")
    metrics = runner.run_benchmark()
    
    logger.info("\nBenchmark Results:")
    logger.info(f"Server URL: {metrics['server_url']}")
    logger.info(f"Target RPS: {metrics['target_rps']}")
    logger.info(f"Actual RPS: {metrics['actual_rps']:.2f}")
    logger.info(f"Total Requests: {metrics['total_requests']}")
    logger.info(f"Successful Requests: {metrics['successful_requests']}")
    logger.info(f"Failed Requests: {metrics['failed_requests']}")
    logger.info(f"Error Rate: {metrics['error_rate']}")
    logger.info(f"Test Duration: {metrics['actual_duration']:.2f} seconds")
    logger.info("\nLatency Statistics (ms):")
    for key, value in metrics['latency'].items():
        logger.info(f"{key}: {value:.2f}")

if __name__ == "__main__":
    main()
