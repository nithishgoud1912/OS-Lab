import {PresentationFile} from 'file:///C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
import fs from 'node:fs/promises';import path from 'node:path';
const p=await PresentationFile.importPptx(await fs.readFile('output/final/Case_Study_14_Race_Conditions_xv6_Final_v4.pptx'));
const dir='tmp/final-build/ppt-render-v4';await fs.mkdir(dir,{recursive:true});
const imgs=await p.render({slide:Array.from({length:p.slides.items.length},(_,i)=>i)});
for(let i=0;i<imgs.length;i++){await fs.writeFile(path.join(dir,`slide-${String(i+1).padStart(2,'0')}.png`),Buffer.from(await imgs[i].arrayBuffer()));}
console.log('rendered',imgs.length);
