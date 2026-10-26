import { PresentationFile } from 'file:///C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
import fs from 'node:fs/promises';
const b=await fs.readFile('output/submission/Race_Conditions_and_Synchronization_xv6_Presentation.pptx'); const p=await PresentationFile.importPptx(b);
for(let i=0;i<p.slides.items.length;i++){let s=p.slides.items[i]; let tables=s.tables?.items??[]; let charts=s.charts?.items??[]; let images=s.images?.items??[]; if(tables.length||charts.length||images.length) console.log(i+1,'tables',tables.length,'charts',charts.length,'images',images.length, tables.map(t=>({id:t.id,keys:Object.keys(t),rows:t.rowCount,cols:t.columnCount})));}
