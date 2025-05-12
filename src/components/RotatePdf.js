import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';

// Set the PDF.js worker path
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function RotatePdf() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPages, setPdfPages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const canvasRefs = useRef([]);
  
  const handlePdfChange = async (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsRendering(true);
    
    try {
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      
      const newPdf = {
        file,
        name: file.name,
        url: URL.createObjectURL(file),
        arrayBuffer,
      };
      
      setPdfFile(newPdf);
      
      // Initialize PDF.js
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;
      
      // Initialize page rotation data
      const pages = [];
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        pages.push({
          pageNumber: i,
          rotation: 0, // Current rotation in degrees
          originalRotation: page.rotate || 0, // Original rotation from PDF
        });
      }
      
      setPdfPages(pages);
      canvasRefs.current = Array(pageCount).fill().map((_, i) => canvasRefs.current[i] || React.createRef());
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF. Please try another file.');
    } finally {
      setIsRendering(false);
    }
  };

  // Render PDF pages with current rotations
  useEffect(() => {
    if (!pdfFile || pdfPages.length === 0) return;
    
    const renderPages = async () => {
      setIsRendering(true);
      
      try {
        // Initialize PDF.js
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfFile.arrayBuffer) });
        const pdf = await loadingTask.promise;
        
        // Render each page
        for (let i = 0; i < pdfPages.length; i++) {
          const pageData = pdfPages[i];
          const page = await pdf.getPage(pageData.pageNumber);
          const canvas = canvasRefs.current[i].current;
          
          if (canvas) {
            const context = canvas.getContext('2d');
            
            // Set scale for good quality but reasonable size
            const viewport = page.getViewport({ 
              scale: 0.5, 
              rotation: pageData.originalRotation + pageData.rotation 
            });
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // Render the page
            await page.render({
              canvasContext: context,
              viewport,
            }).promise;
          }
        }
      } catch (error) {
        console.error('Error rendering PDF pages:', error);
      } finally {
        setIsRendering(false);
      }
    };
    
    renderPages();
  }, [pdfFile, pdfPages]);

  const rotatePage = (pageIndex, direction) => {
    setPdfPages(prevPages => {
      const newPages = [...prevPages];
      const rotationChange = direction === 'clockwise' ? 90 : -90;
      
      // Update rotation (keeping it in the range 0-270)
      let newRotation = newPages[pageIndex].rotation + rotationChange;
      if (newRotation < 0) newRotation += 360;
      if (newRotation >= 360) newRotation -= 360;
      
      newPages[pageIndex] = {
        ...newPages[pageIndex],
        rotation: newRotation
      };
      
      return newPages;
    });
  };

  const rotateAllPages = (direction) => {
    setPdfPages(prevPages => {
      const rotationChange = direction === 'clockwise' ? 90 : -90;
      
      return prevPages.map(page => {
        let newRotation = page.rotation + rotationChange;
        if (newRotation < 0) newRotation += 360;
        if (newRotation >= 360) newRotation -= 360;
        
        return {
          ...page,
          rotation: newRotation
        };
      });
    });
  };

  const resetRotations = () => {
    setPdfPages(prevPages => {
      return prevPages.map(page => ({
        ...page,
        rotation: 0
      }));
    });
  };

  const applyRotations = async () => {
    if (!pdfFile || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfFile.arrayBuffer);
      const pages = pdfDoc.getPages();
      
      // Apply rotations
      for (let i = 0; i < pdfPages.length; i++) {
        const pageData = pdfPages[i];
        if (pageData.rotation !== 0) {
          // PDF page indices are 0-based
          const page = pages[i];
          page.setRotation(degrees(pageData.originalRotation + pageData.rotation));
        }
      }
      
      // Save the rotated PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create download link
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rotated_${pdfFile.name}`;
      link.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error applying rotations:', error);
      alert('Error applying rotations. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tool">
      <h2>Rotate PDF</h2>
      <p className="tool-description">
        Rotate pages in your PDF document
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
              Pages: <strong>{pdfPages.length}</strong>
            </p>
            
            <div className="rotation-controls">
              <button
                className="rotate-button"
                onClick={() => rotateAllPages('counterclockwise')}
                disabled={isProcessing || isRendering}
              >
                ↺ Rotate All Left
              </button>
              <button
                className="rotate-button"
                onClick={() => rotateAllPages('clockwise')}
                disabled={isProcessing || isRendering}
              >
                ↻ Rotate All Right
              </button>
              <button
                className="reset-button"
                onClick={resetRotations}
                disabled={isProcessing || isRendering}
              >
                Reset All
              </button>
            </div>
          </div>
          
          {isRendering && (
            <div className="loading">Rendering pages, please wait...</div>
          )}
          
          <div className="pdf-pages-container">
            {pdfPages.map((page, index) => (
              <div key={index} className="pdf-page-item">
                <div className="pdf-page-info">
                  <span>Page {page.pageNumber}</span>
                  <span>Rotation: {page.rotation}°</span>
                </div>
                <div className="pdf-page-preview">
                  <canvas ref={canvasRefs.current[index]} className="page-canvas"></canvas>
                </div>
                <div className="pdf-page-actions">
                  <button
                    className="rotate-button small"
                    onClick={() => rotatePage(index, 'counterclockwise')}
                    disabled={isProcessing || isRendering}
                  >
                    ↺
                  </button>
                  <button
                    className="rotate-button small"
                    onClick={() => rotatePage(index, 'clockwise')}
                    disabled={isProcessing || isRendering}
                  >
                    ↻
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={applyRotations} 
            className="convert-button"
            disabled={isProcessing || isRendering || pdfPages.every(p => p.rotation === 0)}
          >
            {isProcessing ? 'Applying Rotations...' : 'Apply & Download'}
          </button>
        </>
      )}
    </div>
  );
}

export default RotatePdf;