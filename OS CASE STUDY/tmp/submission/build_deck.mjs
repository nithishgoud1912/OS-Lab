import fs from 'node:fs/promises';
import path from 'node:path';
const root='C:/Users/HP/Documents/OS record/OS CASE STUDY';
const dir=path.join(root,'tmp/submission');
const pages=JSON.parse(await fs.readFile(path.join(dir,'report_pages.json'),'utf8'));
const source='https://github.com/mit-pdos/xv6-riscv/tree/f780d7850765d74cbdcd1fff4b822d8829f7c9bd';
const book='https://mit-pdos.github.io/xv6-riscv-book/lock.html';
const raw=async f=>(await fs.readFile(path.join(root,'member1_completed/c_validation',f),'utf8')).trim();
const slides=[
 {title:'Race Conditions and\nSynchronization in xv6',kind:'cover',pages:[1],text:'Operating Systems Case Study',table:[['L Nithish Kumar Goud','160124733327'],['G Ishan','160124733322'],['Santhosh','160124733332'],['Venkat','160124733340']]},
 {title:'Problem statement',pages:[5],lines:['Concurrent kernel requests update the same physical-page free list.','Unsafe overlapping updates can break the allocator invariant.','Compare original locks, deliberate removal, and restoration.'],bottom:'Question: how does the existing spinlock protect shared state?'},
 {title:'Introduction, objectives and motivation',pages:[6],lines:['Race condition: correctness depends on concurrent timing.','Objective: connect shared-data rules to actual kernel behavior.'],table:[['Step','Activity A','Activity B'],['1','Read 0','Read 0'],['2','Compute 1','Compute 1'],['3','Store 1','Store 1']],tableTitle:'Illustrative lost update: expected 2, final value 1',bottom:'counter++ is a sequence of actions; the example is conceptual.'},
 {title:'Existing system and race problems',pages:[7,8],lines:['Standard xv6 already protects its allocator with kmem.lock.','Removing protection permits conflicting free-list updates.','Possible effects: lost pages, corruption, allocation errors, crashes.','A race is a correctness problem; deadlock is a waiting problem.'],bottom:'An observed timeout does not prove deadlock.'},
 {title:'Synchronization types and suitable uses',pages:[9,10],kind:'types',table:[['Method','Suitable purpose'],['Mutex / spinlock','Exclusive access; sleep or busy-wait as appropriate'],['Semaphore','Available permits or bounded resources'],['Condition variable / monitor','Wait for a state predicate under an exclusion rule'],['Reader-writer lock','Concurrent readers; exclusive writers'],['Barrier','Wait for all participants at a phase boundary'],['Atomic operation','Indivisible update; not a whole-object guarantee']],bottom:'Only the xv6 allocator spinlock was evaluated experimentally.'},
 {title:'Proposed solution',pages:[11],lines:['Retain or restore the same lock around every free-list update.','Protect the complete push or pop, including its dependent reads.','Atomic ownership and acquire/release ordering support the lock.','Keep sections short and follow a consistent lock order.'],bottom:'The solution restores an existing xv6 mechanism.'},
 {title:'Synchronization working flow',pages:[11],kind:'flow',lines:['Disable local interrupts with push_off()','Acquire ownership through atomic exchange','Read or update the protected free-list state','Release with ordering, then restore nested interrupt state'],bottom:'Local interrupt disabling alone cannot exclude another CPU.'},
 {title:'Practical environment and protocol',pages:[12],tableTitle:'Fixed settings for all three phases',table:[['Setting','Recorded configuration'],['Guest / host','RISC-V xv6 / Ubuntu 24.04 under WSL2'],['Emulator / compiler','QEMU 8.2.2 / RISC-V GCC 13.3.0'],['Resources','4 CPUs; 128 MiB RAM'],['Workload','4 children; 8 pages each; 200 rounds'],['Attempts','10 per phase; fresh guest per attempt'],['Limits','30 s to shell; 60 s after stress command']],bottom:'C workload + C host runner; recorded on 24 October 2026.'},
 {title:'Shared allocator data and critical sections',pages:[13],kind:'code',code:'/* kalloc(): remove one free page */\nacquire(&kmem.lock);\nr = kmem.freelist;\nif (r) kmem.freelist = r->next;\nrelease(&kmem.lock);\n\n/* kfree(): add one free page */\nacquire(&kmem.lock);\nr->next = kmem.freelist;\nkmem.freelist = r;\nrelease(&kmem.lock);',bottom:'Figure 1. Exact protected update excerpts; surrounding code omitted.'},
 {title:'C workload and checking logic',pages:[14],lines:['Pipe gate releases four child processes to overlap their work.','Each child allocates 32 KiB and writes a distinct byte tag.','Verify every byte, release memory, and repeat 200 rounds.','Parent checks setup errors and every child exit status.'],bottom:'volatile forces rereads here; it does not synchronize the kernel.'},
 {title:'Allocation and freeing execution paths',pages:[15],kind:'paths',lines:['Allocation: sbrk() > sys_sbrk() > growproc() > uvmalloc() > kalloc()','Release: sbrk(-bytes) > growproc() > uvmdealloc() / uvmunmap() > kfree()'],code:'wsl -d Ubuntu-24.04\ncd ~/xv6-member1\nmake qemu CPUS=4\n# In the xv6 shell:\nrace_test',bottom:'Private user buffers exercise the shared kernel allocator.'},
 {title:'Possible allocator interleavings',pages:[16],tableTitle:'Theoretical example: both CPUs allocate head page P',table:[['Step','CPU 0','CPU 1'],['1','Read head P',''],['2','','Read head P'],['3','Set head to P.next',''],['4','','Set head to P.next'],['5','Return P','Return P']],bottom:'Possible source-level schedule; not a trace from a recorded failure.'},
 {title:'Original-lock baseline',pages:[17],kind:'console',code:await raw('A01-locked.txt'),bottom:'Figure 2. Saved C-validation A01 console text; baseline phase: 10/10 PASS.'},
 {title:'Deliberate allocator-lock removal',pages:[18],kind:'code',code:'/* Same temporary change in kalloc() and kfree(): */\n\n- acquire(&kmem.lock);\n+ // acquire(&kmem.lock);\n\n  /* existing free-list updates stay unchanged */\n\n- release(&kmem.lock);\n+ // release(&kmem.lock);',bottom:'Figure 3. Focused diff: four calls removed; workload unchanged.'},
 {title:'Unlocked-run evidence',pages:[19],kind:'failure',code:': CORRUPTION round=1 offset=16384 expected=3 got=4\n\nrace_test: FAIL (2 child failures; setup_failed=0)\n\nHost limit reached: 60 seconds',bottom:'Figure 4. Separate excerpts: B06, B07, B08 respectively; not one transcript.'},
 {title:'Lock restoration and verification',pages:[20],kind:'restore',code:'kernel/kalloc.c: OK\n\nfinal-restoration.diff: empty\n\nuser/race_test.c: OK\n\nrace_test: PASS (all 4 children completed)',bottom:'Figure 5. Restoration checks and C01 result; restored phase: 10/10 PASS.'},
 {title:'Demonstration',pages:[21],kind:'demo',lines:['Show the workload, controlled lock removal, and restoration.','Open the accompanying walkthrough video.','Earlier-run source/log replay; separate from C-validation results.'],bottom:'Rendered walkthrough, not a live desktop screen recording.'},
 {title:'Results and practical limitations',pages:[21,22,23],kind:'results',table:[['Phase','PASS','Other'],['Original','10','0'],['Unlocked','0','10'],['Restored','10','0']],bottom:'One workload, 4 CPUs, 10 attempts per phase; PASS is not a proof of safety.'},
 {title:'Conclusion, applications and future scope',pages:[24],lines:['Learning: protect the invariant across the complete critical section.','Finding: completion returned after the original locks were restored.','Applications: memory lists, shared queues, caches, application state.','Future work: vary CPUs, detect lost pages, measure contention.'],bottom:'Further experiments and alternative primitives remain untested.'},
 {title:'References',pages:[25],kind:'refs',lines:['Fixed xv6 source revision: f780d7850765d74cbdcd1fff4b822d8829f7c9bd','C-validation: results.csv, raw logs, diffs, and restoration checks','MIT xv6 book: Locking chapter','POSIX / Linux man-pages: conditions, semaphores, RW locks, barriers','Faculty format: 1000097330.pdf'],bottom:'Full source links and relevant evidence filenames are in speaker notes.'}
];

