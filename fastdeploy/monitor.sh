#!/bin/bash

# Function to check if nvidia-smi is available
check_nvidia_smi() {
    command -v nvidia-smi >/dev/null 2>&1
}

# Function to get GPU usage for a PID
get_gpu_usage() {
    pid=$1
    if check_nvidia_smi; then
        gpu_mem=$(nvidia-smi --query-compute-apps=pid,used_memory --format=csv,noheader,nounits | grep "^$pid," | cut -d',' -f2 | tr -d ' ')
        gpu_util=$(nvidia-smi --query-compute-apps=pid,gpu_util --format=csv,noheader,nounits | grep "^$pid," | cut -d',' -f2 | tr -d ' ')
        
        gpu_mem=${gpu_mem:-0}
        gpu_util=${gpu_util:-0}
    else
        gpu_mem=0
        gpu_util=0
    fi
    
    echo "$gpu_util $gpu_mem"
}

# Function to get CPU and memory usage for a single PID
get_usage() {
    pid=$1
    cpu=$(ps -p $pid -o %cpu= | tr -d ' ')
    mem=$(ps -p $pid -o rss= | tr -d ' ')
    mem_mb=$(printf "%.2f" $(echo "$mem / 1024" | bc -l))
    echo "$cpu $mem_mb"
}

# Function to sum CPU and memory usage for multiple PIDs
sum_usage() {
    pids=$1
    cpu_sum=0
    mem_sum=0
    
    for pid in $pids; do
        read cpu mem <<< $(get_usage $pid)
        cpu_sum=$(echo "$cpu_sum + $cpu" | bc -l)
        mem_sum=$(echo "$mem_sum + $mem" | bc -l)
    done
    
    echo "$cpu_sum $mem_sum"
}

# Initialize arrays for storing historical data
declare -a loop_cpu_history
declare -a loop_ram_history
declare -a loop_gpu_util_history
declare -a loop_gpu_mem_history
declare -a rest_cpu_history
declare -a rest_ram_history

# Function to calculate statistics
calculate_stats() {
    local values=("$@")
    local count=${#values[@]}
    
    if [ $count -eq 0 ]; then
        echo '{"min": "N/A", "max": "N/A", "avg": "N/A"}'
        return
    fi
    
    local min=${values[0]}
    local max=${values[0]}
    local sum=0
    
    for value in "${values[@]}"; do
        sum=$(printf "%.2f" $(echo "$sum + $value" | bc -l))
        
        if (( $(echo "$value < $min" | bc -l) )); then
            min=$value
        fi
        
        if (( $(echo "$value > $max" | bc -l) )); then
            max=$value
        fi
    done
    
    local avg=$(printf "%.2f" $(echo "$sum / $count" | bc -l))
    
    echo "{\"min\": $min, \"max\": $max, \"avg\": $avg}"
}

# Function to add value to history array (maintaining last 5 values)
add_to_history() {
    local array_name=$1
    local value=$2
    
    eval "$array_name[\${#$array_name[@]}]=$value"
    
    if [ $(eval "echo \${#$array_name[@]}") -gt 5 ]; then
        eval "$array_name=(\"\${$array_name[@]:1}\")"
    fi
}

# Function to create JSON output
create_json() {
    local loop_pid=$1
    local rest_pids=$2
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local output=""
    
    output+="{\n"
    output+="  \"timestamp\": \"$timestamp\",\n"
    
    # Loop process data
    output+="  \"loop_process\": {\n"
    if [ ! -z "$loop_pid" ]; then
        read cpu mem <<< $(get_usage $loop_pid)
        read gpu_util gpu_mem <<< $(get_gpu_usage $loop_pid)
        
        add_to_history loop_cpu_history "$cpu"
        add_to_history loop_ram_history "$mem"
        add_to_history loop_gpu_util_history "$gpu_util"
        add_to_history loop_gpu_mem_history "$gpu_mem"
        
        output+="    \"pid\": $loop_pid,\n"
        output+="    \"status\": \"running\",\n"
        output+="    \"current\": {\n"
        output+="      \"cpu\": $cpu,\n"
        output+="      \"ram\": $mem,\n"
        output+="      \"gpu_util\": $gpu_util,\n"
        output+="      \"gpu_mem\": $gpu_mem\n"
        output+="    },\n"
        output+="    \"stats\": {\n"
        output+="      \"cpu\": $(calculate_stats "${loop_cpu_history[@]}"),\n"
        output+="      \"ram\": $(calculate_stats "${loop_ram_history[@]}"),\n"
        output+="      \"gpu_util\": $(calculate_stats "${loop_gpu_util_history[@]}"),\n"
        output+="      \"gpu_mem\": $(calculate_stats "${loop_gpu_mem_history[@]}")\n"
        output+="    }\n"
    else
        output+="    \"status\": \"not_running\"\n"
    fi
    output+="  },\n"
    
    # REST processes data
    output+="  \"rest_processes\": {\n"
    if [ ! -z "$rest_pids" ]; then
        read cpu mem <<< $(sum_usage "$rest_pids")
        
        add_to_history rest_cpu_history "$cpu"
        add_to_history rest_ram_history "$mem"
        
        output+="    \"pids\": [$(echo $rest_pids | sed 's/ /, /g')],\n"
        output+="    \"status\": \"running\",\n"
        output+="    \"current\": {\n"
        output+="      \"cpu\": $cpu,\n"
        output+="      \"ram\": $mem\n"
        output+="    },\n"
        output+="    \"stats\": {\n"
        output+="      \"cpu\": $(calculate_stats "${rest_cpu_history[@]}"),\n"
        output+="      \"ram\": $(calculate_stats "${rest_ram_history[@]}")\n"
        output+="    }\n"
    else
        output+="    \"status\": \"not_running\"\n"
    fi
    output+="  }\n"
    output+="}"

    echo -e "$output"
}

# Main monitoring function
monitor() {
    # Get PIDs
    loop_pid=$(pgrep -f "fastdeploy.*loop")
    rest_pids=$(pgrep -f "fastdeploy.*rest")
    
    # Create JSON and write to file
    create_json "$loop_pid" "$rest_pids" > monitoring_results.json
}

# Run the monitor function every 2 seconds
while true; do
    monitor
    sleep 1
done
