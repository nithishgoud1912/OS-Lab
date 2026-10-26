# Member 1: xv6 from zero to a complete race-condition experiment

Prepared for the two case-study PDFs in this project folder. Date: 24 October 2026.

## 1. Your actual task

You are the practical lead. You must demonstrate what happens to xv6's physical-memory allocator when its free-list lock is removed, and compare that with the normal and restored kernel.

Your experimental sequence is:

**Normal locked kernel → concurrent memory test → remove allocator locking → same test → restore original locking → same test again.**

Produce source files, real terminal logs/screenshots, a table covering every attempt, and an explanation of the observations. The division document asks for at least 10 attempts per main phase: 30 total. Member 2 explains interleavings, Member 3 explains lock internals, and Member 4 compiles the report. You should understand their explanations, but you do not have to implement scheduler changes or remove other locks.

This is an experiment on an existing OS mechanism. You are not building an OS from nothing or adding a new system call. Keep the original two PDFs unchanged.

## 2. Understand the setup before typing commands

An **operating-system kernel** manages processors, memory, devices, and processes. **xv6** is a small Unix-like teaching OS written largely in C. Use **xv6-riscv**, the RISC-V version maintained by MIT. Avoid mixing it with old x86 tutorials: their file locations, interfaces, and locking can differ. [Official repository](https://github.com/mit-pdos/xv6-riscv)

Your Windows PC normally executes x86-64 programs. The cross-compiler builds RISC-V machine code; QEMU emulates a RISC-V computer that executes it. Ubuntu under WSL supplies the development tools.

```text
Windows
  └── Ubuntu 24.04 in WSL 2: edit C files, use Git, run make
        └── QEMU: emulated RISC-V computer with 4 virtual CPUs
              └── xv6 kernel + xv6 shell + your race_test program
```

There are three command environments. Their commands are not interchangeable.

| Environment | How you recognize it | What you do there |
|---|---|---|
| Windows PowerShell | A prompt such as `PS C:\...>` | Start/check WSL |
| Ubuntu shell | A prompt often containing `name@machine:...$` | Edit source, `git`, `make`, `nano`, `script` |
| xv6 shell inside QEMU | After the boot messages, normally a plain `$` | Run `ls`, `echo`, `usertests`, `race_test` |

Do not copy prompt characters into commands. Code blocks below contain commands only. A plain `$` is not sufficient to identify the shell: check whether you have just started QEMU.

**You edit and compile outside xv6, then execute the resulting program inside xv6.** There is no need to find a C compiler or a graphical editor inside xv6.

### The minimum C you need

`struct` groups fields; a pointer stores an address; `r->next` accesses a field through a pointer. `if (r)` tests that `r` is nonzero. `for` repeats statements. A return value reports success/failure or returns an address. You should be able to follow these ideas before explaining the allocator.

### The vocabulary you need

| Term | Meaning in this project |
|---|---|
| Process | A running program with its own address space and execution state |
| CPU/core | An execution engine; multiple virtual CPUs can execute guest kernel code concurrently |
| Shared data | Data accessible to more than one execution context; here, the kernel free list |
| Race condition | Incorrect behavior that depends on how concurrent operations overlap |
| Critical section | The sequence of accesses to shared data that needs coordinated protection |
| Mutual exclusion | At most one execution context enters the protected section at a time |
| Spinlock | A lock whose contenders repeatedly check/spin until one can acquire ownership |
| Atomic operation | An operation that other CPUs cannot observe as separable intermediate steps |
| Synchronization | Coordination of concurrent operations so their accesses obey required rules |
| Virtual address | An address used by a process, translated through its page table |
| Physical page | Actual guest RAM backing a mapping; a separate concept from its virtual address |
| Memory corruption | Stored data unexpectedly changes or is overwritten incorrectly |
| Deadlock | Execution contexts cannot progress because their resource/lock waits cannot be resolved |

For example, two workers incrementing a shared 5 can both read 5 and both write 6; the intended total was 7. Your allocator experiment studies a similar multi-step update, applied to list pointers rather than a counter.

## 3. Start Ubuntu on your PC

I checked your local setup: `Ubuntu-24.04` is already installed as WSL version 2. Its RISC-V GCC, QEMU, Git, make, and bc commands are present. The checked compiler was GCC 13.3.0 and QEMU was 8.2.2. You can start with this existing environment.

In **PowerShell**:

```powershell
wsl --list --verbose
wsl -d Ubuntu-24.04
```

The second command opens Ubuntu. In **Ubuntu**, check:

```bash
cat /etc/os-release
qemu-system-riscv64 --version
riscv64-linux-gnu-gcc --version
make --version
```

If using a different Windows PC with no installation, install Ubuntu 24.04 from an administrator PowerShell, restart if requested, and complete its first-launch Linux username/password setup:

```powershell
wsl --install -d Ubuntu-24.04
```

Then verify version 2 with `wsl --list --verbose`. Installation reference: [Microsoft WSL instructions](https://learn.microsoft.com/en-us/windows/wsl/install).

If tools are missing, run this in **Ubuntu**, not PowerShell or xv6:

```bash
sudo apt update
sudo apt install git build-essential gdb-multiarch qemu-system-misc gcc-riscv64-linux-gnu binutils-riscv64-linux-gnu bc perl nano util-linux
```

`sudo` may ask for your Linux password. Password characters are not displayed while you type. These packages include the compiler, emulator, debugger, build tools, editor, and terminal recorder. MIT recommends Ubuntu 24 or later and QEMU 7.2 or later for its 2025 environment. The repository's own Makefile remains authoritative for a particular checkout. [MIT tool setup](https://pdos.csail.mit.edu/6.1810/2025/tools.html)

## 4. Get one fixed xv6 revision

In **Ubuntu**, place the working repository in your Linux home directory:

```bash
cd ~
git clone https://github.com/mit-pdos/xv6-riscv.git xv6-member1
cd ~/xv6-member1
git checkout --detach f780d7850765d74cbdcd1fff4b822d8829f7c9bd
git switch -c member1-race-study
mkdir -p evidence
git rev-parse HEAD > evidence/revision.txt
git log -1 --format='%H %cd %s'
```

The commit above is the upstream version used to build and smoke-test the supplied program. Pinning it makes this guide reproducible; it is not a claim about the newest revision in the future. If faculty has assigned a different repository/revision, use that instead and verify its interfaces. All four members must use the same revision.

If `xv6-member1` already exists, inspect it before reusing it; do not overwrite existing work. You can choose another unused folder name and adjust later `cd` commands.

Useful Ubuntu basics:

| Command | Meaning |
|---|---|
| `pwd` | Show current folder |
| `ls` | List files |
| `cd ~/xv6-member1` | Go to your xv6 repository |
| `cat file` | Print a short file |
| `less file` | Scroll through a file; `q` exits |
| `nano file` | Open an editor |
| `git status --short` | See new/changed files |
| `git diff -- kernel/kalloc.c` | Show changes to the allocator |

In nano, save with **Ctrl+O**, press **Enter**, then exit with **Ctrl+X**. Inside nano these keys control the editor, not QEMU.

## 5. Build and boot an unchanged kernel first

In **Ubuntu**, at the repository root:

```bash
make qemu CPUS=4
```

`make` builds the kernel and user programs, creates the xv6 filesystem image, and starts QEMU. `CPUS=4` selects four emulated CPUs; four child processes alone do not set the CPU count. Check the printed QEMU command includes `-smp 4`.

After booting, **inside xv6** run:

```text
ls
echo hello xv6
cat README
usertests -q
```

These are learning/sanity commands, not your measured race experiment. `usertests -q` runs the quick subset in the verified revision; it can still take a while. Some tests intentionally provoke trap messages, so read the test's final result rather than treating every diagnostic as a failure. [Official usertests source](https://github.com/mit-pdos/xv6-riscv/blob/f780d7850765d74cbdcd1fff4b822d8829f7c9bd/user/usertests.c)

If the normal kernel cannot pass its sanity check, fix that before removing any lock.

To leave QEMU, press **Ctrl+A**, release both keys, then press **X**. This exits the emulator and returns you to Ubuntu. It is a sequence, not Ctrl+A+X held together. `exit` inside an xv6 shell does not shut down the emulator. Ctrl+C is not the reliable QEMU exit command.

**Checkpoint:** You can start xv6, run its commands, and return to Ubuntu.

## 6. Read only the source paths that matter first

From the **Ubuntu repository root**:

```bash
less kernel/kalloc.c
less kernel/spinlock.c
less user/user.h
less kernel/sysproc.c
```

| File | What to understand for your experiment |
|---|---|
| `kernel/kalloc.c` | The free list, `kalloc()`, `kfree()`, and `kmem.lock` |
| `kernel/spinlock.h`, `kernel/spinlock.c` | Lock fields; acquire/release and interrupt handling |
| `user/user.h` | User-visible signatures for `fork`, `wait`, `sbrk`, `printf` |
| `user/ulib.c`, `user/usys.pl` | Library wrappers and generated system-call entry stubs |
| `kernel/sysproc.c` | Kernel handler for the memory-growth system call |
| `kernel/proc.c` | `growproc()` and process creation/cleanup |
| `kernel/vm.c` | User-memory allocation/deallocation and calls into the allocator |
| `Makefile` | `UPROGS`, build rules, QEMU CPU setting |

You do not need to understand every boot assembly instruction to conduct this case study.

### Trace what your test really exercises

For an eager positive `sbrk()` request, follow this path in the pinned revision:

```text
race_test calls sbrk(+32768)
  → user library/system-call entry
  → sys_sbrk()
  → growproc()
  → uvmalloc()
  → kalloc() for physical pages

race_test calls sbrk(-32768)
  → sys_sbrk()
  → growproc()
  → uvmdealloc() / uvmunmap()
  → kfree() returns physical pages
```

There can also be page-table allocations. Forking and process exit create additional allocator activity. Thus the test stresses the allocator through several legitimate paths, not exclusively `sbrk()`.

The checked version's public `sbrk(int)` wrapper uses eager allocation; `sbrklazy(int)` is separate. If your faculty uses a lazy-allocation version, writing the allocated memory may be what triggers physical allocation. The supplied test touches all its requested bytes. [User library](https://github.com/mit-pdos/xv6-riscv/blob/f780d7850765d74cbdcd1fff4b822d8829f7c9bd/user/ulib.c), [system-call handler](https://github.com/mit-pdos/xv6-riscv/blob/f780d7850765d74cbdcd1fff4b822d8829f7c9bd/kernel/sysproc.c), [virtual memory code](https://github.com/mit-pdos/xv6-riscv/blob/f780d7850765d74cbdcd1fff4b822d8829f7c9bd/kernel/vm.c).

## 7. Understand the free-list race

A **page** here is 4096 bytes of physical memory. Free pages are linked together. The first bytes of each free page hold its `next` pointer. `kmem.freelist` points to the head.

```text
kmem.freelist → page A → page B → page C → null
```

`kalloc()` removes the head and returns it. `kfree()` puts a page at the head. `kmem.lock` protects the linked-list update. Two concurrent unprotected allocations can both select A. Two concurrent unprotected frees can overwrite the head update and lose one page. The lock serializes each whole update. [Allocator source](https://github.com/mit-pdos/xv6-riscv/blob/f780d7850765d74cbdcd1fff4b822d8829f7c9bd/kernel/kalloc.c)

Example allocation interleaving, assuming both CPUs finish reading the next pointer before the page is overwritten:

| Step | CPU 0 | CPU 1 | List head |
|---|---|---|---|
| 1 | Read A as head | | A |
| 2 | | Read A as head | A |
| 3 | Advance head to B | | B |
| 4 | | Advance head to B | B |
| 5 | Return A | Return A | B |

Both callers receive one physical page. Other interleavings can damage pointers more severely. A user-space tag mismatch can reveal memory corruption, but it cannot itself tell you the exact internal interleaving that happened.

The spinlock uses an atomic operation to choose one owner, memory ordering to keep the protected accesses inside the lock boundary, and local interrupt disabling to avoid certain same-CPU deadlocks. Interrupt disabling alone does not exclude another CPU. The current checked source uses `__atomic_exchange_n` / `__atomic_store_n`; the PDFs illustrate an older `__sync_*` form. Explain the code in your actual checkout. [Spinlock source](https://github.com/mit-pdos/xv6-riscv/blob/f780d7850765d74cbdcd1fff4b822d8829f7c9bd/kernel/spinlock.c)

## 8. Add the supplied stress program

The complete source is `race_test.c` next to this guide and is reproduced in the appendix. It is an xv6 user program, not a normal Linux executable.

In **Ubuntu**:

```bash
cd ~/xv6-member1
cp '/mnt/c/Users/HP/Documents/OS record/OS CASE STUDY/member1_xv6_guide/race_test.c' user/race_test.c
nano Makefile
```

Find `UPROGS=\` and insert this line among its entries, preserving a real tab at the beginning and the backslash at the end:

```makefile
	$U/_race_test\
```

For example, the beginning can be:

```makefile
UPROGS=\
	$U/_race_test\
	$U/_cat\
	$U/_echo\
```

Keep the remaining existing entries. The underscore is part of the host build filename; inside xv6 the command is `race_test`, without `.c` or a leading underscore. No new system call is needed because the program uses existing ones.

Build it in **Ubuntu**:

```bash
make -j4 kernel/kernel fs.img
make qemu CPUS=4
```

Inside **xv6**:

```text
race_test
```

The normal success-message format is:

```text
race_test: children=4 pages=8 rounds=200
race_test: PASS (all 4 children completed)
```

That is the program's message format, not a result to paste into your results sheet without running it. Exit QEMU when finished.

### What each part of the program does

1. The parent creates a pipe used as a start gate.
2. It creates four child processes with `fork()`. A child gets return value 0; the parent gets the child's PID; -1 means failure.
3. Each child reads one gate byte. The parent releases the workers after creating them all. This encourages overlapping execution but does not guarantee simultaneous instructions on four CPUs.
4. In each of 200 rounds, a worker requests 8 pages: `8 × 4096 = 32768` bytes.
5. It writes its own distinct byte tag into every byte, waits briefly in user space, then checks every byte.
6. It returns the memory using negative `sbrk()` and repeats.
7. It exits with success or failure. The parent uses `wait(&status)` to collect all created children and prints the final result.

The program checks allocation, shrink, pipe, fork, and wait failures. `volatile` makes verification reload the memory; it is not a synchronization mechanism. The delay in the worker does not modify the kernel or widen its free-list critical section.

Each child requests only 32 KiB at a time; the four workers together request 128 KiB of test regions. Their other memory and kernel structures consume additional memory. The main test uses 800 allocation/free rounds in total, plus setup and cleanup activity.

Virtual addresses can be identical in different child processes without an error. The bug concerns incorrectly shared **physical** pages. Printing equal user pointers is not evidence of double allocation.

**Checkpoint:** The supplied test builds and completes in the normal kernel. Do not start the destructive variant before this works.

## 9. Freeze the test and prepare the evidence

In **Ubuntu**:

```bash
cd ~/xv6-member1
git diff -- kernel/kalloc.c
cp kernel/kalloc.c evidence/kalloc.locked.c
cp user/race_test.c evidence/race_test.used.c
cp Makefile evidence/Makefile.used
sha256sum user/race_test.c > evidence/test.sha256
sha256sum kernel/kalloc.c > evidence/allocator-original.sha256
git diff -- Makefile > evidence/Makefile-change.diff
cp '/mnt/c/Users/HP/Documents/OS record/OS CASE STUDY/member1_xv6_guide/results_template.csv' evidence/results.csv
```

At this point the first `git diff` should show no allocator changes. If it shows changes, understand them before establishing your baseline. The backup must be the known-good locked allocator, not an already modified file.

Write these fixed settings above your results table:

- Original repository commit.
- QEMU version and compiler version.
- CPU count: 4.
- Worker count: 4; pages per worker: 8; rounds: 200.
- Unchanged test source hash.
- One stress invocation per fresh QEMU boot.
- An agreed timeout, for example 60 seconds after issuing `race_test` if the healthy test finishes comfortably sooner; otherwise choose a larger limit before measured runs. Define a boot timeout too.

One fresh boot per attempt avoids carrying corrupt allocator state into the next attempt. If you choose repeated invocations in one boot instead, treat that as a different protocol and disclose it consistently.

## 10. Phase A: 10 baseline attempts with the lock present

Use `script` to save the whole terminal session on the Ubuntu side. Do not rely on xv6 redirecting output to its own disk: a kernel panic can prevent that from finishing.

In **Ubuntu**:

```bash
script -q -c 'make qemu CPUS=4' evidence/A01-locked.txt
```

When the **xv6 shell** appears:

```text
race_test
```

Wait for completion. Take a screenshot that includes the command and result. Exit QEMU with Ctrl+A, then X. The `script` session ends and saves its transcript.

In **Ubuntu**, inspect the file:

```bash
cat evidence/A01-locked.txt
```

Repeat using `A02-locked.txt` through `A10-locked.txt`, one new QEMU boot and one test each time. Change the filename manually. Record each attempt immediately in `results.csv`.

The shell's return status for `make` or `script` is not your child's xv6 exit status. Use the program's summary and any kernel diagnostics. The minimal xv6 shell does not provide Bash's full status/loop conveniences.

If Phase A fails, investigate the test/setup first. A broken baseline cannot support a clean comparison.

## 11. Phase B: remove only the allocator's locking

Exit QEMU before editing. In **Ubuntu**:

```bash
nano kernel/kalloc.c
```

In **both** `kfree()` and `kalloc()`, comment out the acquire and release call for `kmem.lock`. Four calls in total must change.

The changed portion in `kfree()` should look like:

```c
// acquire(&kmem.lock);
r->next = kmem.freelist;
kmem.freelist = r;
// release(&kmem.lock);
```

The changed portion in `kalloc()` should look like:

```c
// acquire(&kmem.lock);
r = kmem.freelist;
if (r)
  kmem.freelist = r->next;
// release(&kmem.lock);
```

Keep the rest of the file as it was: sanity checks, `memset`, initialization, structure definition, and return values. Do not edit `kernel/spinlock.c` or remove scheduler, filesystem, or other locks. Removing only one side of an acquire/release pair produces a different error.

In **Ubuntu**, save the exact variant and its diff, then rebuild:

```bash
git diff -- kernel/kalloc.c
git diff -- kernel/kalloc.c > evidence/B-lock-removal.diff
cp kernel/kalloc.c evidence/kalloc.unlocked.c
make -j4 kernel/kernel fs.img
script -q -c 'make qemu CPUS=4' evidence/B01-unlocked.txt
```

Take a screenshot of the diff. Inside **xv6**, run `race_test` as before. Repeat for B01 through B10 with unchanged settings.

Possible observations include a clean PASS, a tag mismatch, allocation failure, process termination, a kernel panic, a timeout, or failure to reach the shell. Do not promise or fabricate any specific symptom.

### If xv6 panics, hangs, or fails before the test

1. Save a screenshot and preserve the host transcript.
2. Record whether it failed during boot, while starting the test, during memory checking, or during exit/cleanup.
3. Press Ctrl+A, then X to stop QEMU, even if the guest has stopped responding.
4. Start a fresh QEMU attempt using the same source and a new filename.

The OS itself uses `kalloc()`/`kfree()`, so a broken allocator can crash before the user test runs. Mark that attempt **boot failure; test not started**, rather than claiming the stress program detected corruption.

After a corrupted run, do not keep issuing commands in the same guest to see whether it recovers. Use the next fresh boot.

Commenting out these calls also removes their interrupt-disable/restore side effects at sites where no outer lock already disables interrupts. This experiment measures the effect of removing the allocator's normal locking discipline; it does not independently isolate every part of that discipline.

## 12. Phase C: restore exactly, rebuild, repeat

In **Ubuntu**, after exiting QEMU:

```bash
cp evidence/kalloc.locked.c kernel/kalloc.c
cmp kernel/kalloc.c evidence/kalloc.locked.c
git diff --exit-code -- kernel/kalloc.c
sha256sum -c evidence/allocator-original.sha256
sha256sum -c evidence/test.sha256
make -j4 kernel/kernel fs.img
script -q -c 'make qemu CPUS=4' evidence/C01-restored.txt
```

`cmp` and `git diff --exit-code` should be silent on success, and the checksum checks should report OK. The allocator diff must be empty relative to the original checked-out source. A plain `git status` will still show your added test and Makefile changes; those are expected.

Inside **xv6**, run `race_test`. Repeat C01 through C10. Take a source screenshot showing the four allocator lock calls restored and a screenshot of a restored run.

If restored runs still fail, verify the source/hash, rebuild, exit any old QEMU process, and start a new guest before interpreting the result. Editing source does not change an already running kernel.

**Checkpoint:** Original allocator restored; 30 attempts logged; all observations recorded.

## 13. What if all unlocked attempts pass?

That is a valid result. Report: **No failure was observed in the specified unlocked attempts. This does not establish correctness because the race requires a particular interleaving.** Keep the theoretical interleavings in the report as source-based explanations, separate from observations.

You can then create a separately named second experiment. Options are more rounds, more workers, or more CPUs within the `NCPU` limit in `kernel/param.h`. Change one parameter at a time, run a matching locked control, and record the new settings. Do not silently replace the original runs or combine their counts.

### Optional instrumented experiment: widen the kernel race window

Only after completing A/B/C, you may add a short delay immediately after the allocator reads the head. For example, in `kalloc()`:

```c
r = kmem.freelist;
for (volatile int d = 0; d < 1000; d++)
  asm volatile("nop" ::: "memory");
if (r)
  kmem.freelist = r->next;
```

Use this as a separate source variant, with its own diff, logs, timeout, and results. Compare a locked version with that delay against an unlocked version with the same delay. This modifies kernel timing, including during startup, and still does not guarantee a failure. Label every such result **instrumented**, not the natural uninstrumented race rate.

Never call `sleep()`, `yield()`, or print inside this critical section to force a schedule. Such changes can violate lock rules or introduce unrelated behavior. Restore the original allocator after any optional variant and verify it again.

## 14. Fill the table and interpret the evidence

The CSV next to this guide contains 30 blank observation rows, with phases and intended settings already identified. Empty outcome fields mean **not yet recorded**, not PASS. Open a copy in Excel or fill it as text.

Use these outcome categories as appropriate:

| Outcome | What you can claim |
|---|---|
| PASS | This invocation finished without a detected problem |
| CORRUPTION | The program read a byte different from its expected tag |
| TEST_FAILURE | A worker/setup/wait/allocation failure occurred; preserve its exact message |
| PANIC_OR_TRAP | Record the exact diagnostic and stage; do not invent its internal cause |
| TIMEOUT | It did not complete within the predefined limit; this alone does not prove deadlock |
| BOOT_FAILURE | The guest did not reach the test; count separately from completed tests |

Choose one primary outcome per attempt for counting and put other symptoms in notes. Record the exact transcript filename and screenshot filenames. A panic after a corruption message should not become two separate attempts.

For each phase summarize **attempts**, **tests started**, **completed PASS**, and other outcomes. Always state the denominator. Ten boots with three pre-test failures are not ten completed stress tests.

What this test can miss:

- Races that did not happen under the tested schedule.
- Lost free pages that do not cause failure within this workload.
- Shared-page writes that are overwritten again before checking.
- Allocator problems affecting unexamined memory or a different workload.

A failure appearing only after removing the lock supports the predicted mechanism, especially if the original and restored controls are healthy. A panic message alone does not prove the exact two-CPU interleaving. Passing controls provide experimental evidence, not a mathematical proof of correctness.

### Report paragraph template: fill only from your results

> We used xv6-riscv revision [commit] under QEMU [version] with [CPUs] virtual CPUs. The same test created [workers] children; each performed [rounds] rounds of growing its heap by [pages] pages, writing and checking a distinct pattern, and shrinking its heap. We recorded [A] baseline attempts, [B] unlocked attempts, and [C] restored attempts, using a fresh guest for each attempt. With the lock present we observed [actual counts]. With the four kmem.lock acquire/release calls removed we observed [actual counts, including pre-test failures]. After restoration we observed [actual counts]. These observations [interpretation justified by the data]. The test was timing-dependent and did not exhaustively detect allocator leaks or prove the absence of other races.

## 15. Troubleshooting

| Problem | What to check/do |
|---|---|
| `make` or the compiler is not found | You are in Ubuntu and the packages in section 3 are installed |
| Cannot infer toolchain prefix | Check `riscv64-linux-gnu-gcc --version`; try `make qemu CPUS=4 TOOLPREFIX=riscv64-linux-gnu-` |
| `bc: not found` | Install `bc` in Ubuntu; the checked Makefile uses it for a version check |
| QEMU version rejected | Read the Makefile requirement and install a supported version; do not bypass the check blindly |
| `make: No rule to make target qemu` | `pwd` should be your xv6 repository root containing its Makefile |
| `exec race_test failed` inside xv6 | Confirm `user/race_test.c`, the UPROGS entry, and successful filesystem-image rebuild; restart QEMU |
| Compiler cannot find `kernel/types.h` | Build using the xv6 Makefile at its root, not normal Linux gcc on the test alone |
| `printf` declaration error | Use `user/user.h`, not Linux `stdio.h`; current xv6 `printf` has no file-descriptor argument |
| Program shows FAIL without CORRUPTION | Read all earlier messages; resource/setup/process failures are also reported |
| Characters/output interleave | Multiple children can print concurrently; keep the raw log and use the parent's summary too |
| Unlocked kernel stops booting | Save the actual evidence; it is a pre-test failure, then exit/reboot or restore |
| A modified kernel seems unchanged | Exit old QEMU, rebuild, and boot again; inspect your diff and active folder |
| `fs.img` is locked by another process | Exit the other QEMU instance using that repository; use one instance per image |
| QEMU appears frozen | After the agreed timeout, capture evidence and use Ctrl+A, then X |
| Need a clean rebuild | Exit QEMU first; save logs outside guest disk; use `make clean` then rebuild. This recreates the guest filesystem image and removes files created only inside it |

If investigating a kernel fault further, a kernel address can be looked up with `riscv64-linux-gnu-addr2line -e kernel/kernel ADDRESS` using the binary built from that exact source. User-process fault addresses need the corresponding user binary instead. This is optional debugging, not a prerequisite for an honest report.

## 16. Collect the final handoff for your group

Your evidence folder should contain:

```text
evidence/
  revision.txt
  kalloc.locked.c
  kalloc.unlocked.c
  race_test.used.c
  Makefile.used
  test.sha256
  allocator-original.sha256
  Makefile-change.diff
  B-lock-removal.diff
  A01-locked.txt ... A10-locked.txt
  B01-unlocked.txt ... B10-unlocked.txt
  C01-restored.txt ... C10-restored.txt
  results.csv
  screenshots/
```

Create the screenshots folder in Ubuntu with `mkdir -p evidence/screenshots`. Use Windows Snipping Tool (Win+Shift+S), then save screenshots into that folder through Explorer. From the Ubuntu repository, `explorer.exe .` opens it in Windows Explorer; alternatively browse the WSL share. Ensure screenshots are readable and show actual commands/results.

The evidence is not complete until the logs and screenshot files actually exist and the CSV observations are filled. The template does not supply experimental results.

Give Member 2 your exact diff and observed symptoms. Give Member 3 the revision so the spinlock explanation matches. Give Member 4 the full results table, selected screenshots, method, and limitations. Keep the checked-out allocator locked at handoff.

## 17. Explain your work in the viva

**What did you implement?** An xv6 user program that runs concurrent allocation/free workloads and checks each child's memory, plus a controlled kernel-lock-removal experiment.

**Why not just call `kalloc()` in the test?** It is a kernel function, not a user API. User processes ask for memory through system calls.

**Why `sbrk()`?** It changes the process heap size. Growing and shrinking it reaches physical-page allocation and freeing in this version.

**Why not just use `malloc()` and `free()`?** The user allocator may reuse its own heap blocks; `free()` does not necessarily return pages to the kernel. Direct heap growth/shrink makes the kernel allocator workload clearer.

**Why both allocator functions?** Allocating and freeing both modify the same shared free list. They must follow the same lock discipline.

**Why four CPUs?** Different CPUs can execute kernel code simultaneously. Four processes on one CPU are not equivalent to four CPUs. A single CPU can still have concurrency through interrupts/preemption where applicable; a one-CPU pass does not establish safety.

**Why can the kernel crash before a tag mismatch?** The allocator also supplies memory for page tables and other kernel data, not just the user buffers checked by the test.

**Why can an unlocked run pass?** The dangerous operations may not overlap in that attempt, or the test may miss the damage.

**Is a timeout a deadlock?** It is an observation requiring investigation. Deadlock is one possible explanation; other failures or slow execution can also prevent completion.

**What restores correctness?** Restoring the allocator's original lock discipline ensures properly synchronized accesses to the free list; our repeat runs check that the original behavior returns under the tested workload.

Suggested short presentation:

> Our experiment targets xv6's shared physical-page free list. We ran a four-process memory-checking program on four virtual CPUs. We first measured the normal kernel, then removed the acquire/release calls in both allocator functions, then restored the original file. We kept the source revision and workload fixed and saved each attempt separately. The unlocked phase produced [real observations]; the baseline and restored phases produced [real observations]. The free-list interleavings explain why unsynchronized allocation can hand out one page twice or lose freed pages. Our measurements show [supported conclusion], with timing and detection limits.

## 18. Learn and perform this in manageable sessions

1. **First session:** Understand the three environments. Open Ubuntu, boot xv6, run simple shell commands, and exit QEMU.
2. **Second session:** Read `kalloc.c`; draw a three-page list and manually trace one allocation and one free. Explain the race without code.
3. **Third session:** Add the supplied test, build it, run it with normal locking, and explain every major block.
4. **Fourth session:** Save the known-good backup, freeze settings, and collect A/B/C attempts and evidence.
5. **Final session:** Verify restoration, fill the table, write the conclusion, and teach the result to your teammates.

Advance when you can explain the checkpoint, rather than treating the commands as a script to memorize.

## 19. Validation and sources

The supplied program was built with a fresh upstream checkout of commit `f780d7850765d74cbdcd1fff4b822d8829f7c9bd` and run successfully in a normal locked QEMU guest with four CPUs on the checked WSL environment. See `validation.txt`. This is a build/smoke check for the guide, not the required 30-attempt experiment. No unlocked comparison results have been supplied or prefilled.

Project requirements were taken from `XV6_Race_Condition_Common_Foundation_Guide.pdf` and `XV6_Race_Condition_Four_Member_Division.pdf` in the parent folder. Technical references are linked where used. For deeper study use MIT's [xv6 book](https://pdos.csail.mit.edu/6.1810/2025/xv6/book-riscv-rev5.pdf), especially operating-system interfaces, page tables, and locking. Check the actual source when book/PDF details differ from your checkout.

## Appendix: complete `user/race_test.c`

The following is the supplied source. Prefer copying the adjacent `.c` file to avoid formatting mistakes.

```c
// User-space stress test for the xv6-riscv physical-page allocator.
// Add $U/_race_test\ to UPROGS in the xv6 Makefile.
// This test detects some corruption; a PASS is not a proof of safety.
#include "kernel/types.h"
#include "kernel/stat.h"
#include "user/user.h"

#define NCHILD 4
#define NPAGES 8
#define ROUNDS 200
#define PAGE_BYTES 4096

static int
worker(int id)
{
  const int bytes = NPAGES * PAGE_BYTES;
  const uchar tag = (uchar)(id + 1);

  for (int round = 0; round < ROUNDS; round++) {
    char *allocation = sbrk(bytes);
    if (allocation == (char *)-1) {
      printf("child %d: allocation failed at round %d\n", id, round);
      return 1;
    }

    // Volatile forces the verification to read memory again.
    // It does not synchronize the kernel or fix the allocator race.
    volatile uchar *memory = (volatile uchar *)allocation;
    for (int offset = 0; offset < bytes; offset++)
      memory[offset] = tag;

    // User-space delay gives other workers an opportunity to overwrite
    // an incorrectly shared page. It is not a kernel race-window delay.
    for (volatile int delay = 0; delay < 20000; delay++)
      ;

    for (int offset = 0; offset < bytes; offset++) {
      int actual = memory[offset];
      if (actual != tag) {
        printf("child %d: CORRUPTION round=%d offset=%d expected=%d got=%d\n",
               id, round, offset, (int)tag, actual);
        // exit() will reclaim this child's remaining address space.
        return 1;
      }
    }

    if (sbrk(-bytes) == (char *)-1) {
      printf("child %d: shrink failed at round %d\n", id, round);
      return 1;
    }
  }
  return 0;
}

int
main(void)
{
  int gate[2];
  int started = 0;
  int setup_failed = 0;
  int bad = 0;

  printf("race_test: children=%d pages=%d rounds=%d\n",
         NCHILD, NPAGES, ROUNDS);

  if (pipe(gate) < 0) {
    printf("race_test: pipe setup failed\n");
    exit(1);
  }

  for (int id = 0; id < NCHILD; id++) {
    int pid = fork();
    if (pid < 0) {
      printf("race_test: fork failed after %d children\n", started);
      setup_failed = 1;
      break;
    }
    if (pid == 0) {
      char token;
      close(gate[1]);
      // Each child waits for one byte before starting its work.
      int received = read(gate[0], &token, 1);
      close(gate[0]);
      if (received != 1)
        exit(2);
      exit(worker(id));
    }
    started++;
  }

  close(gate[0]);
  if (!setup_failed) {
    char tokens[NCHILD];
    for (int i = 0; i < NCHILD; i++)
      tokens[i] = 'G';
    if (write(gate[1], tokens, NCHILD) != NCHILD) {
      printf("race_test: start gate failed\n");
      setup_failed = 1;
    }
  }
  // On setup failure, EOF lets already-created children exit.
  close(gate[1]);

  for (int i = 0; i < started; i++) {
    int status = -1;
    int pid = wait(&status);
    if (pid < 0) {
      printf("race_test: wait failed\n");
      setup_failed = 1;
      break;
    }
    if (status != 0) {
      printf("race_test: pid=%d failed status=%d\n", pid, status);
      bad++;
    }
  }

  if (setup_failed || bad || started != NCHILD) {
    printf("race_test: FAIL (%d child failures; setup_failed=%d)\n",
           bad, setup_failed);
    exit(1);
  }

  printf("race_test: PASS (all %d children completed)\n", NCHILD);
  exit(0);
}
```
