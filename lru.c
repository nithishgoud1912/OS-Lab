#include <stdio.h>
int main() {
    int size, n;
    printf("Enter the size of frames: ");
    scanf("%d", &size);
    printf("Enter the total number of pages: ");
    scanf("%d", &n);
    int pages[n];
    int frames[size];
    int time[size];
    for (int i = 0; i < size; i++) {
        frames[i] = -1;
        time[i] = 0;
    }
    printf("Enter the page reference string (separated by spaces): ");
    for (int i = 0; i < n; i++) {
        scanf("%d", &pages[i]);
    }
    int counter = 0;
    int hit = 0, fault = 0;
    for (int i = 0; i < n; i++) {
        int check = 0;
        int hit_idx = -1;
        for (int j = 0; j < size; j++) {
            if (pages[i] == frames[j]) {
                check = 1;
                hit_idx = j;
                break;
            }
        }
        if (check == 0) {
            fault++;
            int empty_idx = -1;
            for (int j = 0; j < size; j++) {
                if (frames[j] == -1) {
                    empty_idx = j;
                    break;
                }
            }
            if (empty_idx != -1) {
                frames[empty_idx] = pages[i];
                time[empty_idx] = ++counter;
            } else {
                int min_time = time[0];
                int lru_idx = 0;
                for (int j = 1; j < size; j++) {
                    if (time[j] < min_time) {
                        min_time = time[j];
                        lru_idx = j;
                    }
                }
                frames[lru_idx] = pages[i];
                time[lru_idx] = ++counter;
            }
        } else {
            hit++;
            time[hit_idx] = ++counter;
        }
    }
    printf("\nTotal Page Hits: %d\n", hit);
    printf("Total Page Faults: %d\n", fault);
    printf("Hit Ratio: %.2f%%\n", ((float)hit / n) * 100);
    return 0;
}
