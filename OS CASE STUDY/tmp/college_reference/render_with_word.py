"""Use the packaged render_docx rasterizer with native Word PDF conversion.

The renderer's LibreOffice conversion is unavailable on this Windows host.
This task-local adapter leaves the installed skill unchanged.
"""
import argparse, importlib.util, subprocess
from pathlib import Path

SKILL=Path(r'C:\Users\HP\.codex\plugins\cache\openai-primary-runtime\documents\26.1024.11018\skills\documents')
spec=importlib.util.spec_from_file_location('packaged_renderer',SKILL/'render_docx.py')
renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)

def native_pdf(doc_path,user_profile,convert_tmp_dir,stem,verbose=False):
    pdf=Path(convert_tmp_dir)/(stem+'.pdf')
    def quote(x):return "'"+str(x).replace("'","''")+"'"
    script=("$ErrorActionPreference='Stop'; $word=New-Object -ComObject Word.Application; "
            "$word.Visible=$false; $word.DisplayAlerts=0; try { $doc=$word.Documents.Open("+quote(Path(doc_path).resolve())+",$false,$true); "
            "$doc.ExportAsFixedFormat("+quote(pdf)+",17); $doc.Close(0) } finally {$word.Quit()}")
    r=subprocess.run(['powershell','-NoProfile','-Command',script],capture_output=True,text=True)
    return (str(pdf) if r.returncode==0 and pdf.exists() else '',r.stdout+r.stderr)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('--output_dir',required=True);p.add_argument('--dpi',type=int,default=115);p.add_argument('--emit_pdf',action='store_true');a=p.parse_args()
    renderer.convert_to_pdf=native_pdf
    images=renderer.rasterize(a.input,a.output_dir,a.dpi,verbose=False,emit_pdf=a.emit_pdf)
    print('Native Word + render_docx.py:',len(images),'pages',a.output_dir)
