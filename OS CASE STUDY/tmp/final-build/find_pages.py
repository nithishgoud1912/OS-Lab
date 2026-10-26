import pdfplumber
from pathlib import Path
p=Path(r'C:\Users\HP\Documents\OS record\OS CASE STUDY\output\final\Case_Study_14_Race_Conditions_xv6_Final_v5.pdf')
terms=['Existing System and Background','3. Proposed Solution','4. What is synchronization?','5. Types of synchronization','6. How xv6 protects','Working flow','7. C files','7.6 Kernel','7.7 Spinlock','7.8 Guest','7.9 Host','8. What the locks','9. Comparison','10. Conclusion','References']
with pdfplumber.open(p) as pdf:
 texts=[page.extract_text() or '' for page in pdf.pages]
 for term in terms:
  print(term, [i+1 for i,t in enumerate(texts) if term in t])
