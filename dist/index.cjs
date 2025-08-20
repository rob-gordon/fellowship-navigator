#!/usr/bin/env node
"use strict";var G=Object.create;var k=Object.defineProperty;var L=Object.getOwnPropertyDescriptor;var D=Object.getOwnPropertyNames;var H=Object.getPrototypeOf,M=Object.prototype.hasOwnProperty;var U=(e,t)=>{for(var i in t)k(e,i,{get:t[i],enumerable:!0})},S=(e,t,i,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of D(t))!M.call(e,n)&&n!==i&&k(e,n,{get:()=>t[n],enumerable:!(o=L(t,n))||o.enumerable});return e};var E=(e,t,i)=>(i=e!=null?G(H(e)):{},S(t||!e||!e.__esModule?k(i,"default",{value:e,enumerable:!0}):i,e)),B=e=>S(k({},"__esModule",{value:!0}),e);var se={};U(se,{presentOptions:()=>F});module.exports=B(se);var r=require("@clack/prompts"),j=require("@openrouter/ai-sdk-provider"),f=require("ai"),y=require("zod"),O=E(require("fs"),1),C=E(require("path"),1),P=E(require("dotenv"),1);var Y="https://offers-and-asks-slack-nbgim.ondigitalocean.app/api/extended-search",q="6fd53d2d-cd2f-49a3-ad9b-f85c867bb955";async function R(e){try{let t=await fetch(Y,{method:"POST",headers:{Authorization:`Bearer ${q}`,"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`HTTP error! status: ${t.status}, statusText: ${t.statusText}`);return await t.json()}catch(t){throw console.error("\u274C Error searching fellowship content:",t),t}}var v=E(require("fs"),1),I=E(require("path"),1);function W(){let e=I.default.join(process.cwd(),"fellowship-logs");return v.default.existsSync(e)||v.default.mkdirSync(e,{recursive:!0}),e}function z(){return`fellowship-enrichment_${new Date().toISOString().replace(/[:.]/g,"-").replace("T","_").slice(0,-5)}.json`}async function A(e,t,i,o,n,m,a={}){try{let c=W(),l=z(),h=I.default.join(c,l),s=n.slack_contexts?.slice(0,5).map(d=>({channel:d.original_match.metadata.channel_name,user:d.original_match.metadata.user_name,score:d.original_match.score,content_preview:d.original_match.content.substring(0,200),created_at:d.original_match.metadata.created_at}))||[],p=n.document_contexts?.slice(0,5).map(d=>({score:d.original_match.score,content_preview:d.original_match.content.substring(0,200)}))||[],_={timestamp:new Date().toISOString(),dimension:e,userContext:t,userResponse:i,searchTerm:o,searchResults:{total_results:n.total_results||0,slack_contexts_count:n.slack_contexts?.length||0,document_contexts_count:n.document_contexts?.length||0,top_slack_results:s,top_document_results:p},fellowshipSummary:m,metadata:a};v.default.writeFileSync(h,JSON.stringify(_,null,2),"utf-8")}catch(c){console.error("\u26A0\uFE0F  Warning: Could not log fellowship enrichment:",c)}}P.default.config({quiet:!0});var K=process.env.OPENROUTER_API_KEY||"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",w=(0,j.createOpenRouter)({apiKey:K}),x=0,b={HAIR_ON_FIRE_PROBLEM:"",EPISTEMIC_GOAL:"",TARGET_USER:"",TECHNICAL_SHAPE:"",SIGNAL_GATHERING:""},g=Object.keys(b);async function X(){(0,r.intro)("\u{1F3AF} Welcome to the AI+Epistemics Fellowship Project Picker!");let e=process.argv[2],t=e?await J(e):"";e||r.log.info("\u{1F4A1} Tip: You can provide initial context by passing a file (npx github:rob-gordon/fellowship-navigator context.txt)");let i=await Z(t),o=!0,n=!0;for(;g.filter(u=>!b[u]).length!==0;){n?(x=await ee(t),n=!1):x=o?Q():V();let a=g[x],c=await te(a,t,i,b),l=(0,r.spinner)();l.start("\u{1F4AD} Thinking about options...");let h="",s="",p=null;try{s=await ne(a,t,c.response,b);let u=Date.now();p=await R({query:s,topK:15,includeThreads:!0,useAdvancedRetrieval:!0,enableContextExpansion:!0,enableRecencyBoost:!1,includeDocumentSummaries:!0,sources:["slack","document"],rerank:!0,semanticWeight:.7});let N=Date.now()-u;h=await oe(p,a,t,c.response);let $=Date.now()-u;await A(a,t,c.response,s,p,h,{search_duration_ms:N,summary_duration_ms:$}),l.stop()}catch{l.stop(),h="",s&&p&&await A(a,t,c.response,s,p,h)}let _=!1;o=!0;let d,T;for(;o&&!_;){let u=await F(a,t,i,c.question,c.response,d,T,h);u.type==="change_options"?(d=u.previousOptions||[],T=u.explanation,_=!1,o=!0):u.type==="change_dimension"?(_=!1,o=!1):u.type==="selected"&&(b[a]=u.selected_options.join(", "),d=u.shownOptions,_=!0,o=!0),u.type}}await ie(t,i,b)}async function J(e){try{let t=C.default.resolve(e);return O.default.readFileSync(t,"utf-8").trim()}catch{process.exit(1)}}async function Z(e){let t="",i=(0,f.streamText)({model:w("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

You help participants through roadmapping, prototyping, and evaluation phases leading to a 12-week demo day.`},{role:"system",content:`Write a warm, brief greeting (about one paragraph) that acknowledges their interests and context. Simply welcome them to the process of exploring fellowship project ideas - don't suggest any specific project ideas yet or go into detail about what they'll discover. Keep it conversational and encouraging. Do not ask them any follow up questions.

        User context: ${e}`}],onFinish:o=>{t=o.text}});return await r.stream.message(i.textStream),t}function Q(){let e=x,t=0;do if(e=(e+1)%g.length,t++,t>=g.length)return x;while(b[g[e]]);return e}function V(){let e=(x+Math.floor(g.length/2))%g.length,t=0;for(;b[g[e]]&&t<g.length;)e=(e+1)%g.length,t++;return t>=g.length?x:e}async function ee(e){let{text:t}=await(0,f.generateText)({model:w("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are analyzing user context to determine which project dimension they seem most interested in discussing first. 

Available dimensions: 
- HAIR_ON_FIRE_PROBLEM (urgent global info/communication problem)
- EPISTEMIC_GOAL (what reasoning/epistemic improvement goal)
- TARGET_USER (who will use/benefit from the project)
- TECHNICAL_SHAPE (what form the project takes - app, org, etc.)
- SIGNAL_GATHERING (how to find target users and test interest/demand)

User context: "${e}"

Based on their context, which dimension seems most relevant to start with? If no dimension clearly relates to their context, choose HAIR_ON_FIRE_PROBLEM as a good starting point. 

Return only the dimension name exactly as it appears in the list (e.g., "TARGET_USER", "EPISTEMIC_GOAL", etc.).`}]}),i=t.trim().toUpperCase(),o=g.findIndex(n=>n===i);return o!==-1?o:g.findIndex(n=>n==="HAIR_ON_FIRE_PROBLEM")}async function te(e,t,i,o){let n=Object.keys(o).filter(s=>o[s]!==""),m="";n.length>0&&(m=`The user has already expressed preferences for the following project dimensions:
${n.map(s=>`${s}
======
${o[s]}`).join(`

`)}`);let a={HAIR_ON_FIRE_PROBLEM:"the urgent 'world on fire' problem related to global information and communication that your project addresses",EPISTEMIC_GOAL:"what epistemic or human reasoning improvement your project aims to achieve",TARGET_USER:"who will use or benefit from your project (the specific people you want to help)",TECHNICAL_SHAPE:"what form your project will take (app, organization, manifesto, RFC, device, curriculum, etc.)",SIGNAL_GATHERING:"how you plan to find your target users and gather initial signal about interest or demand for your project"},c="",l=(0,f.streamText)({model:w("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${t}"

This represents their background interest - a starting point for exploration, not a constraint. Encourage creative thinking beyond their initial context.`},{role:"assistant",content:i},{role:"system",content:`${m?`

${m}

`:""}Ask the user an open-ended question that invites their thoughts on the following project dimension: ${a[e]||e}. 

Make the question specific to fellowship project planning and help them think concretely about this aspect of their potential project.`}],onFinish:s=>{c=s.text}});await r.stream.message(l.textStream);let h=await(0,r.text)({message:"Your thoughts:"});return{question:c,response:h.toString()}}async function ne(e,t,i,o){let n=Object.keys(o).filter(l=>o[l]!==""),m="";n.length>0&&(m=`Previous choices:
${n.map(l=>`${l}: ${o[l]}`).join(`
`)}`);let a={HAIR_ON_FIRE_PROBLEM:"urgent global information/communication problems to address",EPISTEMIC_GOAL:"what epistemic or reasoning improvement the project aims to achieve",TARGET_USER:"who will use or benefit from the project",TECHNICAL_SHAPE:"form the project will take (app, organization, tool, etc.)",SIGNAL_GATHERING:"methods to find users and test initial interest or demand"},{text:c}=await(0,f.generateText)({model:w("openai/gpt-4o-mini"),messages:[{role:"system",content:`You are generating a search term to find fellowship discussions that will inspire options for the user's current thoughts.

CRITICAL: Base the search term primarily on what the user just said about ${e}, not their initial background context.

User's current response about ${e}: "${i}"

Generate a focused search term (2-6 words) that captures the key themes from their current response. The search should find supplementary information and examples that relate to what they just expressed, to inspire diverse options for this dimension.

Examples:
- If they mentioned "fun decision making" \u2192 search "collaborative decision enjoyment"
- If they mentioned "reducing bias" \u2192 search "bias recognition tools" 
- If they mentioned "crisis communication" \u2192 search "emergency information coordination"

Focus on the essence of what they just said, not their background interests.

Return only the search term, nothing else.`}]});return c.trim()}async function oe(e,t,i,o){if(!e.ok||e.slack_contexts.length===0&&e.document_contexts.length===0)return"No relevant fellowship discussions found to inform options.";let n=`Search Results for "${e.query}":

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

`}));let{text:m}=await(0,f.generateText)({model:w("google/gemini-flash-1.5"),messages:[{role:"system",content:`You are summarizing fellowship discussions to inspire option generation for a project dimension.

CRITICAL INSTRUCTIONS:
1. Extract general themes, approaches, and patterns from the discussions - NOT specific project ideas
2. Focus on underlying principles, methodologies, and problem areas rather than concrete solutions
3. NEVER suggest or mention specific fellows' current project ideas or implementations
4. Identify gaps or unexplored conceptual areas that could spark new creative directions
5. Highlight general patterns that could be applied in novel ways

Your summary should provide broad inspiration for creative thinking while avoiding any specific project suggestions from current fellows.

Context: Fellowship participant working on ${t} - ${o}

Provide a concise summary (2-3 paragraphs) focusing on general principles and conceptual themes that will inspire original thinking, not specific implementations.`},{role:"user",content:n}]});return m}async function F(e,t,i,o,n,m,a,c){let l=[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${t}"

This represents their background interest - a starting point for exploration, not a constraint. Encourage creative thinking beyond their initial context.`},{role:"assistant",content:i},{role:"system",content:`The user was asked about their thoughts on the following project dimension: ${e}`},{role:"assistant",content:o},{role:"user",content:n}];if(m&&a)l.push({role:"system",content:`The user was previously shown these options: ${m.join(", ")} but they didn't like them because: ${a}. Please generate different options that address their concerns.`});else{let _={HAIR_ON_FIRE_PROBLEM:"Generate 2-4 specific urgent information problems only. Focus on the problems themselves, not solutions. Examples: 'election misinformation spread', 'crisis coordination breakdowns', 'scientific consensus confusion'.",EPISTEMIC_GOAL:"Generate 2-4 specific epistemic or reasoning improvements only. Focus on cognitive/reasoning abilities, not complete solutions. Examples: 'better source evaluation skills', 'improved bias recognition', 'enhanced collective sensemaking'.",TARGET_USER:"Generate 2-4 specific user types or stakeholder groups only. Focus on concrete people who might benefit from AI+epistemic tools, not project ideas. Examples: 'journalists verifying sources', 'policy analysts evaluating evidence', 'students learning critical thinking'.",TECHNICAL_SHAPE:"Generate 2-4 specific technical formats only. Focus on delivery mechanisms, not complete ideas. Examples: 'browser extension', 'mobile app', 'Slack bot', 'curriculum framework', 'open-source library'.",SIGNAL_GATHERING:"Generate 2-4 specific approaches for finding users and testing demand only. Focus on user research and validation methods, not full projects. Examples: 'user interviews via professional networks', 'landing page tests in relevant communities', 'prototype demos at industry conferences', 'surveys through academic partnerships'."}[e]||`Generate 2-4 concrete, specific options for the dimension ${e} that will help define a concrete fellowship project.`;c&&c.trim()&&(_+=`

Background context (use sparingly for inspiration): ${c}

CRITICAL: Prioritize creative, original thinking over this background context. Generate diverse options that may be completely unrelated to the context above.`),l.push({role:"system",content:_})}let{object:h}=await(0,f.generateObject)({model:w("openai/gpt-4o-mini"),messages:l,schema:y.z.object({options:y.z.array(y.z.string())})}),s=await(0,r.select)({message:"Select the option that resonates most with you:",options:[...h.options.map(p=>({value:p,label:p})),{value:"skip_dimension",label:"I don't want to talk about this yet"},{value:"different_options",label:"I don't like any of these options"}]});return s==="skip_dimension"?{type:"change_dimension",explanation:"User chose to skip this dimension"}:s==="different_options"?{type:"change_options",explanation:(await(0,r.text)({message:"What kind of options would you prefer to see instead?"})).toString(),previousOptions:h.options}:{type:"selected",selected_options:[s],shownOptions:h.options}}async function ie(e,t,i){let o=[{role:"system",content:`You are an assistant helping participants in the AI+Epistemics Fellowship discover concrete project ideas.

FELLOWSHIP CONTEXT: This fellowship supports designing AI tools that enhance human reasoning and decision-making, both individually and collectively. Projects may aim to:
- Raise the epistemic ceiling (deepen insight for experts) or floor (help broader populations find clarity)
- Support mediation, negotiation, and collective action
- Fill the strategic gap in beneficial AI tools that empower human reasoning
- Address urgent global information and communication challenges

The user initially mentioned: "${e}"

This represents their background interest - a starting point for exploration, not a constraint.`},{role:"assistant",content:t}];for(let[s,p]of Object.entries(i))p&&o.push({role:"system",content:`The user has expressed preferences for ${s}: ${p}`});let n="",m=(0,f.streamText)({model:w("openai/gpt-4o-mini"),messages:[...o,{role:"system",content:"Provide a warm recap of the user's exploration through the project dimensions. Summarize their choices in a conversational way that shows you understand their vision. Don't just repeat their exact words - synthesize and reflect back what you're hearing about their project direction. Keep it encouraging and insightful (2-3 paragraphs)."}],onFinish:s=>{n=s.text}});await r.stream.message(m.textStream),o.push({role:"assistant",content:n});let a="",c=(0,f.streamText)({model:w("openai/gpt-4o-mini"),messages:[...o,{role:"system",content:`Based on all their dimensional choices, formulate their "Working Hypothesis" in the format: "Building X for Y will have Z effect on A" where:
- X = the technical approach/solution
- Y = the target users
- Z = the epistemic/reasoning improvement effect
- A = the broader problem or context

Present this as: "\u{1F3AF} **Your Working Hypothesis:** [hypothesis statement]"

Then add 1-2 sentences explaining what assumption they're operating under and why this hypothesis is worth testing.`}],onFinish:s=>{a=s.text}});await r.stream.message(c.textStream),o.push({role:"assistant",content:a});let l=(0,r.spinner)();l.start("\u{1F680} Generating concrete examples from your working hypothesis...");let{object:h}=await(0,f.generateObject)({model:w("openai/gpt-4o-mini"),temperature:.8,messages:[...o,{role:"system",content:`Based on the user's preferences across all project dimensions, generate 2-10 specific, concrete project ideas for the AI+Epistemics fellowship. Each project should:

1. Design AI tools that enhance human reasoning and decision-making
2. Either raise the epistemic ceiling (deepen expert insight) or floor (help broader populations find clarity)
3. Address urgent global information/communication challenges OR support mediation/collective action
4. Be technically feasible for a 12-week fellowship (roadmapping \u2192 prototyping \u2192 evaluation)
5. Include a clear path to test demand and connect with target users

For each project, provide:
- A clear project name
- A concise description (2-3 sentences max)
- How it enhances human reasoning/decision-making
- Why it fills a strategic gap in beneficial AI tools`}],schema:y.z.object({projects:y.z.array(y.z.object({name:y.z.string(),description:y.z.string(),reasoning_enhancement:y.z.string(),strategic_gap:y.z.string()}))})});l.stop("\u2705 Project ideas ready!"),r.log.message(`
\u{1F4A1} **Here are some concrete project ideas based on your working hypothesis:**
`),h.projects.forEach((s,p)=>{r.log.success(`${s.name}`),r.log.message(`${s.description}
`),r.log.message(`\u{1F9E0} Reasoning Enhancement: ${s.reasoning_enhancement}
`),r.log.message(`\u{1F3AF} Strategic Gap: ${s.strategic_gap}
`)}),r.log.message("\u2728 **Next steps:** Choose one of these ideas (or use them as inspiration) to start prototyping and testing your working hypothesis!"),r.log.message(`
\u{1F4A1} **Pro tip:** Remember that your working hypothesis is meant to be tested and refined - start with the simplest version that lets you learn whether you're on the right track.`),(0,r.outro)("Ready to turn your hypothesis into reality! \u{1F30D}\u{1F52C}"),process.exit(0)}require.main===module&&X();0&&(module.exports={presentOptions});
