<svelte:head><link rel="stylesheet" href="https://unpkg.com/carbon-components-svelte@0.30.0/css/g10.css" /></svelte:head>

<script>
import {
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    SideNav,
    SideNavItems,
    SideNavMenu,
    SideNavMenuItem,
    SideNavLink,
    SideNavDivider,
    SkipToContent,
    Content,
    Grid,
    Row,
    Column,

    CopyButton,
	ExpandableTile,
    Theme,
	Tag,
    Tile,
    ButtonSet,
    Checkbox,
    Button,
    TextArea,
    FileUploader,
    CodeSnippet,
	Loading,
	FileUploaderButton,
	Dropdown
} from 'carbon-components-svelte';

import Terminal32 from "carbon-icons-svelte/lib/Terminal32";
import LogoPython32 from "carbon-icons-svelte/lib/LogoPython32";

import Chart from 'svelte-frappe-charts';

let theme = "g90";
let loader_active = true;
let isSideNavOpen = false;

import {
    onMount
} from "svelte";

let multi_input = 'Loading ...';
let async_check_box_bool = false;
let file_upload_required = false;
let files = [];

let CMD_TEXTS = ['click "cURL" or "Python" above to see the request format', '', ''];

let result = 'Post to see result';
let sync_curl_text = 'Loading ...'
let async_curl_text = 'Loading ...'
let JSON_CURL_SYNC = `curl -d 'EXAMPLE' -H "Content-Type: application/json" -X POST "http://localhost:8080/infer"`
let FILE_CURL_SYNC = `curl EXAMPLE "http://localhost:8080/infer"`
let res_curl_text = `curl -d '{"unique_id": "REQUEST_ID"}' -H "Content-Type: application/json" -X POST "http://localhost:8080/res"`

let sync_python_text = 'Loading ...'
let async_python_text = 'Loading ...'
let JSON_PYTHON_SYNC = `requests.post("http://localhost:8080/infer", json=EXAMPLE).json()`
let FILE_PYTHON_SYNC = `requests.post("http://localhost:8080/infer", files={"f1": open("EXAMPLE", "rb")}).json()`
let res_python_text = `requests.get("http://localhost:8080/res", json={"unique_id": "REQUEST_ID"}).json()`
let index_to_all_metadata = {}

let META = {};

let time_graph_ref;
let time_graph_data = {
    labels: [],
    datasets: [
      { name: "Response time", values: []},
      { name: "Prediction time", values: []},
    ]
  };

const on_time_graph_select = (event) => {
console.log("Data select event fired!", event);
on_time_graph_selected = event;
};
let on_time_graph_selected;

onMount(async () => {
    fetch("/meta")
        .then(response => response.json())
        .then(data => {
            META = data
            multi_input = JSON.stringify(data["example"], null, 4);

            if (!META['is_file_input']) {
                sync_curl_text = JSON_CURL_SYNC.replaceAll('EXAMPLE', JSON.stringify(data["example"]))
				async_curl_text = sync_curl_text + '?async=true'
				
				sync_python_text = JSON_PYTHON_SYNC.replaceAll('EXAMPLE', JSON.stringify(data["example"]))
				async_python_text = sync_python_text.replaceAll("/infer", "/infer?async=true")

            } else {
				sync_curl_text = FILE_CURL_SYNC.replaceAll('EXAMPLE', '-F f1=@"' + data["example"][0] + '"')
				async_curl_text = sync_curl_text + '?async=true'
				
				sync_python_text = FILE_PYTHON_SYNC.replaceAll('EXAMPLE', data["example"][0])
				async_python_text = sync_python_text.replaceAll("/infer", "/infer?async=true")

				file_upload_required = true
				multi_input = `File input:
				A sample file can be downloaded from below.
				Multiple files in same request is not supported in UI.
				It is fully supported by fastdeploy.`
			}
            console.log("META", META);
			loader_active = false
        }).catch(error => {
            console.log(error);
            return [];
        });


	fetch("/metrics")
        .then(response => response.json())
        .then(data => {
			console.log(data)
			time_graph_data = data['time_graph_data']
			index_to_all_metadata = data['index_to_all_meta']
        }).catch(error => {
            console.log(error);
            return [];
        });
});

async function getResult() {
	loader_active = true
	sync_curl_text = JSON_CURL_SYNC.replaceAll('EXAMPLE', JSON.stringify(JSON.parse(multi_input)))
	async_curl_text = sync_curl_text + '?async=true'

	const res = await fetch('/infer', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			"data": JSON.parse(multi_input)
		})
	})

	const json = await res.json()
	result = JSON.stringify(json['prediction'], null, 4)
	loader_active = false

}

