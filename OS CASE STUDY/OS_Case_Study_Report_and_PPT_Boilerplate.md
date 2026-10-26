# XV6 race conditions: report and PPT planning draft

This is an editable written boilerplate, not a completed report or slide deck. Replace every bracketed field. No experiments, results or contributions are claimed to have been completed.

## Source and interpretation

Faculty guidelines: C:/Users/HP/Downloads/1000097330.pdf, both handwritten pages. Team ownership: XV6_Race_Condition_Four_Member_Division.pdf. Assume the user is Member 1.

Faculty requirements take precedence over the earlier team plan. The 14 report pages and 18 slides below are suggested allocation, not faculty-mandated counts. Final page numbers must be updated after formatting. The faculty notes do not specify margins, line spacing, binding, a report page limit, or exact certificate wording. Use the department's existing record format for these details; this draft does not establish them.

## Required formatting and order

PPT: simple white background; limited text without large paragraphs; no more than 20 slides, counting title and references. Include problem statement; introduction with objectives and motivation; existing system with background search and drawbacks; proposed solution; working flow; implementation screenshots and a demo/video; results; conclusion covering learning, applications and future scope. Put table titles above tables and figure captions below figures.

Report: hard copy; same format as the department record; certificate/team details, problem statement and contributions, index, and the same content flow as the presentation; references at the end. Times New Roman, 14-point headings and 12-point body text, justified paragraphs. Page 1's final note appears to say "no points"; use prose rather than bullet-point body sections as the conservative interpretation. Tables and captioned figures are still appropriate because the guidelines explicitly address them. The handwritten front-matter order is abbreviated; the allocation below keeps certificate, contributions and index at the front and the complete problem statement at the start of the main text. Match the departmental record if its prescribed front-matter order differs.

## Report ownership: suggested physical pages

| Page | Section | Lead | Required material |
|---|---|---|---|
| 1 | Certificate and team details | Member 4 | Department record certificate format, title, team names/roll numbers, faculty and signature fields. Include the short problem title/statement if the certificate format calls for it. |
| 2 | Contributions | Member 4 compiles; all verify | Actual tasks completed by each member; report sections and slide ranges. Do not mark unfinished work as completed. |
| 3 | Index | Member 4 | Section names and final page numbers, updated after layout. |
| 4 | Problem statement | Member 2 drafts; Member 4 edits | Shared-data concurrency problem, scope, question being investigated, distinction between normal XV6 and deliberately unlocked experimental variant. |
| 5 | Introduction: objectives and motivation | Member 4 | Definitions, simple lost-update example, motivation, objectives, shared-data inventory table checked by Member 3. |
| 6 | Existing system: background and drawbacks | Member 2 | Normal XV6 synchronization; allocator and scheduler context; consulted sources; consequences of removing protection. |
| 7 | Existing-system analysis: race scenarios | Member 2 | kalloc and kfree interleaving tables, plus scheduler or PID allocation comparison; causes and possible outcomes. |
| 8 | Proposed solution | Member 3 | Retain/restore existing XV6 locks; spinlock fields, atomic swap, memory ordering, interrupt disabling, lock mapping. |
| 9 | Working flow | Member 3 | Acquire-critical section-release diagram; exact critical-section descriptions; baseline-unlocked-restored experiment flow with Member 1 input. |
| 10 | Implementation: environment and test | Member 1 (you) | Source revision, environment, CPU count, commands, actual stress-program settings and checking logic, genuine baseline screenshot. |
| 11 | Implementation: removal, restoration and demo | Member 1 (you) | Actual diff, unlocked run screenshot, restored-lock screenshot, matching demo/video reference and short captions. |
| 12 | Results | Member 1 writes; Member 2 reviews | Per-run results table, phase comparison, actual observations, theoretical explanation, limitations relevant to results. |
| 13 | Conclusion: learning, applications and future scope | Member 4 drafts; all review | Conclusion tied to real results, lessons learned, applications to OS shared resources, realistic extensions and untested areas. |
| 14 | References | Member 4 compiles; all supply sources | Only sources actually consulted; source revision and specific files; book/course links where consulted; consistent departmental citation style. |

