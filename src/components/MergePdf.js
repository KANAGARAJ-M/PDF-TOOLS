import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

function MergePdf() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);

  const handlePdfChange = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type === 'application/pdf'
    );
    
    const newFiles = selectedFiles.map(file => ({
      file,
      name: file.name,
      url: URL.createObjectURL(file)
    }));
    
    setPdfFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const removeFile = (index) => {
    setPdfFiles(prevFiles => {
      const newFiles = [...prevFiles];
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const moveFile = (index, direction) => {
    setPdfFiles(prevFiles => {
      const newFiles = [...prevFiles];
      if (direction === 'up' && index > 0) {
        [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
      } else if (direction === 'down' && index < newFiles.length - 1) {
        [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      }
      return newFiles;
    });
  };

  const mergePdfs = async () => {
    if (pdfFiles.length === 0) return;
    
    setIsConverting(true);
    
    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // For each PDF file
      for (const pdfFile of pdfFiles) {
        // Load the file
        const fileData = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileData);
        
        // Copy pages from the source PDF to the merged PDF
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      
      // Create a download link for the merged PDF
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Error merging PDFs. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="tool">
      <h2>Merge PDF</h2>
      <p className="tool-description">
        Combine multiple PDF files into a single document.
      </p>
      
      <div className="upload-container">
        <label className="upload-button">
          Select PDF Files
          <input 
            type="file" 
            accept="application/pdf" 
            multiple 
            onChange={handlePdfChange} 
            style={{ display: 'none' }}
          />
        </label>
      </div>
      
      {pdfFiles.length > 0 && (
        <>
          <div className="file-list">
            {pdfFiles.map((file, index) => (
              <div key={index} className="pdf-file-item">
                <div className="pdf-file-name">
                  <span>{index + 1}.</span>
                  <span>{file.name}</span>
                </div>
                <div className="pdf-file-actions">
                  <button 
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    className="move-button"
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === pdfFiles.length - 1}
                    className="move-button"
                  >
                    ↓
                  </button>
                  <button 
                    onClick={() => removeFile(index)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={mergePdfs} 
            className="convert-button"
            disabled={isConverting || pdfFiles.length < 2}
          >
            {isConverting ? 'Merging...' : 'Merge PDFs'}
          </button>
        </>
      )}
    </div>
  );
}

export default MergePdf;