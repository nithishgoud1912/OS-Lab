from pathlib import Path
import pdfplumber
p=Path(r'C:\Users\HP\Documents\OS record\OS CASE STUDY\output\final\Case_Study_14_Race_Conditions_xv6_Final_v4.pdf')
with pdfplumber.open(p) as pdf:
 print('PAGES',len(pdf.pages))
 for i,page in enumerate(pdf.pages,1):
  txt=(page.extract_text() or '').splitlines()
  print(f'{i:02d}: '+ ' | '.join(txt[:3])[:260])
