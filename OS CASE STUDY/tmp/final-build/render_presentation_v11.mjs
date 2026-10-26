import {PresentationFile} from 'file:///C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const input='output/final/Case_Study_14_Race_Conditions_xv6_Final_v11.pptx';
const dir='tmp/final-build/ppt-render-v11';
const presentation=await PresentationFile.importPptx(await fs.readFile(input));
await fs.mkdir(dir,{recursive:true});
const images=await presentation.render({slide:Array.from({length:presentation.slides.items.length},(_,i)=>i)});
for(let i=0;i<images.length;i++){
  await fs.writeFile(path.join(dir,`slide-${String(i+1).padStart(2,'0')}.png`),Buffer.from(await images[i].arrayBuffer()));
}
console.log(`rendered ${images.length} slides`);


