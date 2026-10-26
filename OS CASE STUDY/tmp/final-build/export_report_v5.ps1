$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('C:\Users\HP\Documents\OS record\OS CASE STUDY\output\final\Case_Study_14_Race_Conditions_xv6_Final_v5.docx')
$doc.Fields.Update() | Out-Null
$doc.ExportAsFixedFormat('C:\Users\HP\Documents\OS record\OS CASE STUDY\output\final\Case_Study_14_Race_Conditions_xv6_Final_v5.pdf',17)
$doc.Close($false)
$word.Quit()
