# xv6 race-condition case study — from scratch, in C

## What we are building

We are studying xv6's existing physical-memory allocator, not writing a new OS. The question is: what changes when we remove the lock protecting the shared list of free physical pages, and what happens when we restore it?

All project programs supplied for this case study are C. xv6 itself also contains upstream assembly, linker files and Makefiles needed to build an operating system; those are retained. Shell commands below launch tools rather than implement the experiment.

## Two C programs, two places to run them

| File | Runs where | Responsibility |
|---|---|---|
| `race_test.c` / `evidence/race_test.used.c` | Inside xv6 | Creates concurrent workers and checks their memory. This was already C in the original experiment. |
| `member1_tools.c` | Ubuntu under WSL | Builds xv6, launches QEMU, records attempts, restores the allocator, checks and packages results. This replaces the former Python helpers. |
| `kernel/kalloc.c` | xv6 kernel | Existing C allocator; only four lock calls are commented out in the unlocked variant. |

`race_test.c` must use xv6's headers and Makefile. It is not a normal Linux application. Compile the host helper with Ubuntu `cc`; the xv6 Makefile uses the RISC-V compiler for the guest code.

## Step 1 — install tools, then boot the original OS

On this PC Ubuntu-24.04, QEMU and the RISC-V toolchain were already available. From PowerShell:

```powershell
wsl -d Ubuntu-24.04
```

On a new Ubuntu installation, the required packages are:

```bash
sudo apt update
sudo apt install git build-essential qemu-system-misc gcc-riscv64-linux-gnu binutils-riscv64-linux-gnu bc
```

For a new checkout, use an unused directory name. The completed working checkout on this PC is already `~/xv6-member1`; do not clone over it.

```bash
git clone https://github.com/mit-pdos/xv6-riscv.git ~/xv6-member1
cd ~/xv6-member1
git checkout --detach f780d7850765d74cbdcd1fff4b822d8829f7c9bd
git switch -c member1-race-study
make qemu CPUS=4
```

Inside xv6:

```text
echo hello xv6
usertests -q
```

The final sanity result must be `ALL TESTS PASSED`. Exit QEMU by pressing Ctrl+A, releasing the keys, then pressing X. We did this before measuring the race experiment.

## Step 2 — understand the shared data

Read `kernel/kalloc.c` in Ubuntu. `kmem.freelist` points to a linked list of unused 4096-byte physical pages. `kalloc()` removes the first page. `kfree()` puts a page back at the front. Both change the same list, so both use `kmem.lock`.

Example: without the lock, CPU 0 and CPU 1 may both read page A as the first free page before either updates the head. Both may then return A to different callers. This is a possible interleaving, not an instruction trace of a particular recorded failure.

## Step 3 — add the C stress program

The supplied test is `member1_xv6_guide/race_test.c` in the Windows project folder. In Ubuntu:

```bash
cd ~/xv6-member1
cp '/mnt/c/Users/HP/Documents/OS record/OS CASE STUDY/member1_xv6_guide/race_test.c' user/race_test.c
```

Add the following entry to the existing `UPROGS` list in `Makefile`, with a real tab at the start:

```makefile
	$U/_race_test\
```

Keep the other entries. This change is already applied in the completed checkout. Then:

```bash
make -j4 kernel/kernel fs.img
make qemu CPUS=4
```

Inside xv6 run `race_test`. A locked smoke run should finish with `race_test: PASS (all 4 children completed)` before proceeding.

### How the C program works

1. The parent creates a pipe and forks four children.
2. Each child waits for one pipe byte. The parent releases them after creating the workers, encouraging overlap.
3. Each child repeats 200 rounds. It requests eight pages using `sbrk(32768)`.
4. It fills every byte with its own tag, waits briefly in user space, and reads every byte back.
5. A wrong tag prints `CORRUPTION`. Allocation/shrink failures are also reported.
6. The child returns its pages with `sbrk(-32768)` and eventually exits.
7. The parent collects child statuses with `wait()` and prints PASS or FAIL.

The test reaches `kalloc()`/`kfree()` through normal system calls; it cannot call kernel functions directly. `volatile` forces verification reads; it does not provide locking. The worker delay is outside the kernel. No artificial delay was inserted into the kernel allocator.

## Step 4 — freeze the experiment

