# Completed Member 1 handoff

Read `FROM_SCRATCH_C.md` for the full explanation and commands using C.
`member1_tools.c` is the host runner/packager; `race_test.c` is the xv6 C program.
Read `IMPLEMENTATION_AND_RESULTS.md` for the preserved original results and limitations.
Read `C_RESULTS_SUMMARY.md` for the original results checked by the C packager.
Read `c_validation/C_RESULTS_SUMMARY.md` for the separate C-runner validation results.
Raw `.txt` console logs can be read directly or printed using the C helper's `replay` command.
Play `demo-walkthrough.mp4` for the evidence walkthrough.
Use `evidence/results.csv` for the report table and `figures/` for captioned evidence.

The figures/video render saved evidence; they are not desktop screenshots. The raw `.txt` and `.cast` recordings are included. The live Ubuntu repository is `/home/nithish/xv6-member1`, with original locking restored and rebuilt. Sanity/smoke runs are excluded from the measured 30 attempts.

The guest test and kernel changes were C from the beginning. Python host helpers and the JavaScript replay page were removed and replaced with C. Original observations are preserved separately from the fresh C-runner validation; historical results are not relabelled as C-collected observations.
