import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root='C:/Users/HP/Documents/OS record/OS CASE STUDY';
const skill='C:/Users/HP/.codex/plugins/cache/openai-primary-runtime/presentations/26.1024.11018/skills/presentations';
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({
 workspaceDir:root,
 candidatePath:path.join(root,'tmp/submission/candidate.pptx'),
 finalPath:path.join(root,'output/submission/Race_Conditions_and_Synchronization_xv6_Presentation.pptx'),
 pythonExecutable:'C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 explicitTotalSlideCount:20,
 requiredNativeTableOwnerSlides:[3,5,8,12,18],
 requiredNativeChartOwnerSlides:[18],
 materializeLiteralChartWorkbooks:true,
 nativeChartTargetApplication:'powerpoint',
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit',...[3,5,8,12,18].flatMap(n=>['--require-native-table-slide',String(n)])],
 fontPolicy:{basis:'design',families:['Arial']},
 verifyArtifactToolImport:true,
 receiptPath:path.join(root,'tmp/submission/deck-validation-final.json')
});
console.log(JSON.stringify(result,null,2));
