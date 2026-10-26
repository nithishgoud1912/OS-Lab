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
