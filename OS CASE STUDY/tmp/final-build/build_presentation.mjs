import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { PresentationFile } from 'file:///C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const root='C:/Users/HP/Documents/OS record/OS CASE STUDY';
const source=path.join(root,'output/submission/Race_Conditions_and_Synchronization_xv6_Presentation.pptx');
const outputDir=path.join(root,'output/final'), stagingDir=path.join(root,'tmp/final-build');
const finalPptx=path.join(outputDir,'Case_Study_14_Race_Conditions_xv6_Final_v12.pptx');
const sourceBytes=await fs.readFile(source);
const presentation=await PresentationFile.importPptx(sourceBytes);
if(presentation.slides.items.length!==20) throw new Error('Expected 20 slides');
const slides=presentation.slides.items;
const shape=(s,t)=>{const x=s.shapes.items.find(y=>String(y.text??'')===t);if(!x)throw new Error('Missing shape '+t);return x;};
const edits=(i,items)=>items.forEach(([a,b])=>shape(slides[i],a).text=b);
const note=(i,t)=>{slides[i].speakerNotes.text=t;};
edits(0,[['Race Conditions and\nSynchronization in xv6','Case Study 14\nRace Condition in XV6 Shared Data'],['Operating Systems Case Study','Operating Systems | Department of CSE'],['Faculty / semester / academic year: ____________________','Chaitanya Bharathi Institute of Technology | Faculty / semester / year: __________']]);
note(0,'This case study examines shared kernel data in xv6 on four CPUs. Team names and roll numbers follow the supplied division document. Faculty, semester, and academic year remain blank for the department to complete.');
edits(1,[['Problem statement','Case Study 14: Required scope'],['Concurrent kernel requests update the same physical-page free list.','Problem: study concurrent access to shared kernel data without synchronization.'],['Unsafe overlapping updates can break the allocator invariant.','Analyze how xv6 locks prevent inconsistent updates.'],['Compare original locks, deliberate removal, and restoration.','Objectives: understand critical sections, identify shared data, explain mutual exclusion, observe concurrent updates, and explain lock safety.'],['Question: how does the existing spinlock protect shared state?','Motivation: the allocator is shared across CPUs. Activities: inspect its lock, run the four-CPU workload, remove and restore four lock calls, then compare. Outcome: explain safe shared-data access.']]);
note(1,'The assignment studies xv6 shared kernel data and its existing locks. The project compares original locking, a temporary four-call removal, and restoration. The motivation is that multiple CPUs can request and release physical pages concurrently.');
const scopeDetail=shape(slides[1],'Motivation: the allocator is shared across CPUs. Activities: inspect its lock, run the four-CPU workload, remove and restore four lock calls, then compare. Outcome: explain safe shared-data access.');
scopeDetail.text='Motivation: four CPUs share one allocator. Activities: stress, remove/restore four calls, compare. Outcome: explain lock safety. Source: Case Study 14 brief.';
scopeDetail.text.style={fontSize:21,typeface:'Arial',color:'#17202A',alignment:'left'};
edits(2,[['Introduction, objectives and motivation','1. Race conditions depend on interleaving'],['Race condition: correctness depends on concurrent timing.','Race condition: shared-data correctness depends on how concurrent operations interleave.'],['Objective: connect shared-data rules to actual kernel behavior.','In xv6, concurrent kalloc() calls can read the same kmem.freelist head.'],['Table 2. Illustrative lost update: expected 2, final value 1','Table 1. A stale free-list head can assign page P twice'],['counter++ is a sequence of actions; the example is conceptual.','Source: xv6 kernel/kalloc.c. Illustrative schedule, not a recorded trace.']]);
const allocRaceTable=slides[2].tables.items[0];
const allocRaceValues=[['Step','CPU 0: kalloc()','CPU 1: kalloc()'],['1','r0 = freelist = P','r1 = freelist = P'],['2','freelist = P->next','freelist = P->next'],['3','return P','return P']];
for(let r=0;r<allocRaceValues.length;r++)for(let c=0;c<allocRaceValues[r].length;c++)allocRaceTable.getCell(r,c).value=allocRaceValues[r][c];
note(2,'A race is a correctness defect whose outcome depends on how concurrent operations interleave. The xv6 example is the allocator: without kmem.lock, CPU 0 and CPU 1 can both read P as the free-list head, both advance the head from the same stale pointer, and both return P. This is a source-level possible schedule, not a trace claimed for any one recorded failure.');
edits(3,[['Existing system and race problems','2. Race conditions can corrupt data and stop kernel work'],['Standard xv6 already protects its allocator with kmem.lock.','A lost head update can make a free page unreachable.'],['Removing protection permits conflicting free-list updates.','Two allocators may return the same physical page.'],['Possible effects: lost pages, corruption, allocation errors, crashes.','Broken links can corrupt memory or trap the kernel.'],['A race is a correctness problem; deadlock is a waiting problem.','Damage can spread into unrelated processes and kernel work.'],['An observed timeout does not prove deadlock.','Source: allocator invariant. A timeout alone is not a deadlock diagnosis.']]);
note(3,'The allocator invariant requires each free physical page to appear exactly once in the free list and never be returned to two callers at once. Violating that invariant can lose pages, corrupt memory, or crash the kernel. A race and a deadlock describe different problems.');
edits(5,[['Proposed solution','3. Proposed Solution: hold kmem.lock for the full update'],['Retain or restore the same lock around every free-list update.','Keep kmem.lock around each free-list update.'],['Protect the complete push or pop, including its dependent reads.','Protect the complete read-and-update sequence.'],['Atomic ownership and acquire/release ordering support the lock.','Use atomic ownership with acquire/release ordering.'],['Keep sections short and follow a consistent lock order.','Keep the critical section short.'],['The solution restores an existing xv6 mechanism.','Source: xv6 allocator code. The experiment restores the existing lock.']]);
note(5,'The solution preserves the invariant by serializing the complete free-list push or pop. In the tested xv6 revision, acquire and release use atomic operations with acquire and release ordering. The experiment restores the existing lock rather than adding a new one.');
edits(6,[['Synchronization working flow','4-5. Synchronization coordinates shared access'],['1.  Disable local interrupts with push_off()','Synchronization coordinates concurrent operations so shared state stays correct.'],['2.  Acquire ownership through atomic exchange','A critical section protects dependent reads and writes as one operation.'],['3.  Read or update the protected free-list state','Types: mutex, spinlock, semaphore, condition variable, reader-writer lock, barrier, atomic.'],['4.  Release with ordering, then restore nested interrupt state','xv6 uses a spinlock for the allocator; this study tests that lock.'],['Local interrupt disabling alone cannot exclude another CPU.','Source: xv6 spinlock.c. Atomic ownership excludes other CPUs.']]);
note(6,'Synchronization coordinates concurrent operations so shared state stays correct. A critical section groups dependent reads and writes. Common mechanisms include mutexes, spinlocks, semaphores, condition variables, reader-writer locks, barriers, and atomic operations. The experiment evaluates only xv6’s allocator spinlock.');
edits(4,[['Synchronization types and suitable uses','Existing System: xv6 protects a global free list'],['Table 1. Synchronization methods','Table 2. Shared kernel structures and their locks'],['Only the xv6 allocator spinlock was evaluated experimentally.','Source: MIT xv6 locking chapter. Per-CPU lists need refill/steal; CAS needs ABA-safe reclamation; neither was tested.']]);
const sharedTable=slides[4].tables.items[0];
const sharedValues=[['Shared structure','Lock and purpose'],['Physical-page free list','kmem.lock — serializes kalloc() and kfree()'],['Process table','p->lock — protects per-process state'],['PID allocator','pid_lock — coordinates PID assignment'],['Parent/child state','wait_lock — coordinates wait transitions'],['Buffer cache','bcache.lock — protects shared metadata'],['Timer ticks','tickslock — protects the shared tick count']];
for(let r=0;r<sharedValues.length;r++)for(let c=0;c<sharedValues[r].length;c++)sharedTable.getCell(r,c).value=sharedValues[r][c];
note(4,'Standard xv6 uses one global kmem.lock for a single physical-page free list. This is simple and correct but serializes allocators and can make CPUs spin under contention. Per-CPU free lists can reduce that contention but need page refill or stealing logic. A lock-free compare-and-swap path needs safe pointer handling, including ABA mitigation. These alternatives were not implemented or benchmarked. Other shared structures listed here were reviewed at source level only.');
edits(8,[['Shared allocator data and critical sections','6. xv6 holds kmem.lock across each free-list update'],['Figure 1. Exact protected update excerpts; surrounding code omitted.','Figure 2. kalloc() and kfree() update the free list inside kmem.lock. Source: kernel/kalloc.c.']]);
note(8,'kernel/kalloc.c declares kmem.freelist and kmem.lock. kalloc acquires the lock before reading the head and advancing it. kfree acquires it before linking a page to the head. kernel/spinlock.c and spinlock.h implement initlock, acquire, release, holding, push_off, and pop_off. Source: https://github.com/mit-pdos/xv6-riscv/blob/f780d7850765d74cbdcd1fff4b822d8829f7c9bd/kernel/kalloc.c and https://github.com/mit-pdos/xv6-riscv/blob/f780d7850765d74cbdcd1fff4b822d8829f7c9bd/kernel/spinlock.c');
edits(11,[['Possible allocator interleavings','8. Removing kmem.lock permits duplicate pages or lost frees'],['Table 4. Theoretical example: both CPUs allocate head page P','Table 4. Possible kalloc() schedule without kmem.lock'],['Possible source-level schedule; not a trace from a recorded failure.','Source: kernel/kalloc.c. A matching kfree() lost-head update can make a page unreachable.']]);
note(11,'Without kmem.lock, two CPUs can read the same free-list head P before either advances it, and both may return P. During concurrent frees, CPU 0 may link page A to old head F while CPU 1 links page B to F and overwrites the head with B, losing A. These are source-level possibilities. The logs do not identify an exact internal interleaving.');
edits(9,[['C workload and checking logic','7. race_test.c checks concurrent page allocations'],['Pipe gate releases four child processes to overlap their work.','The parent forks four workers, waits for all four, then writes one gate token per child.'],['Each child allocates 32 KiB and writes a distinct byte tag.','Each worker requests eight pages, fills a child-specific tag, rereads 32 KiB, then shrinks.'],['Verify every byte, release memory, and repeat 200 rounds.','volatile uchar *memory = (volatile uchar *)allocation;\nfor (int offset = 0; offset < bytes; offset++)\n  memory[offset] = tag;'],['Parent checks setup errors and every child exit status.','Any pipe/fork error or non-zero wait() status makes the run fail.'],['volatile forces rereads here; it does not synchronize the kernel.','Source: user/race_test.c; four workers repeat 200 rounds.']]);
shape(slides[9],'volatile uchar *memory = (volatile uchar *)allocation;\nfor (int offset = 0; offset < bytes; offset++)\n  memory[offset] = tag;').text.style={fontSize:19,typeface:'Arial',color:'#17202A',alignment:'left'};
note(9,'The guest C program uses a pipe as a start gate, forks four children, and only releases them after all workers exist. Each worker repeats 200 rounds of sbrk(8*4096), writes a unique byte tag across the 32 KiB allocation, waits briefly in user space, rereads each byte, then calls sbrk(-bytes). The parent verifies every wait() status. volatile requests fresh reads in this test; it does not synchronize the kernel or prevent aliasing of a physical page.');
edits(10,[['Allocation and freeing execution paths','7. member1_tools.c automates the WSL experiment'],['Allocation: sbrk() > sys_sbrk() > growproc() > uvmalloc() > kalloc()','Host C helper builds xv6, launches QEMU, records each attempt, and restores kalloc.c.'],['Release: sbrk(-bytes) > growproc() > uvmdealloc() / uvmunmap() > kfree()','Its run, package, and replay modes validate, summarize, and replay saved evidence.'],['wsl -d Ubuntu-24.04\ncd ~/xv6-member1\nmake qemu CPUS=4\n# In the xv6 shell:\nrace_test','PowerShell: wsl -d Ubuntu-24.04\ncd ~/xv6-member1\ngit rev-parse HEAD\nmake -j4 kernel/kernel fs.img\nmake qemu CPUS=4\n# xv6 shell: echo hello xv6; usertests -q; race_test'],['Private user buffers exercise the shared kernel allocator.','Source: member1_tools.c and the saved WSL run sequence.']]);
note(10,'member1_tools.c is the host C runner. Its helper functions handle paths, file loading and saving, subprocess execution, checked commands, build recording, result messages, run timing, CSV rows, manifests, package creation, restoration, and replay. In the guest, user/ulib.c sbrk reaches kernel/sysproc.c sys_sbrk, kernel/proc.c growproc, kernel/vm.c uvmalloc or uvmdealloc, then kernel/kalloc.c kalloc or kfree. The command shown is a reproducible WSL sequence; the measured C-runner set was automated through run mode.');
edits(7,[['Practical environment and protocol','Four CPUs and fixed workloads produced two 30-run datasets'],['Table 3. Fixed settings for all three phases','Table 3. Recorded environment and run controls'],['C workload + C host runner; recorded on 24 October 2026.','Source: run logs and both results.csv files; no kernel delay.']]);
note(7,'The source revision is f780d7850765d74cbdcd1fff4b822d8829f7c9bd. Environment: Ubuntu 24.04 under WSL2, QEMU 8.2.2, RISC-V GCC 13.3.0, four CPUs, and 128 MiB guest RAM. Every attempt booted a fresh guest. The host used a 30 second shell timeout and 60 seconds after starting the stress test. All attempts reached the shell and started the test. No kernel timing instrumentation was used.');
note(7,'The source revision is f780d7850765d74cbdcd1fff4b822d8829f7c9bd. Environment: Ubuntu 24.04 under WSL2, QEMU 8.2.2, RISC-V GCC 13.3.0, four CPUs, and 128 MiB guest RAM. Every attempt booted a fresh guest. The host used a 30 second shell timeout and 60 seconds after starting the stress test. All attempts reached the shell and started the test. No kernel timing instrumentation was used.');
const figures=path.join(root,'member1_completed/figures');
const image=async(i,file,alt,position={left:220,top:154,width:840,height:472})=>slides[i].images.add({blob:new Uint8Array(await fs.readFile(file)),contentType:'image/png',alt,fit:'contain',position});
const clearImages=async(i)=>{const rs=(await presentation.inspect({select:`$.slides[${i}].elements[?(@.kind == 'image')]`,include:['id']})).records;for(const r of rs)presentation.delete(r.id);};
for(const i of [12,13,14,15])await clearImages(i);
edits(12,[['Original-lock baseline','Locked baseline A01 passed with the original allocator'],['xv6 kernel is booting\n\nhart 1 starting\nhart 3 starting\nhart 2 starting\ninit: starting sh\n$ race_test\nrace_test: children=4 pages=8 rounds=200\nrace_test: PASS (all 4 children completed)\n$ QEMU: Terminated',''],['Figure 2. Saved C-validation A01 console text; baseline phase: 10/10 PASS.','Figure 3. Source: saved original-set A01 terminal recording; locked phase passed 10/10.']]);
await image(12,path.join(root,'tmp/final-build/terminal-stills/A01-locked.png'),'Static terminal still reconstructed from the saved A01 recording', {left:190,top:155,width:870,height:430});
note(12,'Static terminal still reconstructed from the saved A01 .cast recording. It shows a fresh xv6 boot, the race_test parameters, and PASS. The locked baseline had 10 PASS outcomes in 10 attempts. No video is embedded.');
edits(13,[['Deliberate allocator-lock removal','The unlocked variant removes four allocator lock calls'],['/* Same temporary change in kalloc() and kfree(): */\n\n- acquire(&kmem.lock);\n+ // acquire(&kmem.lock);\n\n  /* existing free-list updates stay unchanged */\n\n- release(&kmem.lock);\n+ // release(&kmem.lock);','kalloc():  - acquire(&kmem.lock);  + // acquire(&kmem.lock);\n          - release(&kmem.lock);  + // release(&kmem.lock);\nkfree():   - acquire(&kmem.lock);  + // acquire(&kmem.lock);\n          - release(&kmem.lock);  + // release(&kmem.lock);'],['Figure 3. Focused diff: four calls removed; workload unchanged.','Figure 4. Source: temporary kalloc.c diff; four lock calls removed.']]);
shape(slides[13],'kalloc():  - acquire(&kmem.lock);  + // acquire(&kmem.lock);\n          - release(&kmem.lock);  + // release(&kmem.lock);\nkfree():   - acquire(&kmem.lock);  + // acquire(&kmem.lock);\n          - release(&kmem.lock);  + // release(&kmem.lock);').text.style={fontSize:19,typeface:'Arial',color:'#17202A',alignment:'left'};
shape(slides[13],'kalloc():  - acquire(&kmem.lock);  + // acquire(&kmem.lock);\n          - release(&kmem.lock);  + // release(&kmem.lock);\nkfree():   - acquire(&kmem.lock);  + // acquire(&kmem.lock);\n          - release(&kmem.lock);  + // release(&kmem.lock);').text.style={fontSize:22,typeface:'Arial',color:'#17202A',alignment:'left'};
note(13,'The experimental variant comments out acquire and release in both kalloc() and kfree(), four calls total. The free-list operations and workload stay unchanged. Removing the calls also removes their local interrupt-handling effects when no outer lock is active, so the experiment does not isolate those effects.');
edits(14,[['Unlocked-run evidence','B02 shows corruption followed by kerneltrap'],[': CORRUPTION round=1 offset=16384 expected=3 got=4\n\nrace_test: FAIL (2 child failures; setup_failed=0)\n\nHost limit reached: 60 seconds',''],['B06 also contains panic/trap text. Primary categories follow the CSV.','The primary classification is CORRUPTION; the later panic remains visible.'],['Figure 4. Separate excerpts: B06, B07, B08 respectively; not one transcript.','Figure 5. Source: saved original-set B02 recording and results.csv.']]);
await image(14,path.join(root,'tmp/final-build/terminal-stills/B02-unlocked.png'),'Static terminal still reconstructed from saved B02 recording, showing corruption then kerneltrap', {left:190,top:155,width:870,height:430});
note(14,'Static terminal still reconstructed from the saved B02 .cast recording. It shows the corruption message followed by kerneltrap. The primary outcome is CORRUPTION under the classifier precedence; the time limit did not expire in this attempt.');
edits(15,[['Lock restoration and verification','Restoring locks rebuilt; C01 passed'],['kernel/kalloc.c: OK\n\nfinal-restoration.diff: empty\n\nuser/race_test.c: OK\n\nrace_test: PASS (all 4 children completed)','Source hash: verified\nFinal allocator diff: empty\nC01 race_test: PASS'],['Figure 5. Restoration checks and C01 result; restored phase: 10/10 PASS.','Figure 6. Source: saved C01 recording and restoration checksum; PASS.']]);
const restoreSummary=shape(slides[15],'Source hash: verified\nFinal allocator diff: empty\nC01 race_test: PASS');
restoreSummary.position={left:72,top:130,width:1136,height:78};
restoreSummary.text.style={fontSize:21,typeface:'Arial',color:'#17202A',alignment:'left'};
await image(15,path.join(root,'tmp/final-build/terminal-stills/C01-restored.png'),'Static terminal still reconstructed from saved C01 recording showing restored PASS', {left:190,top:205,width:820,height:350});
note(15,'The original allocator bytes were restored, the final allocator diff was empty, and the kernel was rebuilt. Static terminal still reconstructed from saved C01 .cast recording shows PASS. The restored phase had 10 PASS outcomes in 10 attempts. No video is embedded.');
const workflowSlide=slides[16];
const workflowTitle=shape(workflowSlide,'Demonstration');
const workflowShapeRecords=(await presentation.inspect({select:'$.slides[16].elements[*]',include:['id','text']})).records;
const workflowTitleId=workflowShapeRecords.find(r=>r.text==='Demonstration').id;
for(const oldShape of workflowShapeRecords) if(oldShape.id!==workflowTitleId) presentation.delete(oldShape.id);
workflowTitle.text='Working flow';
const navy='#12304A', ink='#17202A', muted='#53616E', pale='#F1F3F5', border='#607487';
const addWorkflowText=(text,position,style)=>{
 const s=workflowSlide.shapes.add({geometry:'textbox',position,fill:'none',line:{style:'solid',fill:'none',width:0}});
 s.text=text; s.text.style=style; return s;
};
const addWorkflowBox=(name,text,left,top,width,height)=>{
 const s=workflowSlide.shapes.add({geometry:'rect',name,position:{left,top,width,height},fill:pale,line:{style:'solid',fill:border,width:2}});
 s.text=text; s.text.style={fontSize:19,typeface:'Arial',bold:true,color:navy,alignment:'center'}; s.text.insets={top:6,right:9,bottom:6,left:9}; return s;
};
addWorkflowText('GUEST ALLOCATION  |  4 children × 8 pages × 200 rounds',{left:72,top:145,width:1136,height:30},{fontSize:19,typeface:'Arial',bold:true,color:ink,alignment:'left'});
const guestBoxes=[
 addWorkflowBox('guest-test','race_test.c\n4 forked workers',72,180,196,74),
 addWorkflowBox('sbrk-call','sbrk(bytes)\nuser/ulib.c',306,180,196,74),
 addWorkflowBox('system-call','sys_sbrk()\nkernel/sysproc.c',540,180,196,74),
 addWorkflowBox('vm-growth','growproc() → uvmalloc()',774,180,196,74),
 addWorkflowBox('allocator-lock','kalloc()\nkmem.lock',1008,180,196,74),
];
for(let i=0;i<guestBoxes.length-1;i++) workflowSlide.shapes.connect(guestBoxes[i],guestBoxes[i+1],{kind:'straight',fromSide:'right',toSide:'left',line:{style:'solid',fill:border,width:2},tail:{type:'arrow',width:'sm',length:'sm'}});
addWorkflowText('Release path: uvmdealloc() → uvmunmap() → kfree().',{left:72,top:264,width:1136,height:30},{fontSize:17,typeface:'Arial',color:muted,alignment:'left'});
addWorkflowText('HOST C RUNNER  |  controlled phases and restoration',{left:72,top:310,width:1136,height:30},{fontSize:19,typeface:'Arial',bold:true,color:ink,alignment:'left'});
const phaseBoxes=[
 addWorkflowBox('phase-locked','A: LOCKED\noriginal allocator',72,344,252,72),
 addWorkflowBox('phase-unlocked','B: UNLOCKED\nremove four calls',370,344,252,72),
 addWorkflowBox('phase-restored','C: RESTORED\nrestore bytes, rebuild',668,344,252,72),
 addWorkflowBox('phase-verify','VERIFY\nhash + diff + results.csv',966,344,238,72),
];
for(let i=0;i<phaseBoxes.length-1;i++) workflowSlide.shapes.connect(phaseBoxes[i],phaseBoxes[i+1],{kind:'straight',fromSide:'right',toSide:'left',line:{style:'solid',fill:border,width:2},tail:{type:'arrow',width:'sm',length:'sm'}});
addWorkflowText('Fresh QEMU boot per attempt; save console output and one result row.',{left:72,top:446,width:1136,height:32},{fontSize:18,typeface:'Arial',color:ink,alignment:'left'});
addWorkflowText('Figure 1. Guest and host workflow. Source: race_test.c and member1_tools.c.',{left:72,top:510,width:1136,height:30},{fontSize:16,typeface:'Arial',italic:true,color:muted,alignment:'center'});
workflowSlide.speakerNotes.text='Implementation diagram based on the checked source and recorded host workflow. Guest growth: user/race_test.c → user/ulib.c sbrk → kernel/sysproc.c sys_sbrk → kernel/proc.c growproc → kernel/vm.c uvmalloc → kernel/kalloc.c kalloc. Shrink reaches uvmdealloc/uvmunmap and kfree. Host phases are controlled by member1_tools.c: baseline with four lock calls present, a deliberate edit of exactly four acquire/release calls, then byte-for-byte restoration and rebuild. atexit(restore) handles normal C process termination; it cannot guarantee recovery after power loss or forced termination. Evidence CSV and raw logs remain separated by dataset.';
workflowSlide.shapes.add({geometry:'textbox',name:'slide-number-placeholder',position:{left:1152,top:673,width:56,height:25},fill:'none',line:{style:'solid',fill:'none',width:0},text:{text:'00',style:{fontSize:17,typeface:'Arial',color:'#66727E',alignment:'left'}}});
edits(17,[['Results and practical limitations','9. Locked and restored phases passed; every unlocked attempt failed'],['Table 5. Recorded attempt totals','Table 5. Results by phase'],['Unlocked: 1 corruption, 6 panic/trap, 2 test failures, 1 timeout.','Figure 7. Primary outcomes in two independent unlocked datasets.'],['Timeout is not a deadlock diagnosis; elapsed times are not benchmarks.','Elapsed seconds start at the shell prompt, just before race_test is sent; collection time is included.'],['One workload, 4 CPUs, 10 attempts per phase; PASS is not a proof of safety.','Source: both results.csv files, Oct 2026. PASS is not proof; timeout is not deadlock diagnosis.']]);
const tr=slides[17].tables.items[0], vals=[['Phase','Original','C-run'],['Locked','10/10 PASS','10/10 PASS'],['Unlocked','3C / 4P / 2F / 1T','1C / 6P / 2F / 1T'],['Restored','10/10 PASS','10/10 PASS']];
for(let r=0;r<vals.length;r++)for(let c=0;c<vals[r].length;c++)tr.getCell(r,c).value=vals[r][c];
const chartRefs=(await presentation.inspect({select:'$.slides[17].elements[?(@.kind == \'chart\')]',include:['id']})).records;
for(const rec of chartRefs)presentation.delete(rec.id);
await clearImages(17);
await image(17,path.join(stagingDir,'results-comparison.png'),'Chart placeholder for editable native outcome chart',{left:570,top:155,width:640,height:320});
note(17,'The chart compares two separate 30-attempt datasets. The original unlocked phase recorded three corruption outcomes, four panics or traps, two test failures, and one timeout. The C-runner phase recorded one corruption, six panics or traps, two test failures, and one timeout. Both locked and restored phases passed all ten attempts in each dataset. Elapsed time starts when the host sees the xv6 shell prompt, just before it sends race_test, and includes a short output-collection interval.');
edits(18,[['Conclusion, applications and future scope','10. Conclusion: kmem.lock preserved the free-list invariant'],['Learning: protect the invariant across the complete critical section.','Learning: a lock must cover the full read and update that preserves an invariant.'],['Finding: completion returned after the original locks were restored.','Finding: all locked and restored attempts passed; unlocked attempts recorded failures.'],['Applications: memory lists, shared queues, caches, application state.','The same reasoning applies to kernel queues, caches, process data, and shared application state.'],['Future work: vary CPUs, detect lost pages, measure contention.','Future work: test more CPU counts, detect lost pages, and measure lock contention.'],['Further experiments and alternative primitives remain untested.','Source: 60 saved attempts across two datasets. Other primitives remain untested.']]);
note(18,'The experiment connects a shared-data invariant to mutual exclusion. Locked and restored conditions completed all ten attempts in each dataset, while each unlocked condition produced ten non-PASS outcomes. The conclusion applies to this xv6 revision, QEMU setup, and workload. More CPU counts, allocator-specific lost-page checks, contention measurements, and other shared structures remain future work.');
const refDelete=(await presentation.inspect({select:'$.slides[19].elements[*]',include:['id','text']})).records.filter(r=>['Faculty format: 1000097330.pdf','Full source links and relevant evidence filenames are in speaker notes.'].includes(r.text));
edits(19,[['Fixed xv6 source revision: f780d7850765d74cbdcd1fff4b822d8829f7c9bd','• xv6 library (MIT PDOS): https://github.com/mit-pdos/xv6-riscv'],['C-validation: results.csv, raw logs, diffs, and restoration checks','• MIT xv6 RISC-V book, Locking: https://mit-pdos.github.io/xv6-riscv-book/lock.html'],['MIT xv6 book: Locking chapter','• The Open Group, memory synchronization: https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap04.html'],['POSIX / Linux man-pages: conditions, semaphores, RW locks, barriers','• Michael and Scott, Nonblocking algorithms and ABA: https://www.cs.rochester.edu/u/scott/papers/1998_JPDC_nonblocking.pdf'],['Faculty format: 1000097330.pdf',''],['Full source links and relevant evidence filenames are in speaker notes.','']]);
for(const r of refDelete)presentation.delete(r.id);
for(const label of ['• xv6 library (MIT PDOS): https://github.com/mit-pdos/xv6-riscv','• MIT xv6 RISC-V book, Locking: https://mit-pdos.github.io/xv6-riscv-book/lock.html','• The Open Group, memory synchronization: https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap04.html','• Michael and Scott, Nonblocking algorithms and ABA: https://www.cs.rochester.edu/u/scott/papers/1998_JPDC_nonblocking.pdf'])
  shape(slides[19],label).text.style={fontSize:19,typeface:'Arial',color:'#17202A',alignment:'left'};