We saved the exact source revision, locked allocator, test source, Makefile and SHA-256 checksums before measurement. Fixed settings: four CPUs, 128 MiB guest RAM, four workers, eight pages per worker, 200 rounds. Every attempt starts a fresh guest. The boot timeout is 30 seconds and the stress timeout is 60 seconds.

The complete C helper can perform the following three phases automatically. Compile it in Ubuntu:

```bash
cd '/mnt/c/Users/HP/Documents/OS record/OS CASE STUDY'
cc -std=c11 -Wall -Wextra -Werror -O2 member1_tools.c -o /tmp/member1_tools
```

For a new run set, choose a directory that does not already exist:

```bash
/tmp/member1_tools run /home/nithish/xv6-member1 /home/nithish/member1-new-evidence full
```

The command requires the C test and its Makefile entry from Step 3, and an original allocator matching Git HEAD. It refuses an existing output directory. It runs the normal sanity and smoke checks before the 30 measured attempts. New runs do not replace the preserved results. Ctrl+C requests shutdown and restores/rebuilds the original allocator; a power loss or SIGKILL cannot run that cleanup, so verify the allocator before resuming.

## Step 5 — Phase A: original locking

Run ten attempts, A01–A10. Every attempt boots xv6 with four CPUs, runs `race_test` once, records all console output and exits QEMU. Stop the comparison if the locked baseline fails. The C helper implements this sequence with `fork`, `exec`, pipes, `poll`, and a monotonic clock.

## Step 6 — Phase B: remove only allocator locking

In both `kfree()` and `kalloc()`, comment out `acquire(&kmem.lock);` and `release(&kmem.lock);`: four calls in total. Leave the data operations, initialization, and other locks alone. Save the diff, rebuild, and run B01–B10 with the same test. Record PASS, corruption, panic/trap, test failure, timeout or boot failure as observed. The original unlocked run set produced no PASS outcomes.

Removing the calls also removes their local interrupt-handling effects where no outer lock is active. The experiment therefore compares the original locking discipline with its removal; it does not isolate each effect independently.

## Step 7 — Phase C: restore and repeat

Restore the saved original `kernel/kalloc.c` byte for byte, rebuild, and run C01–C10. Check that the test hash is unchanged, the allocator checksum matches, and its final Git diff is empty. The C helper restores the allocator on normal completion and handled interruption. The final working checkout uses the original locks.

## Step 8 — results and handoff

The original 30 attempts are in `evidence/results.csv`. The fresh C-runner validation set is in `c_validation/results.csv`. Both have actual `.txt` console logs and timed `.cast` output recordings. Do not combine their counts or describe the original observations as collected by the new C runner.

`C_RESULTS_SUMMARY.md` checks and summarizes the preserved original results. `c_validation/C_RESULTS_SUMMARY.md` summarizes the separate C validation runs. The original detailed method and interpretation remain in `IMPLEMENTATION_AND_RESULTS.md`.

The C helper can print a raw recording without JavaScript:

```bash
/tmp/member1_tools replay '/mnt/c/Users/HP/Documents/OS record/OS CASE STUDY/member1_completed/evidence/B02-unlocked.txt'
```

It can validate the 30-row CSV, generate a result summary and checksums, and make a compressed handoff using the installed `sha256sum` and `tar` tools:

```bash
/tmp/member1_tools package '/mnt/c/Users/HP/Documents/OS record/OS CASE STUDY/member1_completed'
```

The PNG figures and MP4 are retained historical artifacts rendered from the original logs; they are not native screenshots. Python source, Python bytecode, and the JavaScript replay page are removed from the handoff. Their replacement is C; the earlier evidence is preserved honestly.

Give Member 2 the actual symptoms/diff, Member 3 the fixed source revision, and Member 4 the result tables, logs and figures. Certificate, names, signatures and final team report/PPT assembly remain the team's responsibility.

## What the results mean

Original run set: 10/10 locked PASS; unlocked: three corruption outcomes, four panic/trap outcomes, two test failures and one timeout; 10/10 restored PASS. B10 includes trap diagnostics before its timeout, and some multicore messages interleave. These are primary outcomes counted once per attempt.

The comparison supports the importance of allocator synchronization for this workload. A PASS does not prove that no race exists. A timeout does not by itself prove deadlock, and a panic alone does not identify the exact two-CPU interleaving.
