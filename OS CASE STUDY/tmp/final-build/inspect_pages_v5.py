import pdfplumber
from pathlib import Path
p=Path(r'C:\Users\HP\Documents\OS record\OS CASE STUDY\output\final\Case_Study_14_Race_Conditions_xv6_Final_v5.pdf')
with pdfplumber.open(p) as pdf:
 for i in range(20):
  if i in range(3,10) or i in range(15,20):
   print('\nPAGE',i+1)
   print((pdf.pages[i].extract_text() or '')[:850])
