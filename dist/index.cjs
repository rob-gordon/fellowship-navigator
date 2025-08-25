#!/usr/bin/env node
"use strict";var G=Object.create;var A=Object.defineProperty;var N=Object.getOwnPropertyDescriptor;var F=Object.getOwnPropertyNames;var L=Object.getPrototypeOf,H=Object.prototype.hasOwnProperty;var D=(e,t)=>{for(var a in t)A(e,a,{get:t[a],enumerable:!0})},T=(e,t,a,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of F(t))!H.call(e,n)&&n!==a&&A(e,n,{get:()=>t[n],enumerable:!(o=N(t,n))||o.enumerable});return e};var v=(e,t,a)=>(a=e!=null?G(L(e)):{},T(t||!e||!e.__esModule?A(a,"default",{value:e,enumerable:!0}):a,e)),M=e=>T(A({},"__esModule",{value:!0}),e);var ne={};D(ne,{presentOptions:()=>$});module.exports=M(ne);var i=require("@clack/prompts"),R=require("@openrouter/ai-sdk-provider"),y=require("ai"),f=require("zod"),j=v(require("fs"),1),O=v(require("path"),1),C=v(require("dotenv"),1);var U="https://offers-and-asks-slack-nbgim.ondigitalocean.app/api/extended-search",B="6fd53d2d-cd2f-49a3-ad9b-f85c867bb955";async function k(e){try{let t=await fetch(U,{method:"POST",headers:{Authorization:`Bearer ${B}`,"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`HTTP error! status: ${t.status}, statusText: ${t.statusText}`);return await t.json()}catch(t){throw console.error("\u274C Error searching fellowship content:",t),t}}var Y=["s","k","-","o","r","-","v","1","-","8","b","7","3","f","3","2","c","2","3","f","c","9","d","7","5","6","f","3","d","5","3","8","9","b","4","f","e","5","0","3","a","d","c","5","6","8","2","e","8","a","a","2","6","4","d","d","6","b","0","3","7","4","a","0","a","b","3","8","c","a","7","f","e"];function S(){return Y.join("")}C.default.config({quiet:!0});var q=process.env.OPENROUTER_API_KEY||S(),_=(0,R.createOpenRouter)({apiKey:q}),x=0,b={HAIR_ON_FIRE_PROBLEM:"",EPISTEMIC_GOAL:"",TARGET_USER:"",TECHNICAL_SHAPE:"",SIGNAL_GATHERING:""},g=Object.keys(b);async function z(){(0,i.intro)("\u{1F3AF} Welcome to the AI+Epistemics Fellowship Project Picker!");let e=process.argv[2],t=e?await W(e):"";e||i.log.info("\u{1F4A1} Tip: You can provide initial context by passing a file (npx github:rob-gordon/fellowship-navigator context.txt)");let a=await K(t),o=!0,n=!0;for(;g.filter(u=>!b[u]).length!==0;){n?(x=await Z(t),n=!1):x=o?X():V();let r=g[x],c=await J(r,t,a,b),p=(0,i.spinner)();p.start("\u{1F4AD} Thinking about options...");let d="",l="",w=null;try{l=await Q(r,t,c.response,b),w=await k({query:l,topK:15,includeThreads:!0,useAdvancedRetrieval:!0,enableContextExpansion:!0,enableRecencyBoost:!1,includeDocumentSummaries:!0,sources:["slack","document"],rerank:!0,semanticWeight:.7}),d=await ee(w,r,t,c.response)}catch{d=""}finally{p.stop()}let s=!1;o=!0;let m,E;for(;o&&!s;){let u=await $(r,t,a,c.question,c.response,m,E,d);if(u.type==="change_options")m=u.previousOptions||[],E=u.explanation,s=!1,o=!0;else if(u.type==="change_dimension")s=!1,o=!1;else if(u.type==="selected"){let I=u.selected_options.join(", "),P=u.comment?`${I} (Note: ${u.comment})`:I;b[r]=P,m=u.shownOptions,s=!0,o=!0}u.type}}await te(t,a,b)}async function W(e){try{let t=O.default.resolve(e);return j.default.readFileSync(t,"utf-8").trim()}catch{process.exit(1)}}async function K(e){return e?`Got it - you're interested in ${e}. Let's explore some project dimensions.`:"Let's explore some project dimensions for your fellowship."}function X(){let e=x,t=0;do if(e=(e+1)%g.length,t++,t>=g.length)return x;while(b[g[e]]);return e}function V(){let e=(x+Math.floor(g.length/2))%g.length,t=0;for(;b[g[e]]&&t<g.length;)e=(e+1)%g.length,t++;return t>=g.length?x:e}async function Z(e){let{text:t}=await(0,y.generateText)({model:_("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are analyzing user context to determine which project dimension they seem most interested in discussing first. 

Available dimensions: 
- HAIR_ON_FIRE_PROBLEM (urgent global info/communication problem)
- EPISTEMIC_GOAL (what reasoning/epistemic improvement goal)
- TARGET_USER (who will use/benefit from the project)
- TECHNICAL_SHAPE (what form the project takes - app, org, etc.)
- SIGNAL_GATHERING (how to find target users and test interest/demand)

User context: "${e}"

Based on their context, which dimension seems most relevant to start with? If no dimension clearly relates to their context, choose HAIR_ON_FIRE_PROBLEM as a good starting point. 

Return only the dimension name exactly as it appears in the list (e.g., "TARGET_USER", "EPISTEMIC_GOAL", etc.).`}]}),a=t.trim().toUpperCase(),o=g.findIndex(n=>n===a);return o!==-1?o:g.findIndex(n=>n==="HAIR_ON_FIRE_PROBLEM")}async function J(e,t,a,o){let n=Object.keys(o).filter(l=>o[l]!==""),h="";n.length>0&&(h=`The user has already expressed preferences for the following project dimensions:
${n.map(l=>`${l}
======
${o[l]}`).join(`

`)}`);let r={HAIR_ON_FIRE_PROBLEM:"the urgent 'world on fire' problem related to global information and communication that your project addresses",EPISTEMIC_GOAL:"what epistemic or human reasoning improvement your project aims to achieve",TARGET_USER:"who will use or benefit from your project (the specific people you want to help)",TECHNICAL_SHAPE:"what form your project will take (app, organization, manifesto, RFC, device, curriculum, etc.)",SIGNAL_GATHERING:"how you plan to find your target users and gather initial signal about interest or demand for your project"},c="",p=(0,y.streamText)({model:_("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${t}"

This represents their background interest - a starting point for exploration, not a constraint. Encourage creative thinking beyond their initial context.`},{role:"assistant",content:a},{role:"system",content:`${h?`

${h}

`:""}Ask a concise, direct question (1-2 sentences max) about: ${r[e]||e}. 

Be specific and focused - avoid lengthy explanations or multiple sub-questions. Don't assume they have a project yet - you're exploring this dimension to help them discover possibilities.`}],onFinish:l=>{c=l.text}});await i.stream.message(p.textStream);let d=await(0,i.text)({message:"Your thoughts:"});return{question:c,response:d.toString()}}async function Q(e,t,a,o){let n=Object.keys(o).filter(p=>o[p]!==""),h="";n.length>0&&(h=`Previous choices:
${n.map(p=>`${p}: ${o[p]}`).join(`
`)}`);let r={HAIR_ON_FIRE_PROBLEM:"urgent global information/communication problems to address",EPISTEMIC_GOAL:"what epistemic or reasoning improvement the project aims to achieve",TARGET_USER:"who will use or benefit from the project",TECHNICAL_SHAPE:"form the project will take (app, organization, tool, etc.)",SIGNAL_GATHERING:"methods to find users and test initial interest or demand"},{text:c}=await(0,y.generateText)({model:_("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are generating a search term to find fellowship discussions that will help create diverse options for the user's project dimension.

CONTEXT: We're working on the ${e} dimension (${r[e]||e}). The search results will be used to generate an array of specific options within this dimension that align with the user's needs and previous choices.

${h?`User's previous dimensional choices:
${h}

`:""}User's current response about ${e}: "${a}"

Generate a focused search term (2-6 words) that will find fellowship discussions relevant to both:
1. The user's specific interests/needs expressed in their response
2. The type of options we need to generate for the ${e} dimension

The search should discover conversations that contain examples, approaches, or perspectives that could inspire diverse options within this dimension, considering their existing project direction.

Examples:
- If working on TARGET_USER and they mentioned "researchers" \u2192 search "academic collaboration tools"
- If working on TECHNICAL_SHAPE and they mentioned "mobile" \u2192 search "mobile epistemics applications"
- If working on EPISTEMIC_GOAL and they mentioned "bias reduction" \u2192 search "bias recognition methods"

Return only the search term, nothing else.`}]});return c.trim()}async function ee(e,t,a,o){if(!e.ok||e.slack_contexts.length===0&&e.document_contexts.length===0)return"No relevant fellowship discussions found to inform options.";let n=`Search Results for "${e.query}":

`;e.slack_contexts.length>0&&(n+=`=== SLACK DISCUSSIONS ===
`,e.slack_contexts.slice(0,10).forEach((r,c)=>{n+=`
[${c+1}] Channel: #${r.original_match.metadata.channel_name}
`,n+=`User: ${r.original_match.metadata.user_name}
`,n+=`Content: ${r.original_match.content}
`,r.thread_context&&r.thread_context.length>1&&(n+=`Thread context:
`,r.thread_context.slice(0,3).forEach(p=>{n+=`  - ${p.text}
`})),n+=`
`})),e.document_contexts.length>0&&(n+=`
=== DOCUMENT CONTENT ===
`,e.document_contexts.slice(0,10).forEach((r,c)=>{n+=`
[${c+1}] ${r.original_match.content}

`}));let{text:h}=await(0,y.generateText)({model:_("google/gemini-flash-1.5"),messages:[{role:"system",content:`You are summarizing fellowship discussions to inspire option generation for a project dimension.

CRITICAL INSTRUCTIONS:
1. Extract general themes, approaches, and patterns from the discussions - NOT specific project ideas
2. Focus on underlying principles, methodologies, and problem areas rather than concrete solutions
3. NEVER suggest or mention specific fellows' current project ideas or implementations
4. Identify gaps or unexplored conceptual areas that could spark new creative directions
5. Highlight general patterns that could be applied in novel ways

Your summary should provide broad inspiration for creative thinking while avoiding any specific project suggestions from current fellows.

Context: Fellowship participant working on ${t} - ${o}

Provide a concise summary (2-3 paragraphs) focusing on general principles and conceptual themes that will inspire original thinking, not specific implementations.`},{role:"user",content:n}]});return h}async function $(e,t,a,o,n,h,r,c){let p=[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${t}"

This represents their background interest - a starting point for exploration, not a constraint. Encourage creative thinking beyond their initial context.`},{role:"assistant",content:a},{role:"system",content:`The user was asked about their thoughts on the following project dimension: ${e}`},{role:"assistant",content:o},{role:"user",content:n}];if(h&&r)p.push({role:"system",content:`The user was previously shown these options: ${h.join(", ")} but they didn't like them because: ${r}. Please generate different options that address their concerns.`});else{let m={HAIR_ON_FIRE_PROBLEM:"Generate 2-4 specific urgent information problems only. Focus on the problems themselves, not solutions. Examples: 'election misinformation spread', 'crisis coordination breakdowns', 'scientific consensus confusion'.",EPISTEMIC_GOAL:"Generate 2-4 specific epistemic or reasoning improvements only. Focus on cognitive/reasoning abilities, not complete solutions. Examples: 'better source evaluation skills', 'improved bias recognition', 'enhanced collective sensemaking'.",TARGET_USER:"Generate 2-4 specific user types or stakeholder groups only. Focus on concrete people who might benefit from AI+epistemic tools, not project ideas. Examples: 'journalists verifying sources', 'policy analysts evaluating evidence', 'students learning critical thinking'.",TECHNICAL_SHAPE:"Generate 2-4 specific technical formats only. Focus on delivery mechanisms, not complete ideas. Examples: 'browser extension', 'mobile app', 'Slack bot', 'curriculum framework', 'open-source library'.",SIGNAL_GATHERING:"Generate 2-4 specific approaches for finding users and testing demand only. Focus on user research and validation methods, not full projects. Examples: 'user interviews via professional networks', 'landing page tests in relevant communities', 'prototype demos at industry conferences', 'surveys through academic partnerships'."}[e]||`Generate 2-4 concrete, specific options for the dimension ${e} that will help define a concrete fellowship project.`;c&&c.trim()&&(m+=`

Background context (use sparingly for inspiration): ${c}

CRITICAL: Prioritize creative, original thinking over this background context. Generate diverse options that may be completely unrelated to the context above.`),p.push({role:"system",content:m})}let{object:d}=await(0,y.generateObject)({model:_("openai/gpt-4o-mini"),messages:p,schema:f.z.object({options:f.z.array(f.z.string())})}),l=await(0,i.multiselect)({message:"Select all options that resonate with you (you can explore multiple directions):",options:[...d.options.map(s=>({value:s,label:s})),{value:"skip_dimension",label:"I don't want to talk about this yet"},{value:"different_options",label:"I don't like any of these options"}]});if(Array.isArray(l)&&l.includes("skip_dimension"))return{type:"change_dimension",explanation:"User chose to skip this dimension"};if(Array.isArray(l)&&l.includes("different_options"))return{type:"change_options",explanation:(await(0,i.text)({message:"What kind of options would you prefer to see instead?"})).toString(),previousOptions:d.options};if(!Array.isArray(l))throw new Error("Selected options is not an array");let w="";if(l.length>0){let s=await(0,i.text)({message:"\u{1F4AD} Add any nuances or clarifications about your selections (optional):",placeholder:"e.g., 'Option 1 is definitely key, but not where I see main impact...'",defaultValue:""});s&&s.toString().trim()&&(w=s.toString().trim())}return{type:"selected",selected_options:l,comment:w,shownOptions:d.options}}async function te(e,t,a){let o=[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${e}"

This represents their background interest - a starting point for exploration, not a constraint.`},{role:"assistant",content:t}];for(let[s,m]of Object.entries(a))m&&o.push({role:"system",content:`The user has expressed preferences for ${s}: ${m}`});let n="",h=(0,y.streamText)({model:_("openai/gpt-4o-mini"),messages:[...o,{role:"system",content:"Provide a warm recap of the user's exploration through the project dimensions. Summarize their choices in a conversational way that shows you understand their vision. Don't just repeat their exact words - synthesize and reflect back what you're hearing about their project direction. Keep it encouraging and insightful (2-3 paragraphs)."}],onFinish:s=>{n=s.text}});await i.stream.message(h.textStream),o.push({role:"assistant",content:n});let r="",c=(0,y.streamText)({model:_("openai/gpt-4o-mini"),messages:[...o,{role:"system",content:`Based on all their dimensional choices, formulate their "Working Hypothesis" in the format: "Building X for Y will have Z effect on A" where:
- X = the technical approach/solution
- Y = the target users
- Z = the epistemic/reasoning improvement effect
- A = the broader problem or context

Present this as: "\u{1F3AF} **Your Working Hypothesis:** [hypothesis statement]"

Then add 1-2 sentences explaining what assumption they're operating under and why this hypothesis is worth testing.`}],onFinish:s=>{r=s.text}});await i.stream.message(c.textStream),o.push({role:"assistant",content:r});let p=(0,i.spinner)();p.start("\u{1F680} Generating concrete examples from your working hypothesis...");let{object:d}=await(0,y.generateObject)({model:_("openai/gpt-4o-mini"),temperature:.8,messages:[...o,{role:"system",content:`Based on the user's preferences across all project dimensions, generate 2-10 specific, concrete project ideas for the AI+Epistemics fellowship. Each project should:

1. Design AI tools that enhance human reasoning and decision-making
2. Either raise the epistemic ceiling (deepen expert insight) or floor (help broader populations find clarity)
3. Address urgent global information/communication challenges OR support mediation/collective action
4. Be technically feasible for a 12-week fellowship (roadmapping \u2192 prototyping \u2192 evaluation)
5. Include a clear path to test demand and connect with target users

For each project, provide:
- A clear project name
- A concise description (2-3 sentences max)
- How it enhances human reasoning/decision-making
- Why it fills a strategic gap in beneficial AI tools`}],schema:f.z.object({projects:f.z.array(f.z.object({name:f.z.string(),description:f.z.string(),reasoning_enhancement:f.z.string(),strategic_gap:f.z.string()}))})});p.stop("\u2705 Project ideas ready!");let l=d.projects.map((s,m)=>({value:s.name,label:`${s.name}`,hint:s.description.split(".")[0]+"."})),w=await(0,i.multiselect)({message:"\u{1F3AF} Here are your personalized fellowship project ideas! Select any you'd like to explore further:",options:[...l,{value:"show_all_details",label:"\u{1F4CB} Show full details for all projects",hint:"See reasoning enhancement & strategic gap for each"}]});if(!Array.isArray(w))throw new Error("Selected projects is not an array");w.includes("show_all_details")||w.length===0?(i.log.message(`
\u{1F4CB} **Full project details:**
`),d.projects.forEach(s=>{i.log.success(`${s.name}`),i.log.message(`${s.description}
`),i.log.message(`\u{1F9E0} Reasoning Enhancement: ${s.reasoning_enhancement}
`),i.log.message(`\u{1F3AF} Strategic Gap: ${s.strategic_gap}
`)})):(i.log.message(`
\u{1F3AF} **Your selected project details:**
`),w.forEach(s=>{let m=d.projects.find(E=>E.name===s);m&&(i.log.success(`${m.name}`),i.log.message(`${m.description}
`),i.log.message(`\u{1F9E0} Reasoning Enhancement: ${m.reasoning_enhancement}
`),i.log.message(`\u{1F3AF} Strategic Gap: ${m.strategic_gap}
`))})),i.log.message("\u2728 **Next steps:** Start prototyping and testing your ideas with potential users!"),(0,i.outro)("Ready to build something impactful! \u{1F30D}\u{1F52C}"),process.exit(0)}require.main===module&&z();0&&(module.exports={presentOptions});