export async function build(presentation){
 presentation.slides.keep([]);
 function text(s,txt,x,y,w,h,size=30,bold=false,color='#17202a',font='Arial'){
  const sh=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
  sh.text=txt;sh.text.style={fontSize:size,typeface:font,bold,color,insets:0,wrap:'square',autoFit:'none',verticalAlignment:'top'};return sh;
 }
 function table(s,vals,y,h,widths=null){
  const t=s.tables.add({rows:vals.length,columns:vals[0].length,left:72,top:y,width:1136,height:h,values:vals,...(widths?{columnWidths:widths}:{})});
  t.borders.assign({fill:'#cad2da',width:.7,style:'solid'});
  for(let r=0;r<vals.length;r++){
   t.rows[r].height=h/vals.length;
   for(let c=0;c<vals[0].length;c++){
    const cell=t.getCell(r,c);cell.fill=r===0?'#edf1f5':'#ffffff';
    cell.text.style={fontSize:24,typeface:'Arial',bold:r===0,color:'#17202a',insets:9,verticalAlignment:'middle'};
   }
  }return t;
 }
 for(const [i,d] of slides.entries()){
  const s=presentation.slides.add({width:1280,height:720});s.background.fill='#ffffff';
  text(s,d.title,72,i===0?75:42,1136,i===0?155:92,i===0?56:42,true,'#12304a');
  if(i!==0)text(s,String(i+1).padStart(2,'0'),1152,673,56,25,17,false,'#66727e');
  const by=d.pages.map(n=>pages[n-1].text).join('\n\n');
  s.speakerNotes.text=by+'\n\nSources: local C-validation evidence, report sections shown above; fixed kernel source: '+source+' ; MIT locking background: '+book+' .\n'+(d.kind==='types'?'POSIX sources: https://man7.org/linux/man-pages/man3/pthread_cond_wait.3p.html ; https://man7.org/linux/man-pages/man3/sem_wait.3.html ; https://man7.org/linux/man-pages/man3/pthread_rwlock_rdlock.3p.html ; https://man7.org/linux/man-pages/man3/pthread_barrier_wait.3p.html .':'')+(d.kind==='demo'?'Video is adjacent: demo-walkthrough.mp4. It replays the earlier evidence run set. Keep the video alongside this PPTX.':'');
  if(d.kind==='cover'){
   text(s,d.text,72,260,1100,45,30);
   d.table.forEach((r,j)=>text(s,r[0]+'    |    '+r[1],72,347+j*53,1136,42,27));
   text(s,'Faculty / semester / academic year: ____________________',72,605,1136,44,23,false,'#596570');
  } else if(d.kind==='types'){
   text(s,'Table 1. Synchronization methods',72,137,1136,31,24,true);
   table(s,d.table,181,413,[355,781]);
  } else if(d.kind==='results'){
   text(s,'Table 5. Recorded attempt totals',72,143,510,35,23,true);
   const t=s.tables.add({rows:4,columns:3,left:72,top:192,width:480,height:220,values:d.table,columnWidths:[240,120,120]});
   t.borders.assign({fill:'#cad2da',width:1,style:'solid'});
   for(let r=0;r<4;r++)for(let c=0;c<3;c++){const ce=t.getCell(r,c);ce.fill=r===0?'#edf1f5':'#ffffff';ce.text.style={fontSize:25,typeface:'Arial',bold:r===0,insets:10,color:'#17202a'};}
   const chart=s.charts.add('bar',{position:{left:620,top:155,width:565,height:310},categories:['Original','Unlocked','Restored'],series:[{name:'PASS attempts',values:[10,0,10],fill:'#245b80'}],hasLegend:false,dataLabels:{showValue:true,position:'outEnd'},xAxis:{textStyle:{fontSize:22,typeface:'Arial'}},yAxis:{minimumScale:0,maximumScale:10,majorUnit:5,textStyle:{fontSize:20,typeface:'Arial'},majorGridlines:{fill:'#e5e7eb',width:1}}});
   chart.title='PASS';chart.titleTextStyle.fontSize=25;chart.titleTextStyle.typeface='Arial';
   text(s,'Unlocked: 1 corruption, 6 panic/trap, 2 test failures, 1 timeout.',72,500,1136,44,27);
   text(s,'Timeout is not a deadlock diagnosis; elapsed times are not benchmarks.',72,555,1136,63,25);
  } else if(d.kind==='flow'){
   d.lines.forEach((line,j)=>text(s,String(j+1)+'.  '+line,72,166+j*105,1136,66,30,j===2));
  } else if(d.kind==='code'||d.kind==='console'||d.kind==='failure'||d.kind==='restore'){
   text(s,d.code,82,164,1120,d.kind==='code'?430:400,d.kind==='console'?29:d.kind==='failure'?27:28,false,'#17202a','Arial');
   if(d.kind==='failure')text(s,'B06 also contains panic/trap text. Primary categories follow the CSV.',72,525,1136,70,26);
  } else if(d.kind==='paths'){
   d.lines.forEach((line,j)=>text(s,line,72,150+j*88,1136,75,27,j===0));
   text(s,d.code,82,365,1120,225,29,false,'#17202a','Arial');
  } else if(d.kind==='demo'){
   d.lines.forEach((line,j)=>text(s,line,72,166+j*86,1136,75,30));
   const link=text(s,'Open demo-walkthrough.mp4',72,484,1136,60,34,true,'#225e8b');
   link.text.get('Open demo-walkthrough.mp4').link={uri:'demo-walkthrough.mp4',isExternal:true};
   link.text.get('Open demo-walkthrough.mp4').underline='sng';
  } else if(d.kind==='refs'){
   d.lines.forEach((line,j)=>text(s,line,72,160+j*86,1136,72,j===0?23:27));
  } else if(d.table && i===2){
   d.lines.forEach((line,j)=>text(s,line,72,140+j*65,1136,58,28));
   text(s,'Table 2. '+d.tableTitle,72,296,1136,35,24,true);
   table(s,d.table,347,218,[150,493,493]);
  } else if(d.table){
   text(s,(i===11?'Table 4. ':'Table 3. ')+d.tableTitle,72,143,1136,36,24,true);
   table(s,d.table,199,i===11?345:385,i===11?[130,503,503]:[340,796]);
  } else {
   d.lines.forEach((line,j)=>text(s,line,72,165+j*103,1136,87,31));
  }
  if(d.bottom)text(s,d.bottom,72,634,1020,55,20,false,'#53616e');
 }
 return {slides:slides.length};
}

export const paths={root,dir};