Member 4 assembles and formats the final document; each member writes their own technical section. Page count reflects diagrams and evidence, not contribution percentages. If page 7 or page 11 becomes crowded, allow extra report pages rather than shrinking required text. No report page cap is stated in the supplied guidelines.

## Report boilerplate

### Page 1: Certificate and team details

[Use the department's approved record certificate layout and wording. Do not substitute invented certification language.]

Institution: [institution]

Department: [department]

Course: Operating Systems

Case Study 14: Race Condition in XV6 Shared Data

Team: [team name, if required]

Members: [names and roll numbers]

Submitted to: [faculty's official name/designation]

Academic year/semester: [details]

[Prescribed date, signature and approval fields]

### Page 2: Contributions

Table 1: Team contributions [title above the table]

| Member / roll number | Actual work completed | Report section | PPT slides |
|---|---|---|---|
| Member 1: [name] | [Implementation, experiments, screenshots, demo and results actually completed] | Implementation; Results | 13-16 |
| Member 2: [name] | [Problem statement, background and race analysis actually completed] | Problem statement; Existing system; Race scenarios | 6-9 |
| Member 3: [name] | [Source verification, locking explanation and diagrams actually completed] | Proposed solution; Working flow | 10-12 |
| Member 4: [name] | [Foundations, front matter, conclusion and compilation actually completed] | Front matter; Introduction; Conclusion; References | 1-5, 17-18 |

Slide ownership means preparation responsibility. Members 2 and 4 can share presentation of the problem statement; the final speaking allocation should reflect actual contributions.

### Page 3: Index

| Section | Final page |
|---|---|
| Problem statement | [4] |
| Introduction: objectives and motivation | [5] |
| Existing system: background and drawbacks | [6] |
| Race scenario analysis | [7] |
| Proposed solution | [8] |
| Working flow | [9] |
| Implementation | [10-11] |
| Results | [12] |
| Conclusion: learning, applications and future scope | [13] |
| References | [14] |

### Page 4: Problem statement

XV6 supports concurrent kernel execution on multiple CPUs. Operations on shared kernel data need coordination so that concurrent accesses preserve the data structure's invariants. This case study investigates how removing synchronization from the physical-page allocator can lead to incorrect outcomes and how restoring locking protects the shared free list.

The practical scope is [verified XV6 revision] and the functions [verified functions]. The study compares the same workload under three conditions: original locking, deliberately removed locking, and restored locking. The scheduler or PID allocator is included as [source-level analysis only / separately tested, if actually tested].

### Page 5: Introduction, objectives and motivation

[Define race condition, critical section, mutual exclusion, atomicity and deadlock in connected prose. Explain a two-thread count++ lost update using load, add and store.]

The objectives are to identify shared data and its protecting locks, construct harmful two-CPU interleavings, understand the locking mechanism, and compare observed behaviour under controlled experimental conditions. The motivation is to connect synchronization theory with the kernel operations that manage memory and other shared resources.

Table 2: Shared kernel data and protecting locks

| Shared data | Source file | Verified lock | Reason for protection |
|---|---|---|---|
| Physical-page free list | [file] | [lock] | [one sentence] |
| Process state | [file] | [lock] | [one sentence] |
| PID counter | [file] | [lock] | [one sentence] |
| Buffer cache | [file] | [lock] | [one sentence] |
| [Other relevant structure] | [file] | [lock] | [one sentence] |

### Page 6: Existing system, background search and drawbacks

[Describe the normal locked XV6 implementation using the actual checkout and cite the sources consulted. Explain allocation/freeing and the roles of kmem.freelist and kmem.lock where verified.]

[Explain the failure modes of the deliberately unlocked experimental variant. Normal XV6 already contains locks: present retaining/restoring them as the case study's solution, rather than claiming to invent synchronization or claiming the standard allocator is unprotected. Discuss spinlock waiting cost only where relevant and supported.]

### Page 7: Race scenario analysis

Table 3: Possible kalloc interleaving without synchronization

| Step | CPU 0 operation | CPU 1 operation | Free-list state / consequence |
|---|---|---|---|
| [1] | [statement] | [statement or blank] | [state] |
| [2...] | [statement] | [statement] | [state] |

[Explain possible double allocation. Add a separate kfree table showing a lost page, and one scheduler or PID scenario. State which accesses and locks were verified. These are theoretical possible interleavings, not experimental observations.]

Table 4: Incorrect outcomes and prevention

| Possible outcome | Cause and critical step | Protecting lock | Why it prevents the scenario |
|---|---|---|---|
| [Double allocation] | [details] | [verified lock] | [explanation] |
| [Lost free page] | [details] | [verified lock] | [explanation] |
| [Additional scenario] | [details] | [verified lock] | [explanation] |

### Page 8: Proposed solution

[Explain how retaining/restoring the original locks serializes the relevant critical sections. Describe struct spinlock, acquire, release, atomic test-and-set, memory fences, holding checks and nested interrupt disabling using the checked-out source.]

[Explain that all relevant accesses must follow the same locking discipline. Include a brief distinction between spinlocks and sleep-locks and why lock ordering matters.]

### Page 9: Working flow

[Insert a readable diagram: request -> disable local interrupts -> atomic acquisition loop -> critical section -> memory-ordering/release steps -> restore interrupt state as appropriate. Match exact order to source.]

Figure 1: Spinlock acquisition and release flow [caption below figure]

[Describe critical-section boundaries in kalloc, kfree and scheduler using function/statement names. Use line numbers only from the group's fixed revision.]

[Insert experiment flow: fixed revision and workload -> locked baseline -> remove allocator locking -> repeat workload -> restore original locking -> repeat workload -> compare every run.]

Figure 2: Experimental comparison workflow

### Page 10: Implementation environment and test

The experiment used [host/WSL/Linux environment], [QEMU/toolchain versions where recorded], XV6 revision [commit], and [CPU count] virtual CPUs. The workload used [children], [pages], and [iterations], with memory checked by [actual checking method].

[Explain the actual program and its failure checks. Include only commands that were actually used and the exact test parameters. Brief source excerpts may be included if readable; keep the complete source in the evidence folder.]

[Insert genuine baseline setup/run screenshot.]

Figure 3: [Command and baseline run shown]

### Page 11: Implementation changes, restoration and demo

[Describe exactly which acquire/release calls were removed, and insert the genuine diff screenshot.]

Figure 4: Deliberate allocator-lock removal in revision [revision]

[Insert a genuine unlocked-run screenshot and describe only the visible output.]

Figure 5: Unlocked experiment run [run ID]

[Insert restored-code or diff evidence and explain the rebuild/retest.]

Figure 6: Restored allocator synchronization

Demo video: [filename/link and location]. The recording should show the revision/setup, test, relevant changes, actual output and restoration. Keep any instrumented race-window experiment separate and explicitly labelled.

### Page 12: Results

Table 5: Recorded results for every experiment run

| Run ID | CPUs | Workload/settings | Lock condition | Actual observation | Evidence ID |
|---|---|---|---|---|---|
| [B01] | [n] | [settings] | Original | [real result] | [screenshot/log] |
| [U01] | [n] | [same settings] | Removed | [real result] | [screenshot/log] |
| [R01] | [n] | [same settings] | Restored | [real result] | [screenshot/log] |

[Add every actual run; do not retain only failures. If the table spans pages, continue it using the department's format.]

With locking present, [observed outcome and actual count]. With allocator locking removed, [observed outcome and count]. After restoration, [observed outcome and count]. [Explain how the observations relate to Member 2's possible interleavings without claiming an exact internal cause that the evidence does not establish.]

The results apply to [revision, workload, CPUs and number of runs]. An unlocked pass does not establish safety, because a harmful interleaving may not occur in every run. Successful locked tests provide evidence for the tested conditions rather than a general proof. [State additional untested conditions and any instrumentation.]

### Page 13: Conclusion, learning, applications and future scope

This case study connected shared-data invariants with the need for mutual exclusion in a multi-CPU kernel. The experiment observed [actual result], while the source analysis explained [verified mechanism]. [Tie the conclusion to the evidence and avoid inserting an assumed failure.]

[Explain learning: atomic read-modify-write, consistent locking, interrupt handling, race versus deadlock. Explain applications to kernel memory allocation and other shared OS resources. Describe future scope such as larger workloads, additional CPU counts, a separately investigated shared structure, or measuring lock contention. Clearly label future work as not yet performed.]

### Page 14: References

[Use the department's required reference style and only sources actually consulted.]

[1] [XV6 repository, exact revision, files examined, URL and access date if required.]

[2] [XV6 RISC-V book, edition/chapter actually read, URL and access date if required.]

[3] [Any additional course or technical reference actually used.]

## PPT boilerplate: 18 slides total

All slides use a simple white background and short text. The limits on report font sizes are stated in the report notes; they do not establish 12-point slide text. Use large, readable slide text. Recommendations such as 3-4 short points per slide are design choices, not extra faculty rules. Keep code excerpts and screenshots readable, and move detailed explanations into spoken notes.

| Slide | Title | Owner | Suggested visible content / visual |
|---|---|---|---|
| 1 | Race Condition in XV6 Shared Data | Member 4 | Course, case study number, team names and roll numbers, faculty. |
| 2 | Problem Statement | Member 4, technical draft from Member 2 | Shared kernel data; concurrent updates; investigate removed versus restored synchronization. |
| 3 | Introduction and Motivation | Member 4 | Why CPUs share data; lost-update count++ mini-diagram; why correctness matters. |
| 4 | Objectives | Member 4 | Identify data/locks; explain races; understand spinlocks; compare observed results. |
| 5 | Shared Data in XV6 | Member 4; Member 3 verifies | Compact table of 4-5 structures, files and locks. Title above table. |
| 6 | Existing System and Drawbacks | Member 2 | Normal XV6 has locks; experimental removal exposes interleavings; brief background-source citations. |
| 7 | kalloc Race: Double Allocation | Member 2 | Two-CPU timeline showing a possible same-page allocation; label as theoretical. |
| 8 | kfree Race: Lost Page | Member 2 | Two-CPU timeline showing overwritten free-list head and lost page; label as theoretical. |
| 9 | Another Shared-Data Race | Member 2 | Scheduler or PID allocation interleaving and its protecting lock; state analysis-only if untested. |
| 10 | Proposed Solution | Member 3 | Retain/restore existing locks; one CPU per critical section; relevant lock-to-data mapping. |
| 11 | How the Spinlock Works | Member 3 | Atomic acquisition; interrupt handling; memory ordering; release. One mechanism diagram. |
| 12 | Working Flow | Member 3 | Acquire -> critical section -> release; compact baseline -> unlocked -> restored experiment flow. |
| 13 | Implementation: Setup and Test | Member 1 | Actual revision, CPUs, workload parameters, memory-check logic, readable setup screenshot. |
| 14 | Implementation: Lock Removal and Restoration | Member 1 | Actual diff/restoration evidence and very short captions. |
| 15 | Implementation Demo | Member 1 | Readable real output plus working local demo-video link/embedded clip. Verify playback before presenting. |
| 16 | Results | Member 1; Member 2 reviews | Compact actual baseline/unlocked/restored comparison, run counts and limitation. Full per-run data remains in report/evidence. |
| 17 | Conclusion, Applications and Future Scope | Member 4; all review | Actual finding, learning, OS applications and realistic future work. |
| 18 | References | Member 4 | Only sources actually used, in readable concise form. |

## Evidence and handoff

Member 1 gives Members 2 and 4 the fixed revision, test code and parameters, exact commands, original/removed/restored lock evidence, all run results, screenshots and demo video. Member 2 checks that theory and result interpretation agree. Member 3 verifies source details and diagrams. Member 4 assembles the report/PPT, updates page numbers, checks captions/references, and prepares the hard copy. All members verify their contribution entries and understand the experiment.

Before submission, replace all placeholders; verify that every required heading is present in order, the deck stays at 20 slides or fewer, the video plays, captions are positioned correctly, report paragraphs are justified in the required font sizes, and the allocator code has been restored.
