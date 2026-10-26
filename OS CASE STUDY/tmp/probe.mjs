import { PresentationFile } from 'file:///C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const p = await PresentationFile.importPptx(await (await import('node:fs/promises')).readFile('output/submission/Race_Conditions_and_Synchronization_xv6_Presentation.pptx'));
console.log('slides', p.slides.items.length);
for (let i=0;i<Math.min(2,p.slides.items.length);i++) {
 const s=p.slides.items[i];
 console.log('slide',i,'shapes',s.shapes.items.map(x=>({id:x.id,type:x.type,text:x.text?.toString?.(), position:x.position, keys:Object.keys(x)})));
}
