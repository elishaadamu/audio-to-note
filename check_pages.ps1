$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Open("C:\Users\Adamu\OneDrive\Documents\audio-to-note\Audio_to_Note_Project_v2.docx")
    $pages = $doc.ComputeStatistics(2) # 2 = wdStatisticPages
    Write-Host "Page Count: $pages"
    $doc.Close([ref]$false)
} catch {
    Write-Host "Error: $_"
} finally {
    $word.Quit()
}
