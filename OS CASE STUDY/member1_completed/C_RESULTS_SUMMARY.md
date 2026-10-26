# Results checked and packaged by C

Original observations are preserved. They were collected before the helper-language conversion; the C runner has its own separate validation directory.

| Phase | Attempts | Shell reached | Test started | PASS | Corruption | Panic/trap | Test failure | Timeout |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| locked | 10 | 10 | 10 | 10 | 0 | 0 | 0 | 0 |
| unlocked | 10 | 10 | 10 | 0 | 3 | 4 | 2 | 1 |
| restored | 10 | 10 | 10 | 10 | 0 | 0 | 0 | 0 |

A PASS is an observation under this workload, not proof of absence of races. Some output is interleaved across CPUs. See CSV notes and raw logs.

In the original run set B10 includes trap diagnostics before the host timeout; it remains counted once as TIMEOUT.

## Every recorded attempt

| Attempt | Outcome | Seconds | Raw log |
|---|---|---:|---|
| A01 | PASS | 0.646 | [log](evidence/A01-locked.txt) |
| A02 | PASS | 0.65 | [log](evidence/A02-locked.txt) |
| A03 | PASS | 0.647 | [log](evidence/A03-locked.txt) |
| A04 | PASS | 0.642 | [log](evidence/A04-locked.txt) |
| A05 | PASS | 0.655 | [log](evidence/A05-locked.txt) |
| A06 | PASS | 0.639 | [log](evidence/A06-locked.txt) |
| A07 | PASS | 0.634 | [log](evidence/A07-locked.txt) |
| A08 | PASS | 0.645 | [log](evidence/A08-locked.txt) |
| A09 | PASS | 0.643 | [log](evidence/A09-locked.txt) |
| A10 | PASS | 0.654 | [log](evidence/A10-locked.txt) |
| B01 | PANIC_OR_TRAP | 0.875 | [log](evidence/B01-unlocked.txt) |
| B02 | CORRUPTION | 0.891 | [log](evidence/B02-unlocked.txt) |
| B03 | PANIC_OR_TRAP | 0.899 | [log](evidence/B03-unlocked.txt) |
| B04 | PANIC_OR_TRAP | 0.879 | [log](evidence/B04-unlocked.txt) |
| B05 | CORRUPTION | 0.906 | [log](evidence/B05-unlocked.txt) |
| B06 | CORRUPTION | 0.902 | [log](evidence/B06-unlocked.txt) |
| B07 | TEST_FAILURE | 0.947 | [log](evidence/B07-unlocked.txt) |
| B08 | TEST_FAILURE | 0.945 | [log](evidence/B08-unlocked.txt) |
| B09 | PANIC_OR_TRAP | 0.877 | [log](evidence/B09-unlocked.txt) |
| B10 | TIMEOUT | 60.137 | [log](evidence/B10-unlocked.txt) |
| C01 | PASS | 0.648 | [log](evidence/C01-restored.txt) |
| C02 | PASS | 0.651 | [log](evidence/C02-restored.txt) |
| C03 | PASS | 0.661 | [log](evidence/C03-restored.txt) |
| C04 | PASS | 0.648 | [log](evidence/C04-restored.txt) |
| C05 | PASS | 0.64 | [log](evidence/C05-restored.txt) |
| C06 | PASS | 0.636 | [log](evidence/C06-restored.txt) |
| C07 | PASS | 0.652 | [log](evidence/C07-restored.txt) |
| C08 | PASS | 0.645 | [log](evidence/C08-restored.txt) |
| C09 | PASS | 0.647 | [log](evidence/C09-restored.txt) |
| C10 | PASS | 0.658 | [log](evidence/C10-restored.txt) |
