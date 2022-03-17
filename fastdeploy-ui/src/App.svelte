
<svelte:head><link rel="stylesheet" href="https://unpkg.com/carbon-components-svelte@0.30.0/css/g10.css" /></svelte:head>

<script>
	import {CopyButton, Theme, ButtonSet, RadioButtonGroup, RadioButton, Checkbox, Button, TextArea, Grid, Column, Row, FileUploader, CodeSnippet } from 'carbon-components-svelte';
	let theme = "g90";

	import { onMount } from "svelte";

	
	let multi_input = 'Loading ...';
	let async_check_box_bool = false;
	
	let result = 'Post to see result';
	let curl_text = 'Loading ...'
	let JSON_CURL_TEXT = `# Sync request to fastdeploy
curl -d 'EXAMPLE' -H "Content-Type: application/json" -X POST "http://localhost:8080/infer"

# Async request to fastdeploy
curl -d 'EXAMPLE' -H "Content-Type: application/json" -X POST "http://localhost:8080/infer?async=true"

# Result for async request
curl -d '{"unique_id": "REQUEST_ID"}' -H "Content-Type: application/json" -X POST "http://localhost:8080/res"`
	let META = {};

	

	onMount(async () => {
		fetch("/meta")
		.then(response => response.json())
		.then(data => {
				META = data
				multi_input = JSON.stringify(data["example"], null, 4);

				if (!META['is_file_input']) {
					curl_text = JSON_CURL_TEXT.replaceAll('EXAMPLE', JSON.stringify(data["example"]))
				}
				console.log("META", META);
		}).catch(error => {
			console.log(error);
			return [];
		});
		});
		
	async function getResult () {
		console.log(multi_input)
		curl_text = JSON_CURL_TEXT.replaceAll('EXAMPLE', JSON.stringify(JSON.parse(multi_input)))
		const res = await fetch('/infer', {
			method: 'POST',
			headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
					},
			body: JSON.stringify({"data": JSON.parse(multi_input)})
		})
		
		const json = await res.json()
		result = JSON.stringify(json['prediction'], null, 4)

	}
</script>

<Theme bind:theme />

<!-- <RadioButtonGroup legendText="Carbon theme" bind:selected={theme}>
  {#each ["white", "g10", "g80", "g90", "g100"] as value}
    <RadioButton labelText={value} {value} />
  {/each}
</RadioButtonGroup> -->

<Grid padding=true>
	<Row padding=true>
		<Column>
			<Row>
				<TextArea bind:value={multi_input} placeholder={multi_input}/>
			</Row>

			<Row></Row>

			<FileUploader multiple buttonLabel="Add files" status="complete" disabled=true/>

			<ButtonSet stacked=true>
				<Checkbox labelText="Async request" bind:async_check_box_bool/>
				<Button kind="primary" outline on:click={getResult}>Post</Button>
			</ButtonSet>



		</Column>

		<Column>
			<CopyButton bind:text={result} feedback="Copied to clipboard" />
			<TextArea light readonly bind:value={result} placeholder={result}/>
			<CodeSnippet wrapText type="multi" code={curl_text} />
		</Column>
	</Row>
</Grid>
