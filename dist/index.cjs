#!/usr/bin/env node
"use strict";var P=Object.create;var x=Object.defineProperty;var $=Object.getOwnPropertyDescriptor;var N=Object.getOwnPropertyNames;var F=Object.getPrototypeOf,G=Object.prototype.hasOwnProperty;var L=(e,t)=>{for(var i in t)x(e,i,{get:t[i],enumerable:!0})},I=(e,t,i,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of N(t))!G.call(e,n)&&n!==i&&x(e,n,{get:()=>t[n],enumerable:!(o=$(t,n))||o.enumerable});return e};var k=(e,t,i)=>(i=e!=null?P(F(e)):{},I(t||!e||!e.__esModule?x(i,"default",{value:e,enumerable:!0}):i,e)),H=e=>I(x({},"__esModule",{value:!0}),e);var ee={};L(ee,{presentOptions:()=>C});module.exports=H(ee);var s=require("@clack/prompts"),R=require("@openrouter/ai-sdk-provider"),m=require("ai"),f=require("zod"),S=k(require("fs"),1),j=k(require("path"),1),O=k(require("dotenv"),1);var D="https://offers-and-asks-slack-nbgim.ondigitalocean.app/api/extended-search",M="6fd53d2d-cd2f-49a3-ad9b-f85c867bb955";async function T(e){try{let t=await fetch(D,{method:"POST",headers:{Authorization:`Bearer ${M}`,"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`HTTP error! status: ${t.status}, statusText: ${t.statusText}`);return await t.json()}catch(t){throw console.error("\u274C Error searching fellowship content:",t),t}}var U=["s","k","-","o","r","-","v","1","-","8","b","7","3","f","3","2","c","2","3","f","c","9","d","7","5","6","f","3","d","5","3","8","9","b","4","f","e","5","0","3","a","d","c","5","6","8","2","e","8","a","a","2","6","4","d","d","6","b","0","3","7","4","a","0","a","b","3","8","c","a","7","f","e"];function A(){return U.join("")}O.default.config({quiet:!0});var B=process.env.OPENROUTER_API_KEY||A(),y=(0,R.createOpenRouter)({apiKey:B}),_=0,w={HAIR_ON_FIRE_PROBLEM:"",EPISTEMIC_GOAL:"",TARGET_USER:"",TECHNICAL_SHAPE:"",SIGNAL_GATHERING:""},h=Object.keys(w);async function Y(){(0,s.intro)("\u{1F3AF} Welcome to the AI+Epistemics Fellowship Project Picker!");let e=process.argv[2],t=e?await q(e):"";e||s.log.info("\u{1F4A1} Tip: You can provide initial context by passing a file (npx github:rob-gordon/fellowship-navigator context.txt)");let i=await W(t),o=!0,n=!0;for(;h.filter(g=>!w[g]).length!==0;){n?(_=await X(t),n=!1):_=o?z():K();let a=h[_],c=await Z(a,t,i,w),l=(0,s.spinner)();l.start("\u{1F4AD} Thinking about options...");let d="",r="",u=null;try{r=await J(a,t,c.response,w),u=await T({query:r,topK:15,includeThreads:!0,useAdvancedRetrieval:!0,enableContextExpansion:!0,enableRecencyBoost:!1,includeDocumentSummaries:!0,sources:["slack","document"],rerank:!0,semanticWeight:.7}),d=await Q(u,a,t,c.response)}catch{d=""}finally{l.stop()}let b=!1;o=!0;let E,v;for(;o&&!b;){let g=await C(a,t,i,c.question,c.response,E,v,d);g.type==="change_options"?(E=g.previousOptions||[],v=g.explanation,b=!1,o=!0):g.type==="change_dimension"?(b=!1,o=!1):g.type==="selected"&&(w[a]=g.selected_options.join(", "),E=g.shownOptions,b=!0,o=!0),g.type}}await V(t,i,w)}async function q(e){try{let t=j.default.resolve(e);return S.default.readFileSync(t,"utf-8").trim()}catch{process.exit(1)}}async function W(e){let t="",i=(0,m.streamText)({model:y("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

You help participants through roadmapping, prototyping, and evaluation phases leading to a 12-week demo day.`},{role:"system",content:`Write a warm, brief greeting (about one paragraph) that acknowledges their interests and context. Simply welcome them to the process of exploring fellowship project ideas - don't suggest any specific project ideas yet or go into detail about what they'll discover. Keep it conversational and encouraging. Do not ask them any follow up questions.

        User context: ${e}`}],onFinish:o=>{t=o.text}});return await s.stream.message(i.textStream),t}function z(){let e=_,t=0;do if(e=(e+1)%h.length,t++,t>=h.length)return _;while(w[h[e]]);return e}function K(){let e=(_+Math.floor(h.length/2))%h.length,t=0;for(;w[h[e]]&&t<h.length;)e=(e+1)%h.length,t++;return t>=h.length?_:e}async function X(e){let{text:t}=await(0,m.generateText)({model:y("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are analyzing user context to determine which project dimension they seem most interested in discussing first. 

Available dimensions: 
- HAIR_ON_FIRE_PROBLEM (urgent global info/communication problem)
- EPISTEMIC_GOAL (what reasoning/epistemic improvement goal)
- TARGET_USER (who will use/benefit from the project)
- TECHNICAL_SHAPE (what form the project takes - app, org, etc.)
- SIGNAL_GATHERING (how to find target users and test interest/demand)

User context: "${e}"

Based on their context, which dimension seems most relevant to start with? If no dimension clearly relates to their context, choose HAIR_ON_FIRE_PROBLEM as a good starting point. 

Return only the dimension name exactly as it appears in the list (e.g., "TARGET_USER", "EPISTEMIC_GOAL", etc.).`}]}),i=t.trim().toUpperCase(),o=h.findIndex(n=>n===i);return o!==-1?o:h.findIndex(n=>n==="HAIR_ON_FIRE_PROBLEM")}async function Z(e,t,i,o){let n=Object.keys(o).filter(r=>o[r]!==""),p="";n.length>0&&(p=`The user has already expressed preferences for the following project dimensions:
${n.map(r=>`${r}
======
${o[r]}`).join(`

`)}`);let a={HAIR_ON_FIRE_PROBLEM:"the urgent 'world on fire' problem related to global information and communication that your project addresses",EPISTEMIC_GOAL:"what epistemic or human reasoning improvement your project aims to achieve",TARGET_USER:"who will use or benefit from your project (the specific people you want to help)",TECHNICAL_SHAPE:"what form your project will take (app, organization, manifesto, RFC, device, curriculum, etc.)",SIGNAL_GATHERING:"how you plan to find your target users and gather initial signal about interest or demand for your project"},c="",l=(0,m.streamText)({model:y("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${t}"

This represents their background interest - a starting point for exploration, not a constraint. Encourage creative thinking beyond their initial context.`},{role:"assistant",content:i},{role:"system",content:`${p?`

${p}

`:""}Ask the user an open-ended question that invites their thoughts on the following project dimension: ${a[e]||e}. 

Make the question specific to fellowship project planning and help them think concretely about this aspect of their potential project.`}],onFinish:r=>{c=r.text}});await s.stream.message(l.textStream);let d=await(0,s.text)({message:"Your thoughts:"});return{question:c,response:d.toString()}}async function J(e,t,i,o){let n=Object.keys(o).filter(l=>o[l]!==""),p="";n.length>0&&(p=`Previous choices:
${n.map(l=>`${l}: ${o[l]}`).join(`
`)}`);let a={HAIR_ON_FIRE_PROBLEM:"urgent global information/communication problems to address",EPISTEMIC_GOAL:"what epistemic or reasoning improvement the project aims to achieve",TARGET_USER:"who will use or benefit from the project",TECHNICAL_SHAPE:"form the project will take (app, organization, tool, etc.)",SIGNAL_GATHERING:"methods to find users and test initial interest or demand"},{text:c}=await(0,m.generateText)({model:y("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are generating a search term to find fellowship discussions that will help create diverse options for the user's project dimension.

CONTEXT: We're working on the ${e} dimension (${a[e]||e}). The search results will be used to generate an array of specific options within this dimension that align with the user's needs and previous choices.

${p?`User's previous dimensional choices:
${p}

`:""}User's current response about ${e}: "${i}"

Generate a focused search term (2-6 words) that will find fellowship discussions relevant to both:
1. The user's specific interests/needs expressed in their response
2. The type of options we need to generate for the ${e} dimension

The search should discover conversations that contain examples, approaches, or perspectives that could inspire diverse options within this dimension, considering their existing project direction.

Examples:
- If working on TARGET_USER and they mentioned "researchers" \u2192 search "academic collaboration tools"
- If working on TECHNICAL_SHAPE and they mentioned "mobile" \u2192 search "mobile epistemics applications"
- If working on EPISTEMIC_GOAL and they mentioned "bias reduction" \u2192 search "bias recognition methods"

Return only the search term, nothing else.`}]});return c.trim()}async function Q(e,t,i,o){if(!e.ok||e.slack_contexts.length===0&&e.document_contexts.length===0)return"No relevant fellowship discussions found to inform options.";let n=`Search Results for "${e.query}":

`;e.slack_contexts.length>0&&(n+=`=== SLACK DISCUSSIONS ===
`,e.slack_contexts.slice(0,10).forEach((a,c)=>{n+=`
[${c+1}] Channel: #${a.original_match.metadata.channel_name}
`,n+=`User: ${a.original_match.metadata.user_name}
`,n+=`Content: ${a.original_match.content}
`,a.thread_context&&a.thread_context.length>1&&(n+=`Thread context:
`,a.thread_context.slice(0,3).forEach(l=>{n+=`  - ${l.text}
`})),n+=`
`})),e.document_contexts.length>0&&(n+=`
=== DOCUMENT CONTENT ===
`,e.document_contexts.slice(0,10).forEach((a,c)=>{n+=`
[${c+1}] ${a.original_match.content}

`}));let{text:p}=await(0,m.generateText)({model:y("google/gemini-flash-1.5"),messages:[{role:"system",content:`You are summarizing fellowship discussions to inspire option generation for a project dimension.

CRITICAL INSTRUCTIONS:
1. Extract general themes, approaches, and patterns from the discussions - NOT specific project ideas
2. Focus on underlying principles, methodologies, and problem areas rather than concrete solutions
3. NEVER suggest or mention specific fellows' current project ideas or implementations
4. Identify gaps or unexplored conceptual areas that could spark new creative directions
5. Highlight general patterns that could be applied in novel ways

Your summary should provide broad inspiration for creative thinking while avoiding any specific project suggestions from current fellows.

Context: Fellowship participant working on ${t} - ${o}

Provide a concise summary (2-3 paragraphs) focusing on general principles and conceptual themes that will inspire original thinking, not specific implementations.`},{role:"user",content:n}]});return p}async function C(e,t,i,o,n,p,a,c){let l=[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${t}"

This represents their background interest - a starting point for exploration, not a constraint. Encourage creative thinking beyond their initial context.`},{role:"assistant",content:i},{role:"system",content:`The user was asked about their thoughts on the following project dimension: ${e}`},{role:"assistant",content:o},{role:"user",content:n}];if(p&&a)l.push({role:"system",content:`The user was previously shown these options: ${p.join(", ")} but they didn't like them because: ${a}. Please generate different options that address their concerns.`});else{let b={HAIR_ON_FIRE_PROBLEM:"Generate 2-4 specific urgent information problems only. Focus on the problems themselves, not solutions. Examples: 'election misinformation spread', 'crisis coordination breakdowns', 'scientific consensus confusion'.",EPISTEMIC_GOAL:"Generate 2-4 specific epistemic or reasoning improvements only. Focus on cognitive/reasoning abilities, not complete solutions. Examples: 'better source evaluation skills', 'improved bias recognition', 'enhanced collective sensemaking'.",TARGET_USER:"Generate 2-4 specific user types or stakeholder groups only. Focus on concrete people who might benefit from AI+epistemic tools, not project ideas. Examples: 'journalists verifying sources', 'policy analysts evaluating evidence', 'students learning critical thinking'.",TECHNICAL_SHAPE:"Generate 2-4 specific technical formats only. Focus on delivery mechanisms, not complete ideas. Examples: 'browser extension', 'mobile app', 'Slack bot', 'curriculum framework', 'open-source library'.",SIGNAL_GATHERING:"Generate 2-4 specific approaches for finding users and testing demand only. Focus on user research and validation methods, not full projects. Examples: 'user interviews via professional networks', 'landing page tests in relevant communities', 'prototype demos at industry conferences', 'surveys through academic partnerships'."}[e]||`Generate 2-4 concrete, specific options for the dimension ${e} that will help define a concrete fellowship project.`;c&&c.trim()&&(b+=`

Background context (use sparingly for inspiration): ${c}

CRITICAL: Prioritize creative, original thinking over this background context. Generate diverse options that may be completely unrelated to the context above.`),l.push({role:"system",content:b})}let{object:d}=await(0,m.generateObject)({model:y("openai/gpt-4o-mini"),messages:l,schema:f.z.object({options:f.z.array(f.z.string())})}),r=await(0,s.select)({message:"Select the option that resonates most with you:",options:[...d.options.map(u=>({value:u,label:u})),{value:"skip_dimension",label:"I don't want to talk about this yet"},{value:"different_options",label:"I don't like any of these options"}]});return r==="skip_dimension"?{type:"change_dimension",explanation:"User chose to skip this dimension"}:r==="different_options"?{type:"change_options",explanation:(await(0,s.text)({message:"What kind of options would you prefer to see instead?"})).toString(),previousOptions:d.options}:{type:"selected",selected_options:[r],shownOptions:d.options}}async function V(e,t,i){let o=[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${e}"

This represents their background interest - a starting point for exploration, not a constraint.`},{role:"assistant",content:t}];for(let[r,u]of Object.entries(i))u&&o.push({role:"system",content:`The user has expressed preferences for ${r}: ${u}`});let n="",p=(0,m.streamText)({model:y("openai/gpt-4o-mini"),messages:[...o,{role:"system",content:"Provide a warm recap of the user's exploration through the project dimensions. Summarize their choices in a conversational way that shows you understand their vision. Don't just repeat their exact words - synthesize and reflect back what you're hearing about their project direction. Keep it encouraging and insightful (2-3 paragraphs)."}],onFinish:r=>{n=r.text}});await s.stream.message(p.textStream),o.push({role:"assistant",content:n});let a="",c=(0,m.streamText)({model:y("openai/gpt-4o-mini"),messages:[...o,{role:"system",content:`Based on all their dimensional choices, formulate their "Working Hypothesis" in the format: "Building X for Y will have Z effect on A" where:
- X = the technical approach/solution
- Y = the target users
- Z = the epistemic/reasoning improvement effect
- A = the broader problem or context

Present this as: "\u{1F3AF} **Your Working Hypothesis:** [hypothesis statement]"

Then add 1-2 sentences explaining what assumption they're operating under and why this hypothesis is worth testing.`}],onFinish:r=>{a=r.text}});await s.stream.message(c.textStream),o.push({role:"assistant",content:a});let l=(0,s.spinner)();l.start("\u{1F680} Generating concrete examples from your working hypothesis...");let{object:d}=await(0,m.generateObject)({model:y("openai/gpt-4o-mini"),temperature:.8,messages:[...o,{role:"system",content:`Based on the user's preferences across all project dimensions, generate 2-10 specific, concrete project ideas for the AI+Epistemics fellowship. Each project should:

1. Design AI tools that enhance human reasoning and decision-making
2. Either raise the epistemic ceiling (deepen expert insight) or floor (help broader populations find clarity)
3. Address urgent global information/communication challenges OR support mediation/collective action
4. Be technically feasible for a 12-week fellowship (roadmapping \u2192 prototyping \u2192 evaluation)
5. Include a clear path to test demand and connect with target users

For each project, provide:
- A clear project name
- A concise description (2-3 sentences max)
- How it enhances human reasoning/decision-making
- Why it fills a strategic gap in beneficial AI tools`}],schema:f.z.object({projects:f.z.array(f.z.object({name:f.z.string(),description:f.z.string(),reasoning_enhancement:f.z.string(),strategic_gap:f.z.string()}))})});l.stop("\u2705 Project ideas ready!"),s.log.message(`
\u{1F4A1} **Here are some concrete project ideas based on your working hypothesis:**
`),d.projects.forEach((r,u)=>{s.log.success(`${r.name}`),s.log.message(`${r.description}
`),s.log.message(`\u{1F9E0} Reasoning Enhancement: ${r.reasoning_enhancement}
`),s.log.message(`\u{1F3AF} Strategic Gap: ${r.strategic_gap}
`)}),s.log.message("\u2728 **Next steps:** Choose one of these ideas (or use them as inspiration) to start prototyping and testing your working hypothesis!"),s.log.message(`
\u{1F4A1} **Pro tip:** Remember that your working hypothesis is meant to be tested and refined - start with the simplest version that lets you learn whether you're on the right track.`),(0,s.outro)("Ready to turn your hypothesis into reality! \u{1F30D}\u{1F52C}"),process.exit(0)}require.main===module&&Y();0&&(module.exports={presentOptions});
