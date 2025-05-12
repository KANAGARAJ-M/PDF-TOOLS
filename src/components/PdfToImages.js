import React, { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { saveAs } from 'file-saver';

// Set the PDF.js worker path to a version that matches your installation
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

function PdfToImages() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageImages, setPageImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageFormat, setImageFormat] = useState('png');
  const [imageQuality, setImageQuality] = useState(1);
  const [imageScale, setImageScale] = useState(2); // Scale factor for rendering (higher = better quality)

  const handlePdfChange = async (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsProcessing(true);
    
    try {
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();
      
      // Get page count using pdf-lib
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const count = pdfDoc.getPageCount();
      
      setPdfFile({
        file,
        name: file.name,
        arrayBuffer,
      });
      
      setPageCount(count);
      setPageImages([]);
      
      // Generate preview of first page
      if (count > 0) {
        const pdfData = new Uint8Array(arrayBuffer);
        const loadingTask = pdfjs.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        
        const firstPage = await pdf.getPage(1);
        const preview = await renderPageToImage(firstPage, imageFormat, imageScale);
        setPageImages([{ page: 1, dataUrl: preview }]);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Error loading PDF. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPageToImage = async (page, format, scale) => {
    // Calculate scale to improve image quality
    const viewport = page.getViewport({ scale });
    
    // Prepare canvas for rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Render PDF page to canvas
    await page.render({
      canvasContext: context,
      viewport,
    }).promise;
    
    // Convert canvas to image data URL
    return canvas.toDataURL(`image/${format}`, imageQuality);
  };

  const convertToImages = async () => {
    if (!pdfFile || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const pdfData = new Uint8Array(pdfFile.arrayBuffer);
      const loadingTask = pdfjs.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      
      const images = [];
      
      // Process each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const imageData = await renderPageToImage(page, imageFormat, imageScale);
        
        images.push({
          page: i,
          dataUrl: imageData,
        });
        
        // Update state progressively to show progress
        if (i % 5 === 0 || i === pdf.numPages) {
          setPageImages([...images]);
        }
      }
      
      setPageImages(images);
      
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      alert('Error converting PDF to images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (dataUrl, pageNumber) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `page-${pageNumber}.${imageFormat}`;
    link.click();
  };

  const downloadAllImages = async () => {
    if (pageImages.length === 0) return;
    
    // Alert user that batch download requires JSZip
    alert("Batch download currently unavailable. Please download images individually.");
    
    // Alternatively, trigger individual downloads for each image
    pageImages.forEach(image => {
      setTimeout(() => {
        downloadImage(image.dataUrl, image.page);
      }, 500); // Add a slight delay between downloads
    });
  };

  return (
    <div className="tool">
      <h2>PDF to Images</h2>
      <p className="tool-description">
        Extract pages from PDF as high-quality images
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
          
          <div className="conversion-options">
            <h3>Conversion Options</h3>
            
            <div className="option-group">
              <label htmlFor="imageFormat">Image Format:</label>
              <select 
                id="imageFormat" 
                value={imageFormat}
                onChange={(e) => setImageFormat(e.target.value)}
              >
                <option value="png">PNG (Lossless)</option>
                <option value="jpeg">JPEG (Smaller file size)</option>
              </select>
            </div>
            
            <div className="option-group">
              <label htmlFor="imageQuality">Image Quality:</label>
              <input
                type="range"
                id="imageQuality"
                min="0.5"
                max="1"
                step="0.1"
                value={imageQuality}
                onChange={(e) => setImageQuality(parseFloat(e.target.value))}
              />
              <span>{Math.round(imageQuality * 100)}%</span>
            </div>
            
            <div className="option-group">
              <label htmlFor="imageScale">Resolution:</label>
              <select 
                id="imageScale" 
                value={imageScale}
                onChange={(e) => setImageScale(parseFloat(e.target.value))}
              >
                <option value="1">Normal (72 DPI)</option>
                <option value="2">High (144 DPI)</option>
                <option value="3">Very High (216 DPI)</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={convertToImages} 
            className="convert-button"
            disabled={isProcessing}
          >
            {isProcessing ? 'Converting...' : 'Convert to Images'}
          </button>
          
          {pageImages.length > 0 && (
            <>
              <div className="page-images-container">
                <h3>
                  Generated Images
                  {pageImages.length < pageCount && ` (${pageImages.length}/${pageCount})`}
                </h3>
                
                <div className="image-grid">
                  {pageImages.map((image) => (
                    <div key={image.page} className="image-item">
                      <img 
                        src={image.dataUrl} 
                        alt={`Page ${image.page}`}
                        className="page-image-preview"
                      />
                      <div className="image-item-footer">
                        <span>Page {image.page}</span>
                        <button
                          onClick={() => downloadImage(image.dataUrl, image.page)}
                          className="download-button"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={downloadAllImages} 
                  className="download-all-button"
                >
                  Download All as ZIP
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default PdfToImages;