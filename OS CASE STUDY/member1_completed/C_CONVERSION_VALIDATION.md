# C conversion verification

The guest stress program and xv6 allocator changes were already C. The host runner and results packager are now implemented in `member1_tools.c`. The former Python scripts, generated Python bytecode and JavaScript replay page have been removed from the submitted handoff. Upstream xv6 files, including its assembly and build utilities, are retained as upstream infrastructure; the case-study tools do not invoke the upstream Python test harness.

Verification performed on Ubuntu-24.04 under WSL2:

- Compiled the C helper using `cc -std=c11 -Wall -Wextra -Werror -O2` without warnings.
- Used the C runner to execute `usertests -q`: `ALL TESTS PASSED`.
- Used the C runner for a separate locked stress smoke check: PASS.
- Completed 30 fresh measured attempts using the C runner: locked 10 PASS; unlocked 1 CORRUPTION, 6 PANIC_OR_TRAP, 2 TEST_FAILURE, 1 TIMEOUT; restored 10 PASS.
- Kept these observations in `c_validation/`, separate from the original observations in `evidence/`.
- Verified unchanged test hash, original allocator hash, empty final allocator diff, and successful rebuilt kernel.
- Confirmed that the runner refuses to overwrite an existing evidence directory.
- Used the C packager to check 30 distinct attempts and 10 attempts per phase, generate summaries and SHA-256 manifests, and create tar archives.

Different failure counts between run sets are expected in a timing-dependent experiment. The original figures/video illustrate the original set; the C validation CSV/logs describe the new set. Never combine them into a single 30-attempt table.

The C packager generates Markdown summaries, integrity manifests and tar archives. Historical PNG/MP4 artifacts are retained rather than regenerated; raw console logs remain the primary evidence. `replay` prints a raw log without requiring a browser or JavaScript.
