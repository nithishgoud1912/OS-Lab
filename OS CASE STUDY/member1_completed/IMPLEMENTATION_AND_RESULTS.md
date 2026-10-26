# Member 1: completed implementation and experiment

Date: 24 October 2026. All results below come from actual QEMU execution on this PC.

Language update: the guest workload and kernel changes were already C. Host Python helpers have now been replaced by `member1_tools.c`; see `FROM_SCRATCH_C.md`. This document preserves the original measured run set. Fresh runs collected by the C helper are separate in `c_validation/`.

## Eight completed steps

1. Built and booted unchanged xv6; `echo hello xv6` and `usertests -q` ran. See `evidence/00-normal-sanity.txt` for the final sanity result.
2. Checked allocator and synchronization source in the fixed revision. `kmem.freelist` is the shared page list; `kmem.lock` serializes list changes in both `kalloc()` and `kfree()`.
3. Added `user/race_test.c` and its `UPROGS` entry; rebuilt and passed the separate locked smoke check (`01-locked-smoke.txt`).
4. Saved original allocator, source revision, test hash, Makefile, environment and protocol before measured attempts.
5. Completed A01–A10 with original locking, one fresh guest per attempt.
6. Commented out only four allocator acquire/release calls, rebuilt, and completed B01–B10 with the identical test.
7. Restored the exact original allocator, verified its checksum and empty Git diff, rebuilt, and completed C01–C10.
8. Compiled every observation, selected evidence figures, terminal recordings and a demonstration walkthrough. The final kernel is restored and rebuilt.

## Environment and method

Ubuntu 24.04 under WSL2, QEMU 8.2.2, RISC-V GCC 13.3.0. Source revision: `f780d7850765d74cbdcd1fff4b822d8829f7c9bd`. Working repository: `/home/nithish/xv6-member1` in Ubuntu-24.04. QEMU used 128 MiB RAM and four virtual CPUs. The test used four child processes, each allocating eight 4096-byte pages per round for 200 rounds. Each child writes a distinct byte tag to every byte, waits briefly in user space, verifies every byte, and releases the allocation. A pipe gates worker startup. The parent checks child exit statuses and reports the summary.

The checked `sbrk()` wrapper uses eager allocation. Growth reaches `sys_sbrk → growproc → uvmalloc → kalloc`; shrinking reaches `uvmdealloc/uvmunmap → kfree`. Fork and exit also exercise the allocator. Equal user virtual addresses are not evidence of double physical-page allocation.

Each attempt uses a fresh QEMU guest and one test invocation. Fixed limits were 30 seconds to reach the shell and 60 seconds after issuing the stress command. Recorded elapsed time includes approximately 0.4–0.7 seconds of output collection after a detected result, so it is not a performance benchmark. Panics end an attempt after diagnostics are collected. Any host timeout is reported as TIMEOUT, never automatically as deadlock. Sanity and smoke checks are excluded from the 30 attempts. There was no kernel timing instrumentation.

## Results

| Phase | Attempts | Reached shell | Test started | PASS | Other outcomes |
|---|---:|---:|---:|---:|---|
| locked | 10 | 10 | 10 | 10 | None |
| unlocked | 10 | 10 | 10 | 0 | PANIC_OR_TRAP: 4, CORRUPTION: 3, TEST_FAILURE: 2, TIMEOUT: 1 |
| restored | 10 | 10 | 10 | 10 | None |

The unlocked variant produced 10 non-PASS outcomes in 10 attempts. The phase comparison supports the need for the original locking discipline under this workload; the raw diagnostics do not establish the exact internal interleaving.

| Attempt | Outcome | Seconds | Exact message |
|---|---|---:|---|
| A01 | PASS | 0.646 | race_test: PASS (all 4 children completed) |
| A02 | PASS | 0.65 | race_test: PASS (all 4 children completed) |
| A03 | PASS | 0.647 | race_test: PASS (all 4 children completed) |
| A04 | PASS | 0.642 | race_test: PASS (all 4 children completed) |
| A05 | PASS | 0.655 | race_test: PASS (all 4 children completed) |
| A06 | PASS | 0.639 | race_test: PASS (all 4 children completed) |
| A07 | PASS | 0.634 | race_test: PASS (all 4 children completed) |
| A08 | PASS | 0.645 | race_test: PASS (all 4 children completed) |
| A09 | PASS | 0.643 | race_test: PASS (all 4 children completed) |
| A10 | PASS | 0.654 | race_test: PASS (all 4 children completed) |
| B01 | PANIC_OR_TRAP | 0.875 | panic: kerneltrap |
| B02 | CORRUPTION | 0.891 | child 2: CORRUPTION round=2 offset=0 expected=3 got=4 |
| B03 | PANIC_OR_TRAP | 0.899 | panic: child 2: COkerneltrap |
| B04 | PANIC_OR_TRAP | 0.879 | panic: kerneltrap |
| B05 | CORRUPTION | 0.906 | rcahciled 3:_ CORRUPTION round=31 offset=20480 expected=4 got=0 |
| B06 | CORRUPTION | 0.902 |  2: CORRUPTION round=2 offset=28672 expected=3 got=2 |
| B07 | TEST_FAILURE | 0.947 | race_test: FAIL (2 child failures; setup_failed=0) |
| B08 | TEST_FAILURE | 0.945 | race_test: FAIL (2 child failures; setup_failed=0) |
| B09 | PANIC_OR_TRAP | 0.877 | panic: scause=0xd sepc=0x80000aca stval=0x505050505050505 |
| B10 | TIMEOUT | 60.137 | Host limit reached: 60 seconds |
| C01 | PASS | 0.648 | race_test: PASS (all 4 children completed) |
| C02 | PASS | 0.651 | race_test: PASS (all 4 children completed) |
| C03 | PASS | 0.661 | race_test: PASS (all 4 children completed) |
| C04 | PASS | 0.648 | race_test: PASS (all 4 children completed) |
| C05 | PASS | 0.64 | race_test: PASS (all 4 children completed) |
| C06 | PASS | 0.636 | race_test: PASS (all 4 children completed) |
| C07 | PASS | 0.652 | race_test: PASS (all 4 children completed) |
| C08 | PASS | 0.645 | race_test: PASS (all 4 children completed) |
| C09 | PASS | 0.647 | race_test: PASS (all 4 children completed) |
| C10 | PASS | 0.658 | race_test: PASS (all 4 children completed) |

