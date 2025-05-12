import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

function SplitPdf() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState([{ start: 1, end: 1, name: 'Split 1' }]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePdfChange = async (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    try {
      // Load the PDF to get page count
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const count = pdf.getPageCount();
      
      setPdfFile({
        file,
        name: file.name,
        url: URL.createObjectURL(file),
        arrayBuffer
      });
      
      setPageCount(count);
      setRanges([{ start: 1, end: count, name: 'Split 1' }]);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF. Please try another file.');
    }
  };

  const updateRange = (index, field, value) => {
    const numValue = parseInt(value);
    
    setRanges(prevRanges => {
      const newRanges = [...prevRanges];
      
      if (field === 'start') {
        newRanges[index].start = Math.min(Math.max(1, numValue), newRanges[index].end);
      } else if (field === 'end') {
        newRanges[index].end = Math.min(Math.max(newRanges[index].start, numValue), pageCount);
      } else { // name
        newRanges[index].name = value;
      }
      
      return newRanges;
    });
  };

  const addRange = () => {
    setRanges(prevRanges => [
      ...prevRanges,
      { start: 1, end: pageCount, name: `Split ${prevRanges.length + 1}` }
    ]);
  };

  const removeRange = (index) => {
    if (ranges.length === 1) return;
    setRanges(prevRanges => prevRanges.filter((_, i) => i !== index));
  };

  const splitPdf = async () => {
    if (!pdfFile || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const sourcePdf = await PDFDocument.load(pdfFile.arrayBuffer);
      
      // Process each range
      for (const range of ranges) {
        // Create a new document for this range
        const newPdf = await PDFDocument.create();
        
        // Calculate 0-based page indices
        const startIndex = range.start - 1;
        const endIndex = range.end - 1;
        
        // Copy the specified pages
        for (let i = startIndex; i <= endIndex; i++) {
          const [page] = await newPdf.copyPages(sourcePdf, [i]);
          newPdf.addPage(page);
        }
        
        // Save the split PDF
        const newPdfBytes = await newPdf.save();
        
        // Create download link
        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${range.name}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error splitting PDF:', error);
      alert('Error splitting PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tool">
      <h2>Split PDF</h2>
      <p className="tool-description">
        Extract pages from your PDF into separate files.
      </p>
      
      <div className="upload-container">
        <label className="upload-button">
          Select PDF File
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handlePdfChange} 
            style={{ display: 'none' }}
          />
        </label>
      </div>
      
      {pdfFile && (
        <>
          <div className="pdf-info">
            <p>
              File: <strong>{pdfFile.name}</strong> | 
              Pages: <strong>{pageCount}</strong>
            </p>
          </div>
          
          <div className="range-container">
            <h3>Define Split Ranges</h3>
            
            {ranges.map((range, index) => (
              <div key={index} className="range-item">
                <div className="range-inputs">
                  <input
                    type="text"
                    value={range.name}
                    onChange={(e) => updateRange(index, 'name', e.target.value)}
                    className="range-name"
                    placeholder="Split name"
                  />
                  <div className="page-range">
                    <span>Pages:</span>
                    <input
                      type="number"
                      min="1"
                      max={pageCount}
                      value={range.start}
                      onChange={(e) => updateRange(index, 'start', e.target.value)}
                    />
                    <span>to</span>
                    <input
                      type="number"
                      min={range.start}
                      max={pageCount}
                      value={range.end}
                      onChange={(e) => updateRange(index, 'end', e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => removeRange(index)}
                  className="remove-button"
                  disabled={ranges.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button onClick={addRange} className="add-range-button">
              Add Another Range
            </button>
          </div>
          
          <button 
            onClick={splitPdf} 
            className="convert-button"
            disabled={isProcessing}
          >
            {isProcessing ? 'Splitting...' : 'Split PDF'}
          </button>
        </>
      )}
    </div>
  );
}

export default SplitPdf;