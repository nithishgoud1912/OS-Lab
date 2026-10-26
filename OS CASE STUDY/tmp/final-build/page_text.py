from pathlib import Path
import pdfplumber
p=Path(r'C:\Users\HP\Documents\OS record\OS CASE STUDY\output\final\Case_Study_14_Race_Conditions_xv6_Final_v4.pdf')
with pdfplumber.open(p) as pdf:
 for n in [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]:
  print('\n===== PAGE',n,'=====')
  print((pdf.pages[n-1].extract_text() or '')[:2600])