async function getFileResult() {
	loader_active = true
	sync_curl_text = FILE_CURL_SYNC.replaceAll('EXAMPLE', '-F f1=@"' + files[0]["name"] + '"')
	async_curl_text = sync_curl_text + '?async=true'

	const formData = new FormData();
	formData.append('f0', files[0]);

	console.log(formData)
	const res = await fetch('/infer', {
		method: 'POST',
		body: formData
	})

	const json = await res.json()
	result = JSON.stringify(json['prediction'], null, 4)
	
	loader_active = false

}
</script>

<Header company="fastDeploy" platformName="monitor" bind:isSideNavOpen>
	<svelte:fragment slot="skip-to-content">
	  <SkipToContent />
	</svelte:fragment>
	
	<HeaderNav>
	  <HeaderNavItem href="/" text="" />
	  <HeaderNavItem href="/" text="" />
	  <HeaderNavItem href="/" text="" />
	</HeaderNav>

	<!-- <SideNav bind:isOpen={isSideNavOpen} rail>
		<SideNavItems>
			<SideNavLink icon={Home32} text="Home" href="/" isSelected />
			<SideNavLink icon={Catalog32} text="Logs (coming soon)" href="/" />
			<SideNavLink icon={ChartComboStacked32} text="Graphs (coming soon)" href="/" />
		</SideNavItems>
	</SideNav> -->
</Header>

<Content>
	<Loading active={loader_active}/>

	<Grid padding=true>
		<Row padding=true>
			<Column>
				<Row>
					<TextArea bind:value={multi_input} placeholder={multi_input} disabled={file_upload_required}/>
				
					<ButtonSet stacked=true>
						<Button kind="ghost" size="small" outline on:click={getResult} disabled={file_upload_required}>Post json</Button>
					</ButtonSet>

				</Row>

				<Row>
					<ButtonSet>
						<FileUploaderButton labelText="Select file and post" on:change={getFileResult} status="complete" disabled={!file_upload_required} bind:files/>
						<Button kind="ghost" size="small" outline href="/meta?example=true" disabled={!file_upload_required}>Download example file</Button>
					</ButtonSet>
				</Row>
			</Column>

			<Column>
				<CopyButton bind:text={result} feedback="Copied to clipboard" />
				<Tile light> {result} </Tile>
				

				<ButtonSet>
					<Button icon={Terminal32} on:click={() => (CMD_TEXTS = [sync_curl_text, async_curl_text, res_curl_text])} kind="secondary" size="small" iconDescription="Copy cURL command">cURL</Button>
					<Button icon={LogoPython32} on:click={() => (CMD_TEXTS = [sync_python_text, async_python_text, res_python_text])} kind="secondary" size="small" iconDescription="Copy Python code">Python</Button>
					<Button href="https://curlconverter.com/" kind="ghost" size="small">Other Languages (curlconverter)</Button>
					<Button href="https://github.com/notAI-tech/fastDeploy/blob/master/inference.md#inference" kind="ghost" size="small">Inference documentation</Button>
				</ButtonSet>
				
				
				<!-- async_curl_text -->
				<!-- res_curl_text -->

				<CodeSnippet wrapText type="single" code={CMD_TEXTS[0]} />
				<CodeSnippet wrapText type="single" code={CMD_TEXTS[1]} />
				<CodeSnippet wrapText type="single" code={CMD_TEXTS[2]} />
			</Column>
		</Row>

		<Row padding=true>
			<Dropdown
				titleText="Graphs time frame"
				selectedId="0"
				items={[
					{ id: "0", text: "Last 1 hr" },
					// { id: "1", text: "Last 6 hrs" },
					// { id: "2", text: "Last 12 hrs" },
					// { id: "3", text: "Last 24 hrs" },
					// { id: "4", text: "All" },
				]}
				/>

			<Column>
				<Chart title="Latency graph" colors={["green", "blue"]} data={time_graph_data} type="line" bind:this={time_graph_ref} isNavigable on:data-select={on_time_graph_select} lineOptions={{"dotSize": 4}} tooltipOptions=	{{formatTooltipX: d => index_to_all_metadata[d]["unique_id"] + "</br> received: " + index_to_all_metadata[d]["received_time"] + "</br> in_batch_size/predicted_in_batch_of_size:" + index_to_all_metadata[d]["batch_size"] + "/" + index_to_all_metadata[d]["predicted_in_batch"], formatTooltipY: d => d + ' sec'}}/>
			</Column>

		</Row>

		<!-- <Row padding=true>
			<ExpandableTile>
				<div slot="above" >Above the fold content here</div>
				<div slot="below" >Below the fold content here</div>
			</ExpandableTile>
		</Row> -->

	</Grid>
</Content>