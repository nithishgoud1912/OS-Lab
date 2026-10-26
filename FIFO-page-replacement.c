// FIFO page replacement technique
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
    int idx = 0;
    int hit = 0, fault = 0;
    for (int i = 0; i < n; i++) {
        int check = 0;
        for (int j = 0; j < size; j++) {
            if (pages[i] == frames[j]) {
                check = 1;
                break;
            }
        }
        if (check == 0) {
            frames[idx] = pages[i];
            idx = (idx + 1) % size;
            fault++;
            printf("%6d  (PF)  | ", pages[i]);
        } else {
            hit++;
            printf("%6d        | ", pages[i]);
        }
        printFrames(frames, size);
    }
    printf("\nTotal Page Hits: %d\n", hit);
    printf("Total Page Faults: %d\n", fault);
    printf("Hit Ratio: %.2f%%\n", ((float)hit / n) * 100);
    printf("Fault Ratio: %.2f%%\n", ((float)fault / n) * 100);
    return 0;
}
