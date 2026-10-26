#include <stdio.h>
void printFrames(int frames[], int size) {
    for (int i = 0; i < size; i++) {
        if (frames[i] == -1) {
            printf("-");
        } else {
            printf("%d", frames[i]);
        }
        if (i < size - 1) {
            printf("  ");
        }
    }
    printf("\n");
}
int main() {
    int size, n;
    printf("Enter the size of frames: ");
    scanf("%d", &size);
    printf("Enter the total number of pages: ");
    scanf("%d", &n);
    int pages[n];
    int frames[size];
    for (int i = 0; i < size; i++) {
        frames[i] = -1;
    }
    printf("Enter the page reference string (separated by spaces): ");
    for (int i = 0; i < n; i++) {
        scanf("%d", &pages[i]);
    }
    printf("\nIncoming Page | Frame State\n");
    printf("---------------------------\n");
    int hit = 0, fault = 0;
    for (int i = 0; i < n; i++) {
        int found = 0;
        for (int j = 0; j < size; j++) {
            if (frames[j] == pages[i]) {
                found = 1;
                break;
            }
        }
        if (found) {
            hit++;
            printf("%6d        | ", pages[i]);
        }
        else {
            fault++;
            int empty = -1;
            for (int j = 0; j < size; j++) {
                if (frames[j] == -1) {
                    empty = j;
                    break;
                }
            }
            if (empty != -1) {
                frames[empty] = pages[i];
            }
            else {
                int farthest = -1;
                int replace_idx = -1;
                for (int j = 0; j < size; j++) {
                    int next_use = -1;
                    for (int k = i + 1; k < n; k++) {
                        if (frames[j] == pages[k]) {
                            next_use = k;
                            break;
                        }
                    }
                    if (next_use == -1) {
                        replace_idx = j;
                        break;
                    }
                    if (next_use > farthest) {
                        farthest = next_use;
                        replace_idx = j;
                    }
                }
                frames[replace_idx] = pages[i];
            }
            printf("%6d  (PF)  | ", pages[i]);
        }
        printFrames(frames, size);
    }
    printf("\nTotal Page Hits: %d\n", hit);
    printf("Total Page Faults: %d\n", fault);
    printf("Hit Ratio: %.2f%%\n", ((float)hit / n) * 100);
    printf("Fault Ratio: %.2f%%\n", ((float)fault / n) * 100);
    return 0;
}