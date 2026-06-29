$word = New-Object -ComObject Word.Application
$word.Visible = $false

$doc1 = $word.Documents.Open("c:\Users\praise\Desktop\Fn yr\New\GPS Maternal Tracking System F.docx")
$doc1.Content.Text | Out-File -FilePath "c:\Users\praise\Desktop\Fn yr\New\GPS_Maternal_extracted.txt" -Encoding UTF8
$doc1.Close($false)

$doc2 = $word.Documents.Open("c:\Users\praise\Desktop\Fn yr\New\GPS.docx")
$doc2.Content.Text | Out-File -FilePath "c:\Users\praise\Desktop\Fn yr\New\GPS_extracted.txt" -Encoding UTF8
$doc2.Close($false)

$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
