#!/usr/bin/env node
"use strict";var G=Object.create;var k=Object.defineProperty;var L=Object.getOwnPropertyDescriptor;var D=Object.getOwnPropertyNames;var H=Object.getPrototypeOf,M=Object.prototype.hasOwnProperty;var U=(e,t)=>{for(var s in t)k(e,s,{get:t[s],enumerable:!0})},T=(e,t,s,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of D(t))!M.call(e,n)&&n!==s&&k(e,n,{get:()=>t[n],enumerable:!(o=L(t,n))||o.enumerable});return e};var x=(e,t,s)=>(s=e!=null?G(H(e)):{},T(t||!e||!e.__esModule?k(s,"default",{value:e,enumerable:!0}):s,e)),B=e=>T(k({},"__esModule",{value:!0}),e);var ae={};U(ae,{presentOptions:()=>F});module.exports=B(ae);var r=require("@clack/prompts"),j=require("@openrouter/ai-sdk-provider"),y=require("ai"),f=require("zod"),O=x(require("fs"),1),C=x(require("path"),1),P=x(require("dotenv"),1);var q="https://offers-and-asks-slack-nbgim.ondigitalocean.app/api/extended-search",W="6fd53d2d-cd2f-49a3-ad9b-f85c867bb955";async function R(e){try{let t=await fetch(q,{method:"POST",headers:{Authorization:`Bearer ${W}`,"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`HTTP error! status: ${t.status}, statusText: ${t.statusText}`);return await t.json()}catch(t){throw console.error("\u274C Error searching fellowship content:",t),t}}var I=x(require("fs"),1),v=x(require("path"),1);function Y(){let e=v.default.join(process.cwd(),"fellowship-logs");return I.default.existsSync(e)||I.default.mkdirSync(e,{recursive:!0}),e}function z(){return`fellowship-enrichment_${new Date().toISOString().replace(/[:.]/g,"-").replace("T","_").slice(0,-5)}.json`}async function A(e,t,s,o,n,m,a={}){try{let i=Y(),c=z(),p=v.default.join(i,c),l=n.slack_contexts?.slice(0,5).map(g=>({channel:g.original_match.metadata.channel_name,user:g.original_match.metadata.user_name,score:g.original_match.score,content_preview:g.original_match.content.substring(0,200),created_at:g.original_match.metadata.created_at}))||[],d=n.document_contexts?.slice(0,5).map(g=>({score:g.original_match.score,content_preview:g.original_match.content.substring(0,200)}))||[],_={timestamp:new Date().toISOString(),dimension:e,userContext:t,userResponse:s,searchTerm:o,searchResults:{total_results:n.total_results||0,slack_contexts_count:n.slack_contexts?.length||0,document_contexts_count:n.document_contexts?.length||0,top_slack_results:l,top_document_results:d},fellowshipSummary:m,metadata:a};I.default.writeFileSync(p,JSON.stringify(_,null,2),"utf-8")}catch(i){console.error("\u26A0\uFE0F  Warning: Could not log fellowship enrichment:",i)}}P.default.config({quiet:!0});var K=process.env.OPENROUTER_API_KEY||"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",E=(0,j.createOpenRouter)({apiKey:K}),b=0,w={HAIR_ON_FIRE_PROBLEM:"",EPISTEMIC_GOAL:"",TARGET_USER:"",TECHNICAL_SHAPE:"",SIGNAL_GATHERING:""},u=Object.keys(w);async function X(){let e=process.argv[2],t=e?await J(e):await Q(),s=await V(t),o=!0,n=!0;for(;u.filter(h=>!w[h]).length!==0;){n?(b=await te(t),n=!1):b=o?Z():ee();let a=u[b],i=await ne(a,t,s,w),c=(0,r.spinner)();c.start("\u{1F4AD} Thinking about options...");let p="",l="",d=null;try{l=await oe(a,t,i.response,w);let h=Date.now();d=await R({query:l,topK:15,includeThreads:!0,useAdvancedRetrieval:!0,enableContextExpansion:!0,enableRecencyBoost:!1,includeDocumentSummaries:!0,sources:["slack","document"],rerank:!0,semanticWeight:.7});let $=Date.now()-h;p=await ie(d,a,t,i.response);let N=Date.now()-h;await A(a,t,i.response,l,d,p,{search_duration_ms:$,summary_duration_ms:N}),c.stop()}catch{c.stop(),p="",l&&d&&await A(a,t,i.response,l,d,p)}let _=!1;o=!0;let g,S;for(;o&&!_;){let h=await F(a,t,s,i.question,i.response,g,S,p);h.type==="change_options"?(g=h.previousOptions||[],S=h.explanation,_=!1,o=!0):h.type==="change_dimension"?(_=!1,o=!1):h.type==="selected"&&(w[a]=h.selected_options.join(", "),g=h.shownOptions,_=!0,o=!0),h.type}}await se(t,s,w)}async function J(e){try{let t=C.default.resolve(e);return O.default.readFileSync(t,"utf-8").trim()}catch{process.exit(1)}}async function Q(){return(0,r.intro)("\u{1F3AF} Welcome to the AI+Epistemics Fellowship Project Picker!"),(await(0,r.text)({message:"What interests you most about using AI to improve human reasoning and tackle urgent global information problems?"})).toString()}async function V(e){let t="",s=(0,y.streamText)({model:E("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

You help participants through roadmapping, prototyping, and evaluation phases leading to a 12-week demo day.`},{role:"system",content:`Write a warm, brief greeting (about one paragraph) that acknowledges their interests and context. Simply welcome them to the process of exploring fellowship project ideas - don't suggest any specific project ideas yet or go into detail about what they'll discover. Keep it conversational and encouraging. Do not ask them any follow up questions.

        User context: ${e}`}],onFinish:o=>{t=o.text}});return await r.stream.message(s.textStream),t}function Z(){let e=b,t=0;do if(e=(e+1)%u.length,t++,t>=u.length)return b;while(w[u[e]]);return e}function ee(){let e=(b+Math.floor(u.length/2))%u.length,t=0;for(;w[u[e]]&&t<u.length;)e=(e+1)%u.length,t++;return t>=u.length?b:e}async function te(e){let{text:t}=await(0,y.generateText)({model:E("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are analyzing user context to determine which project dimension they seem most interested in discussing first. 

Available dimensions: 
- HAIR_ON_FIRE_PROBLEM (urgent global info/communication problem)
- EPISTEMIC_GOAL (what reasoning/epistemic improvement goal)
- TARGET_USER (who will use/benefit from the project)
- TECHNICAL_SHAPE (what form the project takes - app, org, etc.)
- SIGNAL_GATHERING (how to find target users and test interest/demand)

User context: "${e}"

Based on their context, which dimension seems most relevant to start with? If no dimension clearly relates to their context, choose HAIR_ON_FIRE_PROBLEM as a good starting point. 

Return only the dimension name exactly as it appears in the list (e.g., "TARGET_USER", "EPISTEMIC_GOAL", etc.).`}]}),s=t.trim().toUpperCase(),o=u.findIndex(n=>n===s);return o!==-1?o:u.findIndex(n=>n==="HAIR_ON_FIRE_PROBLEM")}async function ne(e,t,s,o){let n=Object.keys(o).filter(l=>o[l]!==""),m="";n.length>0&&(m=`The user has already expressed preferences for the following project dimensions:
${n.map(l=>`${l}
======
${o[l]}`).join(`

`)}`);let a={HAIR_ON_FIRE_PROBLEM:"the urgent 'world on fire' problem related to global information and communication that your project addresses",EPISTEMIC_GOAL:"what epistemic or human reasoning improvement your project aims to achieve",TARGET_USER:"who will use or benefit from your project (the specific people you want to help)",TECHNICAL_SHAPE:"what form your project will take (app, organization, manifesto, RFC, device, curriculum, etc.)",SIGNAL_GATHERING:"how you plan to find your target users and gather initial signal about interest or demand for your project"},i="",c=(0,y.streamText)({model:E("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${t}"

This represents their background interest - a starting point for exploration, not a constraint. Encourage creative thinking beyond their initial context.`},{role:"assistant",content:s},{role:"system",content:`${m?`

${m}

`:""}Ask the user an open-ended question that invites their thoughts on the following project dimension: ${a[e]||e}. 

Make the question specific to fellowship project planning and help them think concretely about this aspect of their potential project.`}],onFinish:l=>{i=l.text}});await r.stream.message(c.textStream);let p=await(0,r.text)({message:"Your thoughts:"});return{question:i,response:p.toString()}}async function oe(e,t,s,o){let n=Object.keys(o).filter(c=>o[c]!==""),m="";n.length>0&&(m=`Previous choices:
${n.map(c=>`${c}: ${o[c]}`).join(`
`)}`);let a={HAIR_ON_FIRE_PROBLEM:"urgent global information/communication problems to address",EPISTEMIC_GOAL:"what epistemic or reasoning improvement the project aims to achieve",TARGET_USER:"who will use or benefit from the project",TECHNICAL_SHAPE:"form the project will take (app, organization, tool, etc.)",SIGNAL_GATHERING:"methods to find users and test initial interest or demand"},{text:i}=await(0,y.generateText)({model:E("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are generating a search term to find fellowship discussions that will inspire options for the user's current thoughts.

CRITICAL: Base the search term primarily on what the user just said about ${e}, not their initial background context.

User's current response about ${e}: "${s}"

Generate a focused search term (2-6 words) that captures the key themes from their current response. The search should find supplementary information and examples that relate to what they just expressed, to inspire diverse options for this dimension.

Examples:
- If they mentioned "fun decision making" \u2192 search "collaborative decision enjoyment"
- If they mentioned "reducing bias" \u2192 search "bias recognition tools" 
- If they mentioned "crisis communication" \u2192 search "emergency information coordination"

Focus on the essence of what they just said, not their background interests.

Return only the search term, nothing else.`}]});return i.trim()}async function ie(e,t,s,o){if(!e.ok||e.slack_contexts.length===0&&e.document_contexts.length===0)return"No relevant fellowship discussions found to inform options.";let n=`Search Results for "${e.query}":

`;e.slack_contexts.length>0&&(n+=`=== SLACK DISCUSSIONS ===
`,e.slack_contexts.slice(0,10).forEach((a,i)=>{n+=`
[${i+1}] Channel: #${a.original_match.metadata.channel_name}
`,n+=`User: ${a.original_match.metadata.user_name}
`,n+=`Content: ${a.original_match.content}
`,a.thread_context&&a.thread_context.length>1&&(n+=`Thread context:
`,a.thread_context.slice(0,3).forEach(c=>{n+=`  - ${c.text}
`})),n+=`
`})),e.document_contexts.length>0&&(n+=`
=== DOCUMENT CONTENT ===
`,e.document_contexts.slice(0,10).forEach((a,i)=>{n+=`
[${i+1}] ${a.original_match.content}

`}));let{text:m}=await(0,y.generateText)({model:E("google/gemini-flash-1.5"),messages:[{role:"system",content:`You are summarizing fellowship discussions to inspire option generation for a project dimension.

CRITICAL INSTRUCTIONS:
1. Extract general themes, approaches, and patterns from the discussions - NOT specific project ideas
2. Focus on underlying principles, methodologies, and problem areas rather than concrete solutions
3. NEVER suggest or mention specific fellows' current project ideas or implementations
4. Identify gaps or unexplored conceptual areas that could spark new creative directions
5. Highlight general patterns that could be applied in novel ways

Your summary should provide broad inspiration for creative thinking while avoiding any specific project suggestions from current fellows.

Context: Fellowship participant working on ${t} - ${o}

Provide a concise summary (2-3 paragraphs) focusing on general principles and conceptual themes that will inspire original thinking, not specific implementations.`},{role:"user",content:n}]});return m}async function F(e,t,s,o,n,m,a,i){let c=[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${t}"

This represents their background interest - a starting point for exploration, not a constraint. Encourage creative thinking beyond their initial context.`},{role:"assistant",content:s},{role:"system",content:`The user was asked about their thoughts on the following project dimension: ${e}`},{role:"assistant",content:o},{role:"user",content:n}];if(m&&a)c.push({role:"system",content:`The user was previously shown these options: ${m.join(", ")} but they didn't like them because: ${a}. Please generate different options that address their concerns.`});else{let _={HAIR_ON_FIRE_PROBLEM:"Generate 2-4 specific urgent information problems only. Focus on the problems themselves, not solutions. Examples: 'election misinformation spread', 'crisis coordination breakdowns', 'scientific consensus confusion'.",EPISTEMIC_GOAL:"Generate 2-4 specific epistemic or reasoning improvements only. Focus on cognitive/reasoning abilities, not complete solutions. Examples: 'better source evaluation skills', 'improved bias recognition', 'enhanced collective sensemaking'.",TARGET_USER:"Generate 2-4 specific user types or stakeholder groups only. Focus on concrete people who might benefit from AI+epistemic tools, not project ideas. Examples: 'journalists verifying sources', 'policy analysts evaluating evidence', 'students learning critical thinking'.",TECHNICAL_SHAPE:"Generate 2-4 specific technical formats only. Focus on delivery mechanisms, not complete ideas. Examples: 'browser extension', 'mobile app', 'Slack bot', 'curriculum framework', 'open-source library'.",SIGNAL_GATHERING:"Generate 2-4 specific approaches for finding users and testing demand only. Focus on user research and validation methods, not full projects. Examples: 'user interviews via professional networks', 'landing page tests in relevant communities', 'prototype demos at industry conferences', 'surveys through academic partnerships'."}[e]||`Generate 2-4 concrete, specific options for the dimension ${e} that will help define a concrete fellowship project.`;i&&i.trim()&&(_+=`

Background context (use sparingly for inspiration): ${i}

CRITICAL: Prioritize creative, original thinking over this background context. Generate diverse options that may be completely unrelated to the context above.`),c.push({role:"system",content:_})}let{object:p}=await(0,y.generateObject)({model:E("openai/gpt-4o-mini"),messages:c,schema:f.z.object({options:f.z.array(f.z.string())})}),l=await(0,r.select)({message:"Select the option that resonates most with you:",options:[...p.options.map(d=>({value:d,label:d})),{value:"skip_dimension",label:"I don't want to talk about this yet"},{value:"different_options",label:"I don't like any of these options"}]});return l==="skip_dimension"?{type:"change_dimension",explanation:"User chose to skip this dimension"}:l==="different_options"?{type:"change_options",explanation:(await(0,r.text)({message:"What kind of options would you prefer to see instead?"})).toString(),previousOptions:p.options}:{type:"selected",selected_options:[l],shownOptions:p.options}}async function se(e,t,s){let o=[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${e}"

This represents their background interest - a starting point for exploration, not a constraint. Generate diverse, creative project ideas that may go well beyond their initial context.`},{role:"assistant",content:t}];for(let[i,c]of Object.entries(s))c&&o.push({role:"system",content:`The user has expressed preferences for ${i}: ${c}`});let n=(0,r.spinner)();n.start("\u{1F680} Generating your personalized fellowship project ideas...");let{object:m}=await(0,y.generateObject)({model:E("openai/gpt-4o-mini"),temperature:.8,messages:[...o,{role:"system",content:`Based on the user's preferences across all project dimensions, generate 2-10 specific, concrete project ideas for the AI+Epistemics fellowship. Each project should:

1. Design AI tools that enhance human reasoning and decision-making
2. Either raise the epistemic ceiling (deepen expert insight) or floor (help broader populations find clarity)
3. Address urgent global information/communication challenges OR support mediation/collective action
4. Be technically feasible for a 12-week fellowship (roadmapping \u2192 prototyping \u2192 evaluation)
5. Include a clear path to test demand and connect with target users

For each project, provide:
- A clear project name
- A concise description (2-3 sentences max)
- How it enhances human reasoning/decision-making
- Why it fills a strategic gap in beneficial AI tools`}],schema:f.z.object({projects:f.z.array(f.z.object({name:f.z.string(),description:f.z.string(),reasoning_enhancement:f.z.string(),strategic_gap:f.z.string()}))})});n.stop("\u2705 Project ideas ready!");let a=await(0,r.multiselect)({message:"\u{1F3AF} Here are your concrete fellowship project ideas! Select the ones you'd like to explore further:",options:m.projects.map(i=>({value:i.name,label:`${i.name} - ${i.description}`}))});if(!Array.isArray(a))throw new Error("Selected projects is not an array");r.log.message(`
\u{1F680} Excellent choices! Here are your selected project ideas:`),a.forEach((i,c)=>{let p=m.projects.find(l=>l.name===i);p&&(r.log.message(`
${c+1}. ${p.name}`),r.log.message(`   ${p.description}`),r.log.message(`   \u{1F9E0} Reasoning Enhancement: ${p.reasoning_enhancement}`),r.log.message(`   \u{1F3AF} Strategic Gap: ${p.strategic_gap}`))}),r.log.message(`
\u2728 Next steps: Take these concrete project ideas to your fellowship mentors and start prototyping!`),r.log.message(`
\u{1F4A1} Pro tip: Start with the 'signal gathering' approach you identified to test real demand before building.`),(0,r.outro)("Ready to tackle some world-on-fire problems! \u{1F30D}\u{1F525}"),process.exit(0)}require.main===module&&X();0&&(module.exports={presentOptions});
