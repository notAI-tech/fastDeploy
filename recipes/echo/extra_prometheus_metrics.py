def get_prometheus_metrics():
    return {
        "test_metric": {
            "type": "counter",
            "help": "This is a test metric",
            "value": 1
        }
    }