note(19,'References: xv6 library (MIT PDOS), https://github.com/mit-pdos/xv6-riscv; MIT xv6 RISC-V book, Locking chapter, https://mit-pdos.github.io/xv6-riscv-book/lock.html; The Open Group memory synchronization specification, https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap04.html; Michael and Scott, Nonblocking algorithms and ABA, https://www.cs.rochester.edu/u/scott/papers/1998_JPDC_nonblocking.pdf.');
const transitions=[
 'I’ll begin with the race definition, then trace the allocator example.',
 'Next I’ll show how two CPUs can interleave the same free-list update.',
 'That stale update can cause memory corruption, allocator failures, or a kernel trap.',
 'Before the proposed fix, I’ll review the existing xv6 locks and their tradeoffs.',
 'Now I’ll state the synchronization rule this experiment tests.',
 'Next I’ll define synchronization and place spinlocks among the common mechanisms.',
 'The workflow connects the guest allocation path to the host experiment phases.',
 'With the environment fixed, I’ll show a possible two-CPU interleaving.',
 'The allocator code identifies the protected section; next I’ll explain the guest test.',
 'The guest test creates overlapping allocation requests; next I’ll show the host runner.',
 'The host runner automates builds, attempts, and restoration; next I’ll summarize its setup.',
 'The possible schedule motivates the locked baseline shown next.',
 'The locked baseline passed; now I’ll show the four-call source change.',
 'The source change removes the lock around the full update; next is B02 evidence.',
 'B02 records corruption followed by a kerneltrap; next I’ll verify restoration.',
 'Restoration returned to the saved allocator; next I’ll compare all attempts.',
 'The workflow shows how the guest and host phases connect; next I’ll inspect the source.',
 'The two datasets show the same locked/restored pattern with different unlocked counts.',
 'The conclusion is limited to this workload; the final slide lists its sources.',
 'These sources ground the case. A useful next study would vary CPU counts and check allocator invariants.'
];
for(let i=0;i<slides.length;i++){
 const current=String(slides[i].speakerNotes.text??'').trim();
 if(!current)throw new Error(`Missing speaker notes on slide ${i+1}`);
 slides[i].speakerNotes.text=`${current} ${transitions[i]}`;
}
const order=[0,1,2,3,4,5,6,16,8,9,10,7,11,12,13,14,15,17,18,19];
const canonical=(await presentation.inspect({select:'$.slides[*]',include:['id']})).records;
presentation.slides.reorder(order.map(i=>canonical[i].id));
for(let i=1;i<presentation.slides.items.length;i++){const n=presentation.slides.items[i].shapes.items.find(x=>/^\d{2}$/.test(String(x.text??'')));if(n)n.text=String(i+1).padStart(2,'0');}
await fs.mkdir(stagingDir,{recursive:true}); await fs.mkdir(outputDir,{recursive:true});
const candidate=path.join(stagingDir,'candidate.pptx');
await (await PresentationFile.exportPptx(presentation)).save(candidate);
execFileSync('C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',[
 path.join(stagingDir,'insert_native_results_chart.py'),candidate
],{stdio:'inherit'});
const skillDir='C:/Users/HP/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
process.env.RUNTIME_NODE_MODULES='C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {finalizePresentation}=await import(pathToFileURL(path.join(skillDir,'container_tools/artifact_tool_utils.mjs')).href);
const sha=createHash('sha256').update(sourceBytes).digest('hex');
const finalResult=await finalizePresentation({
 explicitTotalSlideCount:20,requiredNativeTableOwnerSlides:[3,5,12,13,18],
 workspaceDir:root,candidatePath:candidate,finalPath:finalPptx,
 pythonExecutable:'C:/Users/HP/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
 integrityValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit',...[3,5,12,13,18].flatMap(n=>['--require-native-table-slide',String(n)])],
 requiredNativeTableOwnerSlides:[3,5,12,13,18],
 fontPolicy:{basis:'reference',families:['Arial'],referencePath:source,referenceSha256:sha},
 expectedSlideSizeEmu:'12192000,6858000',verifyArtifactToolImport:true,
 receiptPath:path.join(stagingDir,'presentation-validation-v12.json')
});
console.log(JSON.stringify({finalPptx,finalResult},null,2));


