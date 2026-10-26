/* Host-side C utility for Ubuntu/WSL. The guest program is race_test.c.
 * Build: cc -std=c11 -Wall -Wextra -Werror -O2 member1_tools.c -o member1_tools
 * run REPOSITORY NEW_EVIDENCE_DIRECTORY smoke|sanity|full
 * package HANDOFF_DIRECTORY
 * replay RAW_LOG
 * Uses installed make, QEMU, git, sha256sum and tar via execvp (no shell).
 */
#define _XOPEN_SOURCE 700
#define _POSIX_C_SOURCE 200809L
#include <dirent.h>
#include <errno.h>
#include <fcntl.h>
#include <limits.h>
#include <poll.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <time.h>
#include <unistd.h>

static volatile sig_atomic_t stopped;
static char repository[PATH_MAX], evidence[PATH_MAX];
static char *original;
static size_t original_size;
static int must_restore;

static void signal_stop(int sig) { (void)sig; stopped = 1; }
static void fail(const char *s) { perror(s); exit(EXIT_FAILURE); }
static void path_join(char *out, const char *a, const char *b) {
  if (snprintf(out, PATH_MAX, "%s/%s", a, b) >= PATH_MAX) {
    errno = ENAMETOOLONG; fail("path");
  }
}
static char *load(const char *path, size_t *length) {
  FILE *f = fopen(path, "rb");
  if (!f) fail(path);
  if (fseek(f, 0, SEEK_END)) fail("fseek");
  long n = ftell(f);
  if (n < 0 || fseek(f, 0, SEEK_SET)) fail("file size");
  char *data = malloc((size_t)n + 1);
  if (!data) fail("malloc");
  if (fread(data, 1, (size_t)n, f) != (size_t)n) fail("fread");
  data[n] = 0;
  fclose(f);
  if (length) *length = (size_t)n;
  return data;
}
static void save(const char *path, const char *data, size_t n) {
  FILE *f = fopen(path, "wb");
  if (!f) fail(path);
  if (fwrite(data, 1, n, f) != n || fclose(f)) fail("write file");
}
static int execute(char *const args[], const char *output) {
  pid_t pid = fork();
  if (pid < 0) fail("fork");
  if (!pid) {
    if (output) {
      int fd = open(output, O_WRONLY | O_CREAT | O_TRUNC, 0644);
      if (fd < 0 || dup2(fd, STDOUT_FILENO) < 0 || dup2(fd, STDERR_FILENO) < 0) _exit(126);
      close(fd);
    }
    execvp(args[0], args);
    _exit(127);
  }
  int status;
  while (waitpid(pid, &status, 0) < 0) if (errno != EINTR) fail("waitpid");
  return WIFEXITED(status) ? WEXITSTATUS(status) : 128;
}
static void checked(char *const args[], const char *output) {
  if (execute(args, output)) {
    fprintf(stderr, "%s failed; see %s\n", args[0], output ? output : "terminal");
    exit(EXIT_FAILURE);
  }
}
static void restore(void) {
  if (must_restore && original) {
    char path[PATH_MAX], log[PATH_MAX];
    path_join(path, repository, "kernel/kalloc.c");
    save(path, original, original_size);
    path_join(log, evidence, "final-restored-build.txt");
    char *args[] = {"make", "-j4", "kernel/kernel", "fs.img", NULL};
    if (execute(args, log)) fprintf(stderr, "Restored source; rebuild failed. See %s\n", log);
    must_restore = 0;
  }
}
static double seconds(void) {
  struct timespec t;
  if (clock_gettime(CLOCK_MONOTONIC, &t)) fail("clock_gettime");
  return (double)t.tv_sec + (double)t.tv_nsec / 1e9;
}
static void json_string(FILE *f, const char *s, size_t n) {
  fputc('"', f);
  for (size_t i = 0; i < n; i++) {
    unsigned char c = (unsigned char)s[i];
    if (c == '"' || c == '\\') { fputc('\\', f); fputc(c, f); }
    else if (c < 32 || c >= 127) fprintf(f, "\\u%04x", c);
    else fputc(c, f);
  }
  fputc('"', f);
}
static void csv_text(FILE *f, const char *s) {
  fputc('"', f);
  for (; *s; s++) { if (*s == '"') fputc('"', f); fputc(*s, f); }
  fputc('"', f);
}
typedef struct {
  int boot, started;
  const char *outcome;
  char message[512];
  double elapsed;
} Result;
static void message_line(char *out, size_t size, const char *text, const char *needle) {
  const char *p = strstr(text, needle);
  if (!p) return;
  const char *start = p;
  while (start > text && start[-1] != '\n' && start[-1] != '\r') start--;
  size_t n = strcspn(start, "\r\n");
  if (n >= size) n = size - 1;
  memcpy(out, start, n); out[n] = 0;
}
static Result guest(const char *name, const char *input, int timeout) {
  char path[PATH_MAX], filename[128];
  snprintf(filename, sizeof filename, "%s.txt", name);
  path_join(path, evidence, filename);
  FILE *log = fopen(path, "wb");
  if (!log) fail(path);
  snprintf(filename, sizeof filename, "%s.cast", name);
  path_join(path, evidence, filename);
  FILE *cast = fopen(path, "w");
  if (!cast) fail(path);
  fprintf(cast, "{\"version\":2,\"width\":110,\"height\":32,\"title\":");
  json_string(cast, name, strlen(name));
  fprintf(cast, ",\"timestamp\":%ld}\n", (long)time(NULL));
  int to_guest[2], from_guest[2];
  if (pipe(to_guest) || pipe(from_guest)) fail("pipe");
  pid_t child = fork();
  if (child < 0) fail("fork QEMU");
  if (!child) {
    if (dup2(to_guest[0], STDIN_FILENO) < 0 || dup2(from_guest[1], STDOUT_FILENO) < 0 || dup2(from_guest[1], STDERR_FILENO) < 0) _exit(126);
    close(to_guest[0]); close(to_guest[1]); close(from_guest[0]); close(from_guest[1]);
    execlp("qemu-system-riscv64", "qemu-system-riscv64", "-machine", "virt", "-bios", "none", "-kernel", "kernel/kernel", "-m", "128M", "-smp", "4", "-nographic", "-global", "virtio-mmio.force-legacy=false", "-drive", "file=fs.img,if=none,format=raw,id=x0", "-device", "virtio-blk-device,drive=x0,bus=virtio-mmio-bus.0", (char *)NULL);
    _exit(127);
  }
  close(to_guest[0]); close(from_guest[1]);
  Result r = {0, 0, "BOOT_FAILURE", "QEMU exited before a complete result", 0};
  char text[262144] = "";
  size_t used = 0;
  double start = seconds(), test_start = 0, finish = 0, shutdown = 0;
  int ending = 0, eof = 0;
  while (!eof) {
    struct pollfd fd = {from_guest[0], POLLIN, 0};
    int ready = poll(&fd, 1, 50);
    if (ready < 0 && errno != EINTR) fail("poll");
    if (ready > 0 && (fd.revents & (POLLIN | POLLHUP))) {
      char chunk[8192];
      ssize_t n = read(from_guest[0], chunk, sizeof chunk);
      if (n <= 0) eof = 1;
      else {
        fwrite(chunk, 1, (size_t)n, log); fflush(log);
        fprintf(cast, "[%.6f,\"o\",", seconds()-start);
        json_string(cast, chunk, (size_t)n); fputs("]\n", cast); fflush(cast);
        if (used + (size_t)n >= sizeof text) {
          size_t keep = sizeof text / 2;
          memmove(text, text + used - keep, keep); used = keep;
        }
        memcpy(text + used, chunk, (size_t)n); used += (size_t)n; text[used] = 0;
      }
    }
    double now = seconds();
    if (!ending) {
      if (!r.started && strstr(text, "$ ")) {
        r.boot = r.started = 1; test_start = now;
        size_t n = strlen(input);
        if (write(to_guest[1], input, n) != (ssize_t)n) {
          r.outcome = "TEST_FAILURE";
          snprintf(r.message, sizeof r.message, "Could not send test command");
          finish = now;
        }
      }
      const char *needle = NULL;
      if (r.started && strstr(text, "CORRUPTION round=")) { r.outcome = "CORRUPTION"; needle = "CORRUPTION round="; }
      else if (strstr(text, "panic:")) { r.outcome = r.started ? "PANIC_OR_TRAP" : "BOOT_FAILURE"; needle = "panic:"; }
      else if (r.started && strstr(text, "race_test: FAIL (")) { r.outcome = "TEST_FAILURE"; needle = "race_test: FAIL ("; }
      else if (r.started && strstr(text, "race_test: PASS (")) { r.outcome = "PASS"; needle = "race_test: PASS ("; }
      else if (r.started && strstr(text, "ALL TESTS PASSED")) { r.outcome = "PASS"; needle = "ALL TESTS PASSED"; }
      if (needle) {
        message_line(r.message, sizeof r.message, text, needle);
        if (!finish) finish = now + .7;
      }
      if ((!r.started && now-start >= 30) || (r.started && now-test_start >= timeout)) {
        r.outcome = r.started ? "TIMEOUT" : "BOOT_FAILURE";
        snprintf(r.message, sizeof r.message, "Host limit reached: %d seconds", r.started ? timeout : 30);
        finish = now;
      }
      if (stopped) { r.outcome = "INTERRUPTED"; snprintf(r.message, sizeof r.message, "Host interrupted the run"); finish = now; }
      if (finish && now >= finish) {
        r.elapsed = now - (r.started ? test_start : start);
        const char quit[] = {1, 'x'};
        ssize_t quit_sent = write(to_guest[1], quit, sizeof quit);
        if (quit_sent < 0 && errno != EPIPE) perror("QEMU quit");
        ending = 1; shutdown = now;
      }
    } else if (now-shutdown > 5) {
      kill(child, SIGTERM);
      if (now-shutdown > 7) { kill(child, SIGKILL); break; }
    }
  }
  if (!ending) r.elapsed = seconds() - (r.started ? test_start : start);
  close(to_guest[1]); close(from_guest[0]);
  int status;
  while (waitpid(child, &status, 0) < 0) if (errno != EINTR) fail("wait QEMU");
  fclose(log); fclose(cast);
  printf("%s: %s: %s (%.3fs)\n", name, r.outcome, r.message, r.elapsed); fflush(stdout);
  return r;
}
static void build(const char *name) {
  char path[PATH_MAX]; path_join(path, evidence, name);
  char *args[] = {"make", "-j4", "kernel/kernel", "fs.img", NULL}; checked(args, path);
}
static void record_command(char *const args[], const char *name) {
  char path[PATH_MAX]; path_join(path, evidence, name); checked(args, path);
}
static void run(const char *repo, const char *destination, const char *mode) {
  if (strcmp(mode,"smoke") && strcmp(mode,"sanity") && strcmp(mode,"full")) {
    fprintf(stderr, "Mode must be smoke, sanity, or full\n"); exit(1);
  }
  if (!realpath(repo, repository)) fail(repo);
  if (mkdir(destination, 0755)) fail("New evidence directory required");
  if (!realpath(destination, evidence) || chdir(repository)) fail("working directory");
  char *diff[] = {"git", "diff", "--exit-code", "HEAD", "--", "kernel/kalloc.c", NULL};
  record_command(diff, "initial-allocator.diff");
  char allocator[PATH_MAX], path[PATH_MAX]; path_join(allocator, repository, "kernel/kalloc.c");
  original = load(allocator, &original_size);
  path_join(path, evidence, "kalloc.locked.c"); save(path, original, original_size);
  must_restore = 1; atexit(restore);
  char *rev[] = {"git", "rev-parse", "HEAD", NULL}; record_command(rev, "revision.txt");
  char *qver[] = {"qemu-system-riscv64", "--version", NULL}; record_command(qver, "qemu-version.txt");
  char *cver[] = {"riscv64-linux-gnu-gcc", "--version", NULL}; record_command(cver, "compiler-version.txt");
  char *hash[] = {"sha256sum", "user/race_test.c", NULL}; record_command(hash, "test.sha256");
  char *alloc_hash[] = {"sha256sum", "kernel/kalloc.c", NULL}; record_command(alloc_hash, "allocator-original.sha256");
  path_join(path, repository, "user/race_test.c"); size_t n;
  char *test = load(path, &n); path_join(path, evidence, "race_test.used.c"); save(path, test, n); free(test);
  path_join(path, repository, "Makefile"); char *mk = load(path, &n);
  if (!strstr(mk, "$U/_race_test")) { fprintf(stderr,"Add the test to UPROGS first.\n"); exit(1); }
  path_join(path, evidence, "Makefile.used"); save(path, mk, n); free(mk);
  path_join(path, evidence, "protocol.txt");
  const char *protocol = "Host automation: C; guest test: C\nCPUs=4 RAM=128MiB children=4 pages=8 rounds=200\nFresh guest per attempt; boot limit=30s; stress limit=60s; no kernel timing instrumentation.\nNew C-tool runs are separate from the original 30 recorded attempts.\n";
  save(path, protocol, strlen(protocol));
  build("initial-build.txt");
  if (!strcmp(mode,"sanity") || !strcmp(mode,"full")) {
    Result sanity = guest("00-normal-sanity", "echo hello xv6\nusertests -q\n", 240);
    if (strcmp(sanity.outcome,"PASS") || stopped) exit(1);
    if (!strcmp(mode,"sanity")) { restore(); return; }
  }
  Result smoke = guest("01-locked-smoke", "race_test\n", 60);
  if (strcmp(smoke.outcome,"PASS") || stopped) exit(1);
  if (!strcmp(mode,"smoke")) { restore(); return; }
  path_join(path, evidence, "results.csv"); FILE *csv = fopen(path,"w"); if (!csv) fail(path);
  fputs("attempt_id,phase,commit,cpus,children,pages_per_child,rounds,boot_reached_shell,test_started,outcome,elapsed_seconds,exact_message,transcript,recording,notes\n", csv);
  path_join(path, evidence, "revision.txt"); char *commit = load(path,NULL); commit[strcspn(commit,"\r\n")] = 0;
  const char *phases[] = {"locked","unlocked","restored"};
  for (int phase=0; phase<3 && !stopped; phase++) {
    if (phase == 1) {
      char *variant = malloc(original_size + 64); if (!variant) fail("malloc");
      size_t dest=0; int edits=0;
      for (size_t i=0; i<original_size;) {
        if (!strncmp(original+i,"  acquire(&kmem.lock);",22) || !strncmp(original+i,"  release(&kmem.lock);",22)) {
          memcpy(variant+dest,"  // ",5); dest+=5; i+=2; edits++;
        } else variant[dest++] = original[i++];
      }
      if (edits != 4) { fprintf(stderr,"Expected exactly four allocator lock calls; got %d\n",edits); free(variant); exit(1); }
      save(allocator,variant,dest); path_join(path,evidence,"kalloc.unlocked.c"); save(path,variant,dest); free(variant);
      char *args[] = {"git","diff","--","kernel/kalloc.c",NULL}; record_command(args,"B-lock-removal.diff");
    } else if (phase == 2) save(allocator, original, original_size);
    char filename[128]; snprintf(filename,sizeof filename,"%c-build.txt",'A'+phase); build(filename);
    char *check[] = {"sha256sum","-c",NULL,NULL}; path_join(path,evidence,"test.sha256"); check[2]=path;
    char check_log[PATH_MAX]; path_join(check_log,evidence,"test-verification.txt"); checked(check,check_log);
    for (int i=1; i<=10 && !stopped; i++) {
      char name[80]; snprintf(name,sizeof name,"%c%02d-%s",'A'+phase,i,phases[phase]);
      Result r = guest(name,"race_test\n",60);
      fprintf(csv,"%c%02d,%s,%s,4,4,8,200,%s,%s,%s,%.3f,",'A'+phase,i,phases[phase],commit,r.boot?"True":"False",r.started?"True":"False",r.outcome,r.elapsed);
      csv_text(csv,r.message); fprintf(csv,",%s.txt,%s.cast,C host automation; fresh guest; uninstrumented\n",name,name); fflush(csv);
      if (phase==0 && strcmp(r.outcome,"PASS")) { fclose(csv); free(commit); exit(1); }
    }
  }
  fclose(csv); free(commit);
  restore();
  char *final_diff[] = {"git","diff","--exit-code","HEAD","--","kernel/kalloc.c",NULL}; record_command(final_diff,"final-restoration.diff");
  char *verify[] = {"sha256sum","-c",NULL,NULL}; path_join(path,evidence,"allocator-original.sha256"); verify[2]=path;
  char check_log[PATH_MAX]; path_join(check_log,evidence,"restoration-check.txt"); checked(verify,check_log);
  if (stopped) exit(1);
}

