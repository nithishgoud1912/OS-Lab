from pathlib import Path
import json,re
root=Path(r'C:\Users\HP\Documents\OS record\OS CASE STUDY')
for name in ['A01-locked.cast','B02-unlocked.cast','C01-restored.cast']:
 p=root/'member1_completed/evidence'/name
 ev=[json.loads(x) for x in p.read_text(encoding='utf-8').splitlines()[1:]]
 text=''.join(e[2] for e in ev if len(e)>2 and e[1]=='o')
 text=re.sub(r'\x1b\[[0-?]*[ -/]*[@-~]','',text)
 print('\n----',name,'----\n',text[-2400:])
