<script>
	import { onMount } from "svelte";
	import { HSplitPane, VSplitPane } from 'svelte-split-pane';

	let single_input = 'Loading...'
	let result = 'Make a query to see result.'
	let META = null
	
	onMount(async () => {
		fetch("http://localhost:8000/meta")
		.then(response => response.json())
		.then(data => {
				META = data
				single_input = data["example"][0];
				console.log("META", META);
		}).catch(error => {
			console.log(error);
			return [];
		});
		});
		
	async function getResult () {
		console.log( JSON.stringify([single_input]))
		const res = await fetch('http://localhost:8000/infer', {
			method: 'POST',
			headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
					},
			body: JSON.stringify({"data": [single_input]})
		})
		
		const json = await res.json()
		result = JSON.stringify(json['prediction'][0])

	}
</script>


<input bind:value={single_input} placeholder={single_input}/>
<button type="button" on:click={getResult}>
	Post it.
</button>
<p>
	Result:
</p>
<pre>
{result}
</pre>