/* Small RFC4180-style field reader for the recorded results. */
static int csv_row(FILE *f, char fields[][2048], int capacity) {
  int c=fgetc(f), field=0, quoted=0;
  size_t n=0;
  if (c==EOF) return 0;
  for (;;) {
    if (field>=capacity || n>=2047) { fprintf(stderr,"CSV field too long\n"); exit(1); }
    if (c=='"') {
      if (quoted) {
        c=fgetc(f);
        if (c=='"') { fields[field][n++]='"'; c=fgetc(f); continue; }
        quoted=0; continue;
      }
      if (n==0) quoted=1; else fields[field][n++]=(char)c;
    } else if ((c==',' || c=='\n' || c==EOF) && !quoted) {
      fields[field++][n]=0; n=0;
      if (c!=',') return field;
    } else if (c!='\r') fields[field][n++]=(char)c;
    c=fgetc(f);
    if (c==EOF && quoted) { fprintf(stderr,"Unclosed CSV quote\n"); exit(1); }
  }
}
static int compare_names(const void *a, const void *b) { return strcmp(*(char *const *)a,*(char *const *)b); }
static void manifest_tree(FILE *manifest, const char *base, const char *relative) {
  char directory[PATH_MAX]; path_join(directory,base,relative);
  DIR *d=opendir(directory); if (!d) fail(directory);
  char **names=NULL; size_t count=0; struct dirent *entry;
  while ((entry=readdir(d))) {
    if (!strcmp(entry->d_name,".") || !strcmp(entry->d_name,"..") || !strcmp(entry->d_name,"SHA256SUMS.txt")) continue;
    char **next=realloc(names,(count+1)*sizeof *names); if (!next) fail("realloc"); names=next;
    names[count]=strdup(entry->d_name); if (!names[count++]) fail("strdup");
  }
  closedir(d); qsort(names,count,sizeof *names,compare_names);
  for (size_t i=0;i<count;i++) {
    char rel[PATH_MAX],full[PATH_MAX];
    if (*relative) path_join(rel,relative,names[i]); else snprintf(rel,sizeof rel,"%s",names[i]);
    path_join(full,base,rel); struct stat st; if (lstat(full,&st)) fail(full);
    if (S_ISDIR(st.st_mode)) manifest_tree(manifest,base,rel);
    else if (S_ISREG(st.st_mode)) {
      int fd[2]; if (pipe(fd)) fail("hash pipe"); pid_t p=fork(); if (p<0) fail("hash fork");
      if (!p) { if (dup2(fd[1],STDOUT_FILENO)<0) _exit(126); close(fd[0]); close(fd[1]); execlp("sha256sum","sha256sum",full,(char*)NULL); _exit(127); }
      close(fd[1]); FILE *hash=fdopen(fd[0],"r"); if (!hash) fail("fdopen"); char sum[65];
      if (fscanf(hash,"%64s",sum)!=1) { fprintf(stderr,"Hash failed\n"); exit(1); }
      while (fgetc(hash)!=EOF) {} fclose(hash); int status;
      while(waitpid(p,&status,0)<0) if(errno!=EINTR) fail("wait hash");
      if (!WIFEXITED(status) || WEXITSTATUS(status)) exit(1);
      fprintf(manifest,"%s  %s\n",sum,rel);
    }
    free(names[i]);
  }
  free(names);
}
static void package(const char *folder) {
  char base[PATH_MAX],path[PATH_MAX]; if (!realpath(folder,base)) fail(folder);
  path_join(path,base,"evidence/results.csv");
  const char *relative_evidence = "evidence";
  if (access(path,R_OK)) { relative_evidence = ""; path_join(path,base,"results.csv"); }
  FILE *csv=fopen(path,"r"); if (!csv) fail(path);
  char rows[31][15][2048]; int n=0;
  if (csv_row(csv,rows[30],15)!=15) { fprintf(stderr,"Unexpected CSV header\n"); exit(1); }
  int fields;
  while ((fields=csv_row(csv,rows[n],15))) {
    if (fields!=15 || n>=30) { fprintf(stderr,"Expected exactly 30 result rows\n"); exit(1); }
    n++;
  }
  fclose(csv);
  if (n!=30) { fprintf(stderr,"Expected 30 attempts; found %d\n",n); exit(1); }
  int counts[3][5]={{0}},started[3]={0},boot[3]={0};
  const char *phase_names[]={"locked","unlocked","restored"};
  const char *outcomes[]={"PASS","CORRUPTION","PANIC_OR_TRAP","TEST_FAILURE","TIMEOUT"};
  for (int i=0;i<n;i++) {
    int phase=-1, outcome=-1;
    for(int j=0;j<3;j++) if(!strcmp(rows[i][1],phase_names[j])) phase=j;
    for(int j=0;j<5;j++) if(!strcmp(rows[i][9],outcomes[j])) outcome=j;
    if(phase<0 || outcome<0) { fprintf(stderr,"Unknown phase/outcome\n"); exit(1); }
    for(int j=0;j<i;j++) if(!strcmp(rows[i][0],rows[j][0])) { fprintf(stderr,"Duplicate attempt\n"); exit(1); }
    counts[phase][outcome]++; boot[phase]+=!strcmp(rows[i][7],"True"); started[phase]+=!strcmp(rows[i][8],"True");
    for(int j=12;j<=13;j++) {
      char rel[PATH_MAX];
      if (*relative_evidence) path_join(rel,relative_evidence,rows[i][j]);
      else snprintf(rel,sizeof rel,"%s",rows[i][j]);
      path_join(path,base,rel); if(access(path,R_OK)) fail(path);
    }
  }
  path_join(path,base,"C_RESULTS_SUMMARY.md"); FILE *report=fopen(path,"w"); if(!report) fail(path);
  fputs("# Results checked and packaged by C\n\n",report);
  fputs(*relative_evidence ? "Original observations are preserved. They were collected before the helper-language conversion; the C runner has its own separate validation directory.\n\n" : "Fresh observations collected by the C runner. This is a separate run set; do not merge with the original 30 attempts.\n\n",report);
  fputs("| Phase | Attempts | Shell reached | Test started | PASS | Corruption | Panic/trap | Test failure | Timeout |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n",report);
  for(int i=0;i<3;i++) {
    int total=0; for(int j=0;j<5;j++) total+=counts[i][j];
    if(total!=10) { fprintf(stderr,"Expected 10 attempts per phase\n"); fclose(report); exit(1); }
    fprintf(report,"| %s | %d | %d | %d",phase_names[i],total,boot[i],started[i]);
    for(int j=0;j<5;j++) fprintf(report," | %d",counts[i][j]);
    fputs(" |\n",report);
  }
  fputs("\nA PASS is an observation under this workload, not proof of absence of races. Some output is interleaved across CPUs. See CSV notes and raw logs.\n",report);
  if (*relative_evidence) fputs("\nIn the original run set B10 includes trap diagnostics before the host timeout; it remains counted once as TIMEOUT.\n",report);
  fputs("\n## Every recorded attempt\n\n| Attempt | Outcome | Seconds | Raw log |\n|---|---|---:|---|\n",report);
  for(int i=0;i<n;i++) fprintf(report,"| %s | %s | %s | [log](%s%s%s) |\n",rows[i][0],rows[i][9],rows[i][10],relative_evidence,*relative_evidence?"/":"",rows[i][12]);
  fclose(report);
  path_join(path,base,"SHA256SUMS.txt"); FILE *manifest=fopen(path,"w"); if(!manifest) fail(path);
  manifest_tree(manifest,base,""); fclose(manifest);
  char archive[PATH_MAX];
  if(snprintf(archive,sizeof archive,"%s.tar.gz",base)>=(int)sizeof archive) fail("archive path");
  char *args[]={"tar","-czf",archive,"-C",base,".",NULL}; checked(args,NULL);
  printf("C package complete: 30 unique attempts, 10 per phase.\n%s\n",archive);
}
int main(int argc,char **argv) {
  signal(SIGINT,signal_stop); signal(SIGTERM,signal_stop); signal(SIGPIPE,SIG_IGN);
  if(argc==5 && !strcmp(argv[1],"run")) run(argv[2],argv[3],argv[4]);
  else if(argc==3 && !strcmp(argv[1],"package")) package(argv[2]);
  else if(argc==3 && !strcmp(argv[1],"replay")) {
    size_t n; char *text=load(argv[2],&n); if(fwrite(text,1,n,stdout)!=n) fail("stdout"); free(text);
  } else {
    fprintf(stderr,"Usage:\n  %s run REPO NEW_EVIDENCE_DIR smoke|sanity|full\n  %s package HANDOFF_DIR\n  %s replay RAW_LOG\n",argv[0],argv[0],argv[0]); return 1;
  }
  free(original); original=NULL;
  return 0;
}