Console output can interleave across CPUs. B03 contains a split corruption message alongside a panic; its primary outcome remains PANIC_OR_TRAP. B07/B08 show allocation failures. B10 emitted trap diagnostics and split panic fragments, then reached the host timeout; it is counted once as TIMEOUT. See CSV notes and raw logs rather than reconstructing ambiguous text.

## Source explanation and limits

Without locking, two allocating CPUs can both read the same free-list head before either advances it, potentially returning the same physical page twice. Two concurrent frees can overwrite the head update and lose a page. These are possible source-level interleavings, not a trace of the exact instructions executed in a recorded failure.

The original acquire/release calls protect each free-list update as a critical section. This revision uses `__atomic_exchange_n(..., __ATOMIC_ACQUIRE)` for ownership and `__atomic_store_n(..., __ATOMIC_RELEASE)` for release. Nested local interrupt handling avoids some same-CPU re-entry problems; local interrupt disabling alone does not exclude another CPU. Removing the calls also removes their interrupt-handling effects where no outer lock is active, so this experiment does not independently isolate those effects.

A PASS detects no problem during that invocation; it does not prove correctness. The test can miss lost pages, damage outside its buffers, or overwritten corruption. A panic or trap can have several proximate causes. These results describe one workload on one QEMU/WSL environment, not every machine or schedule.

## Evidence and demonstration

`evidence/results.csv` contains all 30 original attempts. Every attempt has a raw `.txt` console log and a timed `.cast` recording. Use the C helper's `replay` command or read the raw logs directly. `demo-walkthrough.mp4` is a captioned walkthrough rendered from the original saved logs/source, not a screen recording. `figures/` contains readable rendered console/source evidence, not desktop screenshots. These pre-existing media artifacts are retained; their former Python generator and JavaScript replay page were removed. The raw logs and recordings are authoritative. No native desktop screenshots were captured by this workflow.

Backups and diffs: `kalloc.locked.c`, `kalloc.unlocked.c`, `B-lock-removal.diff`, `Makefile-change.diff`, `race_test.used.c`, `Makefile.used`, and hash checks are inside `evidence/`. Final restoration is proved by `restoration-check.txt` and the empty `final-restoration.diff`. The final build log is `final-restored-build.txt`.

## Team handoff

Member 2: use the actual failure messages and removal diff when relating observations to possible interleavings. Member 3: explain locking from the fixed revision, whose atomic builtins differ from older xv6 examples. Member 4: use the complete results CSV and selected figures, preserve their captions, and integrate this implementation text into the faculty report/PPT format. Team names, certificate, signatures, final report formatting and presentation assembly remain team work.

## Reopen the completed implementation

In PowerShell, run `wsl -d Ubuntu-24.04`. In Ubuntu, run `cd ~/xv6-member1` then `make qemu CPUS=4`. In xv6, run `race_test`. Exit using Ctrl+A, then X. The current allocator has its original locks. These additional interactive runs are separate from the frozen 30-attempt results.

## Source references

The checked local source is the authority for this experiment: `kernel/kalloc.c`, `kernel/spinlock.c`, `user/ulib.c`, `kernel/sysproc.c`, `kernel/proc.c`, and `kernel/vm.c`, at the revision above. Upstream revision: https://github.com/mit-pdos/xv6-riscv/tree/f780d7850765d74cbdcd1fff4b822d8829f7c9bd. Local requirements: `XV6_Race_Condition_Common_Foundation_Guide.pdf`, `XV6_Race_Condition_Four_Member_Division.pdf`, and `member1_xv6_guide/XV6_MEMBER1_FROM_ZERO.md`. The existing guide specifies the 10/10/10 protocol and ownership used here.
