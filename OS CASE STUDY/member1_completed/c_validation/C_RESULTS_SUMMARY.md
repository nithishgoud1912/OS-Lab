# Results checked and packaged by C

Fresh observations collected by the C runner. This is a separate run set; do not merge with the original 30 attempts.

| Phase | Attempts | Shell reached | Test started | PASS | Corruption | Panic/trap | Test failure | Timeout |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| locked | 10 | 10 | 10 | 10 | 0 | 0 | 0 | 0 |
| unlocked | 10 | 10 | 10 | 0 | 1 | 6 | 2 | 1 |
| restored | 10 | 10 | 10 | 10 | 0 | 0 | 0 | 0 |

A PASS is an observation under this workload, not proof of absence of races. Some output is interleaved across CPUs. See CSV notes and raw logs.

## Every recorded attempt

| Attempt | Outcome | Seconds | Raw log |
|---|---|---:|---|
| A01 | PASS | 0.857 | [log](A01-locked.txt) |
| A02 | PASS | 0.848 | [log](A02-locked.txt) |
| A03 | PASS | 0.847 | [log](A03-locked.txt) |
| A04 | PASS | 0.864 | [log](A04-locked.txt) |
| A05 | PASS | 0.843 | [log](A05-locked.txt) |
| A06 | PASS | 0.862 | [log](A06-locked.txt) |
| A07 | PASS | 0.841 | [log](A07-locked.txt) |
| A08 | PASS | 0.846 | [log](A08-locked.txt) |
| A09 | PASS | 0.855 | [log](A09-locked.txt) |
| A10 | PASS | 0.852 | [log](A10-locked.txt) |
| B01 | PANIC_OR_TRAP | 0.780 | [log](B01-unlocked.txt) |
| B02 | PANIC_OR_TRAP | 0.779 | [log](B02-unlocked.txt) |
| B03 | PANIC_OR_TRAP | 0.780 | [log](B03-unlocked.txt) |
| B04 | PANIC_OR_TRAP | 0.778 | [log](B04-unlocked.txt) |
| B05 | PANIC_OR_TRAP | 0.777 | [log](B05-unlocked.txt) |
| B06 | CORRUPTION | 0.792 | [log](B06-unlocked.txt) |
| B07 | TEST_FAILURE | 0.852 | [log](B07-unlocked.txt) |
| B08 | TIMEOUT | 60.028 | [log](B08-unlocked.txt) |
| B09 | PANIC_OR_TRAP | 0.762 | [log](B09-unlocked.txt) |
| B10 | TEST_FAILURE | 0.865 | [log](B10-unlocked.txt) |
| C01 | PASS | 0.876 | [log](C01-restored.txt) |
| C02 | PASS | 0.852 | [log](C02-restored.txt) |
| C03 | PASS | 0.864 | [log](C03-restored.txt) |
| C04 | PASS | 0.886 | [log](C04-restored.txt) |
| C05 | PASS | 0.872 | [log](C05-restored.txt) |
| C06 | PASS | 0.868 | [log](C06-restored.txt) |
| C07 | PASS | 0.876 | [log](C07-restored.txt) |
| C08 | PASS | 0.889 | [log](C08-restored.txt) |
| C09 | PASS | 0.867 | [log](C09-restored.txt) |
| C10 | PASS | 0.859 | [log](C10-restored.txt) |
