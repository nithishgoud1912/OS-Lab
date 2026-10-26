#include<stdio.h>
int main(){
    int n,size;
    printf("Enter the total number of pages:");
    scanf("%d",&n);
    int pages[n];
    printf("Enter the frame size:");
    scanf("%d",&size);
    int hit=0,fault=0;
    int frames[size];
    for(int i=0;i<size;i++){
        frames[i]=-1;
    }
    printf("Enter the page numbers:\n");
    for(int i=0;i<n;i++){
        scanf("%d",&pages[i]);
    }
    int idx = 0, check = 0;
    for(int i=0;i<n;i++){
        for(int j =0; j<size;j++){
            if(pages[i]==frames[j]){
                check = 1;
                break;
            }
        }
        if(check==0){
            frames[idx]=pages[i];
            idx=(idx+1)%size;
            fault++;
        }
        else{
            hit++;
        }
        check = 0;
    }
    printf("Total hits = %d\n",hit);
    printf("Total faults = %d\n",fault);
    printf("Hit percentage = %.2f\n",(float)hit/n*100);
    return 0;
}