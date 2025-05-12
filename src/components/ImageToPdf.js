import React, { useState } from 'react';
import jsPDF from 'jspdf';

function ImageToPdf() {
  const [images, setImages] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [layoutMode, setLayoutMode] = useState('singlePage'); // 'singlePage' or 'multiPage'

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Process each file
    Promise.all(selectedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          // Get image dimensions
          const img = new Image();
          img.onload = () => {
            resolve({
              file,
              url: URL.createObjectURL(file),
              name: file.name,
              dataUrl: e.target.result,
              width: img.width,
              height: img.height
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    })).then(newImages => {
      setImages(prevImages => [...prevImages, ...newImages]);
    });
  };

  const removeImage = (index) => {
    setImages(prevImages => {
      const newImages = [...prevImages];
      URL.revokeObjectURL(newImages[index].url);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;
    
    setIsConverting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      if (layoutMode === 'singlePage') {
        // One image per page with original quality
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          
          // Add new page for all images except the first one
          if (i > 0) {
            pdf.addPage();
          }
          
          // Calculate aspect ratio to fit within PDF page
          const imgWidth = image.width;
          const imgHeight = image.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const scaledWidth = imgWidth * ratio;
          const scaledHeight = imgHeight * ratio;
          const imgX = (pdfWidth - scaledWidth) / 2;
          const imgY = (pdfHeight - scaledHeight) / 2;
          
          // Add image directly from the data URL
          pdf.addImage(
            image.dataUrl, 
            'PNG', // Using PNG to avoid additional quality loss
            imgX, 
            imgY, 
            scaledWidth, 
            scaledHeight,
            undefined,
            'FAST',
            0 // Rotation angle
          );
        }
      } else {
        // Multiple images per page with original quality
        const margin = 10; // mm
        
        // Determine grid layout based on number of images
        const imagesCount = images.length;
        let cols, rows;
        
        if (imagesCount <= 1) {
          cols = 1; 
          rows = 1;
        } else if (imagesCount <= 4) {
          cols = 2;
          rows = Math.ceil(imagesCount / 2);
        } else {
          cols = 3;
          rows = Math.ceil(imagesCount / 3);
        }
        
        // Calculate image size in the grid
        const availableWidth = pdfWidth - (margin * 2);
        const availableHeight = pdfHeight - (margin * 2);
        const cellWidth = availableWidth / cols;
        const cellHeight = availableHeight / rows;
        
        let currentPage = 0;
        let currentRow = 0;
        let currentCol = 0;
        
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          
          // Check if we need a new page
          if (currentRow >= rows) {
            pdf.addPage();
            currentPage++;
            currentRow = 0;
            currentCol = 0;
          }
          
          const imgWidth = image.width;
          const imgHeight = image.height;
          
          // Calculate position and size for this grid cell
          const posX = margin + (currentCol * cellWidth);
          const posY = margin + (currentRow * cellHeight);
          
          // Calculate the scale to fit the image into the cell
          const scaleWidth = cellWidth * 0.9 / imgWidth;
          const scaleHeight = cellHeight * 0.9 / imgHeight;
          const scale = Math.min(scaleWidth, scaleHeight);
          
          // Center the image in its cell
          const imgPosX = posX + (cellWidth - (imgWidth * scale)) / 2;
          const imgPosY = posY + (cellHeight - (imgHeight * scale)) / 2;
          
          pdf.addImage(
            image.dataUrl, 
            'PNG', // Using PNG to avoid additional quality loss
            imgPosX, 
            imgPosY, 
            imgWidth * scale, 
            imgHeight * scale,
            undefined,
            'FAST',
            0 // Rotation angle
          );
          
          // Move to the next grid position
          currentCol++;
          if (currentCol >= cols) {
            currentCol = 0;
            currentRow++;
          }
        }
      }
      
      pdf.save('high-quality-images.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="tool">
      <h2>Image to PDF</h2>
      <p className="tool-description">
        Convert your images to PDF with high quality preservation.
      </p>
      
      <div className="upload-container">
        <label className="upload-button">
          Choose Images
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleImageChange} 
            style={{ display: 'none' }}
          />
        </label>
      </div>
      
      {images.length > 0 && (
        <>
          <div className="layout-options">
            <div className="layout-option">
              <input
                type="radio"
                id="singlePage"
                name="layoutMode"
                value="singlePage"
                checked={layoutMode === 'singlePage'}
                onChange={() => setLayoutMode('singlePage')}
              />
              <label htmlFor="singlePage">One image per page</label>
            </div>
            <div className="layout-option">
              <input
                type="radio"
                id="multiPage"
                name="layoutMode"
                value="multiPage"
                checked={layoutMode === 'multiPage'}
                onChange={() => setLayoutMode('multiPage')}
              />
              <label htmlFor="multiPage">Multiple images per page</label>
            </div>
          </div>
          
          <div className="image-preview-container">
            {images.map((image, index) => (
              <div key={index} className="image-preview">
                <img 
                  id={`img-${index}`}
                  src={image.url} 
                  alt={`Preview ${index}`}
                  className="preview-img"
                />
                <div className="image-info">
                  <span>{image.name}</span>
                  <button 
                    onClick={() => removeImage(index)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={convertToPdf} 
            className="convert-button"
            disabled={isConverting}
          >
            {isConverting ? 'Converting...' : 'Convert to PDF'}
          </button>
        </>
      )}
    </div>
  );
}

export default ImageToPdf;