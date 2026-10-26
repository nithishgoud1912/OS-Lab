import { PresentationFile } from 'file:///C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
import fs from 'node:fs/promises';
const p=await PresentationFile.importPptx(await fs.readFile('output/submission/Race_Conditions_and_Synchronization_xv6_Presentation.pptx'));
for(const i of [0,1,2,7,12,13,14,15,17,18,19]){const s=p.slides.items[i]; console.log('SLIDE',i+1); for(const sh of s.shapes.items) console.log(JSON.stringify({id:sh.id,text:String(sh.text||''),data:sh.data},null,0)); if(s.tables?.items?.length){let t=s.tables.items[0]; console.log('TABLEDATA',JSON.stringify(t.data).slice(0,1000));}}
