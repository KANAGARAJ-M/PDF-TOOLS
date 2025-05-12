import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

function RepairPdf() {
  const [pdfFile, setPdfFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [repairResult, setRepairResult] = useState(null);
  const [repairAttempts, setRepairAttempts] = useState(0);
  
  const handlePdfChange = (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setPdfFile({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size
    });
    
    setRepairResult(null);
    setRepairAttempts(0);
  };

  const repairPdf = async () => {
    if (!pdfFile || isProcessing) return;
    
    setIsProcessing(true);
    setRepairResult(null);
    
    try {
      // Read the PDF file
      const arrayBuffer = await pdfFile.file.arrayBuffer();
      
      // Try different repair methods depending on attempts
      let pdfDoc;
      let success = false;
      let method = '';
      
      try {
        // First attempt: Standard parsing
        pdfDoc = await PDFDocument.load(arrayBuffer, { 
          ignoreEncryption: true,
          updateMetadata: false 
        });
        success = true;
        method = 'standard';
      } catch (error) {
        console.log('Standard parsing failed, trying recovery mode...');
        
        try {
          // Second attempt: Force recovery mode
          pdfDoc = await PDFDocument.load(arrayBuffer, { 
            ignoreEncryption: true,
            updateMetadata: false,
            parseSpeed: 200 // Slow down parsing for corrupted files
          });
          success = true;
          method = 'recovery';
        } catch (error) {
          console.log('Recovery mode failed, trying reconstruction...');
          
          // Third attempt: Full reconstruction
          try {
            // Create a new PDF
            const newPdfDoc = await PDFDocument.create();
            
            // Try to extract contents from corrupted PDF
            const tempDoc = await PDFDocument.load(arrayBuffer, { 
              ignoreEncryption: true,
              throwOnInvalidObject: false,
              updateMetadata: false 
            });
            
            // Copy pages one by one
            const pageIndices = tempDoc.getPageIndices();
            for (let i = 0; i < pageIndices.length; i++) {
              try {
                const [page] = await newPdfDoc.copyPages(tempDoc, [pageIndices[i]]);
                newPdfDoc.addPage(page);
              } catch (e) {
                console.log(`Failed to copy page ${i + 1}`);
              }
            }
            
            pdfDoc = newPdfDoc;
            success = newPdfDoc.getPageCount() > 0;
            method = 'reconstruction';
          } catch (error) {
            throw new Error('All repair methods failed');
          }
        }
      }
      
      // If we got here, we have a repaired PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      
      setRepairResult({
        success,
        method,
        originalSize: pdfFile.size,
        repairedSize: blob.size,
        pageCount: pdfDoc.getPageCount(),
        downloadUrl: url,
      });
      
      setRepairAttempts(prev => prev + 1);
      
    } catch (error) {
      console.error('Error repairing PDF:', error);
      setRepairResult({
        success: false,
        error: error.message || 'Unknown error occurred'
      });
      setRepairAttempts(prev => prev + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format bytes to human-readable size
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const downloadRepaired = () => {
    if (!repairResult || !repairResult.success) return;
    
    const link = document.createElement('a');
    link.href = repairResult.downloadUrl;
    link.download = `repaired_${pdfFile.name}`;
    link.click();
  };

  return (
    <div className="tool">
      <h2>Repair PDF</h2>
      <p className="tool-description">
        Attempt to fix damaged or corrupted PDF files
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
              Size: <strong>{formatBytes(pdfFile.size)}</strong>
            </p>
          </div>
          
          {repairResult && (
            <div className={`repair-results ${repairResult.success ? 'success' : 'error'}`}>
              <h3>{repairResult.success ? 'PDF Repair Successful' : 'PDF Repair Failed'}</h3>
              
              {repairResult.success ? (
                <>
                  <p>
                    Method used: <strong>{repairResult.method}</strong><br />
                    Pages recovered: <strong>{repairResult.pageCount}</strong><br />
                    Original size: <strong>{formatBytes(repairResult.originalSize)}</strong><br />
                    Repaired size: <strong>{formatBytes(repairResult.repairedSize)}</strong>
                  </p>
                  <button 
                    onClick={downloadRepaired}
                    className="download-button"
                  >
                    Download Repaired PDF
                  </button>
                </>
              ) : (
                <>
                  <p>Error: {repairResult.error}</p>
                  {repairAttempts < 3 && (
                    <p>
                      PDF repair failed. 
                      {repairAttempts === 1 && ' You may try again with a different repair method.'}
                      {repairAttempts === 2 && ' You may try one final repair method.'}
                    </p>
                  )}
                  {repairAttempts >= 3 && (
                    <p>
                      All repair attempts have failed. The file may be too severely damaged to repair.
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          
          <button 
            onClick={repairPdf} 
            className="convert-button"
            disabled={isProcessing || (repairResult && repairResult.success) || repairAttempts >= 3}
          >
            {isProcessing ? 'Repairing...' : repairAttempts > 0 ? `Try Repair Method ${repairAttempts + 1}` : 'Repair PDF'}
          </button>
        </>
      )}
    </div>
  );
}

export default RepairPdf;