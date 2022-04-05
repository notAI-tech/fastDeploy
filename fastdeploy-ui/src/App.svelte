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
    Tile,
    ButtonSet,
    Checkbox,
    Button,
    TextArea,
    FileUploader,
    CodeSnippet
} from 'carbon-components-svelte';

import ChartComboStacked32 from "carbon-icons-svelte/lib/ChartComboStacked32";
import Catalog32 from "carbon-icons-svelte/lib/Catalog32";
import Home32 from "carbon-icons-svelte/lib/Home32";

let theme = "g90";
let isSideNavOpen = false;

import {
    onMount
} from "svelte";

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

async function getResult() {
    console.log(multi_input)
    curl_text = JSON_CURL_TEXT.replaceAll('EXAMPLE', JSON.stringify(JSON.parse(multi_input)))
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

	<SideNav bind:isOpen={isSideNavOpen} rail>
		<SideNavItems>
			<SideNavLink icon={Home32} text="Home" href="/" isSelected />
			<SideNavLink icon={Catalog32} text="Logs (coming soon)" href="/" />
			<SideNavLink icon={ChartComboStacked32} text="Graphs (coming soon)" href="/" />
		</SideNavItems>
	</SideNav>
</Header>

<Content>
	<Grid padding=true>
		<Row padding=true>
			<Column>
				<Row>
					<TextArea bind:value={multi_input} placeholder={multi_input}/>
				</Row>

				<FileUploader multiple buttonLabel="Add files" status="complete" disabled=true/>

				<ButtonSet stacked=true>
					<Checkbox labelText="Async request" bind:async_check_box_bool/>
					<Button kind="primary" outline on:click={getResult}>Post</Button>
				</ButtonSet>
			</Column>

			<Column>
				<CopyButton bind:text={result} feedback="Copied to clipboard" />
				<Tile light> {result} </Tile>
				<CodeSnippet wrapText type="multi" code={curl_text} />
			</Column>
		</Row>

		<Row padding=true>
			<Column>
				<ExpandableTile>
					<div slot="above" style="height: 5rem">Predictor stats</div>
					<div slot="below" style="height: 5rem">Below the fold content here</div>
				</ExpandableTile>
			</Column>

			<Column>
				<ExpandableTile>
					<div slot="above" style="height: 5rem">API stats</div>
					<div slot="below" style="height: 5rem">Below the fold content here</div>
				</ExpandableTile>
			</Column>

			<Column>
				<ExpandableTile>
					<div slot="above" style="height: 5rem">Wait times</div>
					<div slot="below" style="height: 5rem">Below the fold content here</div>
				</ExpandableTile>
			</Column>

			<Column>
				<ExpandableTile>
					<div slot="above" style="height: 5rem">Batch size stats</div>
					<div slot="below" style="height: 5rem">Below the fold content here</div>
				</ExpandableTile>
			</Column>

			<Column>
				<ExpandableTile>
					<div slot="above" style="height: 5rem">Above the fold content here</div>
					<div slot="below" style="height: 5rem">Below the fold content here</div>
				</ExpandableTile>
			</Column>
		</Row>
	</Grid>
</Content>