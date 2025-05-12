import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

function CompressPdf() {
  const [pdfFile, setPdfFile] = useState(null);
  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultSize, setResultSize] = useState(null);
  
  const handlePdfChange = async (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    setPdfFile({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size
    });
    
    setResultSize(null);
  };

  const compressPdf = async () => {
    if (!pdfFile || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Read the PDF file
      const arrayBuffer = await pdfFile.file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      
      // Apply compression settings based on compression level
      const options = {};
      
      if (compressionLevel === 'low') {
        options.objectCompressionLevel = 0;
      } else if (compressionLevel === 'medium') {
        options.objectCompressionLevel = 1;
      } else if (compressionLevel === 'high') {
        options.objectCompressionLevel = 2;
      }
      
      // Save with compression options
      const compressedPdfBytes = await pdf.save(options);
      
      // Create download link
      const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      const compressedSize = blob.size;
      
      // Record the result size for display
      setResultSize({
        original: pdfFile.size,
        compressed: compressedSize,
        reduction: pdfFile.size - compressedSize,
        percentage: ((pdfFile.size - compressedSize) / pdfFile.size * 100).toFixed(1)
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_${pdfFile.name}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert('Error compressing PDF. Please try again.');
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

  return (
    <div className="tool">
      <h2>Compress PDF</h2>
      <p className="tool-description">
        Reduce the file size of your PDF document.
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
          
          <div className="compression-options">
            <h3>Compression Level</h3>
            <div className="compression-selector">
              <div className="compression-option">
                <input
                  type="radio"
                  id="lowCompression"
                  name="compressionLevel"
                  value="low"
                  checked={compressionLevel === 'low'}
                  onChange={() => setCompressionLevel('low')}
                />
                <label htmlFor="lowCompression">Low</label>
              </div>
              <div className="compression-option">
                <input
                  type="radio"
                  id="mediumCompression"
                  name="compressionLevel"
                  value="medium"
                  checked={compressionLevel === 'medium'}
                  onChange={() => setCompressionLevel('medium')}
                />
                <label htmlFor="mediumCompression">Medium</label>
              </div>
              <div className="compression-option">
                <input
                  type="radio"
                  id="highCompression"
                  name="compressionLevel"
                  value="high"
                  checked={compressionLevel === 'high'}
                  onChange={() => setCompressionLevel('high')}
                />
                <label htmlFor="highCompression">High</label>
              </div>
            </div>
          </div>
          
          {resultSize && (
            <div className="compression-results">
              <h3>Compression Results</h3>
              <p>
                Original size: <strong>{formatBytes(resultSize.original)}</strong><br />
                Compressed size: <strong>{formatBytes(resultSize.compressed)}</strong><br />
                Size reduction: <strong>{formatBytes(resultSize.reduction)} ({resultSize.percentage}%)</strong>
              </p>
            </div>
          )}
          
          <button 
            onClick={compressPdf} 
            className="convert-button"
            disabled={isProcessing}
          >
            {isProcessing ? 'Compressing...' : 'Compress PDF'}
          </button>
        </>
      )}
    </div>
  );
}

export default CompressPdf;