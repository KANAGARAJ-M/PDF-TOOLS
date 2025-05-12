import React, { useState, useRef } from 'react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

function AddWatermark() {
  const [pdfFile, setPdfFile] = useState(null);
  const [watermarkType, setWatermarkType] = useState('text');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkPosition, setWatermarkPosition] = useState('center');
  const [watermarkRotation, setWatermarkRotation] = useState(45);
  const [watermarkSize, setWatermarkSize] = useState(50);
  const [watermarkColor, setWatermarkColor] = useState('#FF0000');
  const [isProcessing, setIsProcessing] = useState(false);
  const imageInputRef = useRef(null);

  const handlePdfChange = (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setPdfFile({
      file,
      name: file.name,
      url: URL.createObjectURL(file)
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setWatermarkImage({
        dataUrl: e.target.result,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const clearWatermarkImage = () => {
    setWatermarkImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Convert hex color to RGB values (0-1 range for pdf-lib)
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  };

  const addWatermark = async () => {
    if (!pdfFile || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Read the PDF file
      const arrayBuffer = await pdfFile.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      // For each page in the document
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        if (watermarkType === 'text') {
          // Add text watermark
          const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const fontSize = (Math.min(width, height) / 100) * watermarkSize;
          const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
          const textHeight = fontSize;
          
          // Calculate position
          let x, y;
          switch(watermarkPosition) {
            case 'topLeft':
              x = 20;
              y = height - 20 - textHeight;
              break;
            case 'topRight':
              x = width - 20 - textWidth;
              y = height - 20 - textHeight;
              break;
            case 'bottomLeft':
              x = 20;
              y = 20;
              break;
            case 'bottomRight':
              x = width - 20 - textWidth;
              y = 20;
              break;
            default:
              // Center
              x = (width - textWidth) / 2;
              y = (height - textHeight) / 2;
          }
          
          const color = hexToRgb(watermarkColor);
          
          page.drawText(watermarkText, {
            x,
            y,
            size: fontSize,
            font,
            opacity: watermarkOpacity,
            color: rgb(color.r, color.g, color.b),
            rotate: degrees(watermarkRotation),
          });
          
        } else if (watermarkType === 'image' && watermarkImage) {
          // Add image watermark
          const imageBytes = watermarkImage.dataUrl.split(',')[1];
          let embedImage;
          
          // Determine image type and embed accordingly
          if (watermarkImage.dataUrl.includes('data:image/jpeg')) {
            embedImage = await pdfDoc.embedJpg(Buffer.from(imageBytes, 'base64'));
          } else if (watermarkImage.dataUrl.includes('data:image/png')) {
            embedImage = await pdfDoc.embedPng(Buffer.from(imageBytes, 'base64'));
          } else {
            throw new Error('Unsupported image format. Please use JPEG or PNG.');
          }
          
          // Calculate watermark dimensions
          const imgWidth = (Math.min(width, height) / 100) * watermarkSize;
          const imgHeight = (imgWidth / embedImage.width) * embedImage.height;
          
          // Calculate position
          let x, y;
          switch(watermarkPosition) {
            case 'topLeft':
              x = 20;
              y = height - 20 - imgHeight;
              break;
            case 'topRight':
              x = width - 20 - imgWidth;
              y = height - 20 - imgHeight;
              break;
            case 'bottomLeft':
              x = 20;
              y = 20;
              break;
            case 'bottomRight':
              x = width - 20 - imgWidth;
              y = 20;
              break;
            default:
              // Center
              x = (width - imgWidth) / 2;
              y = (height - imgHeight) / 2;
          }
          
          page.drawImage(embedImage, {
            x,
            y,
            width: imgWidth,
            height: imgHeight,
            opacity: watermarkOpacity,
            rotate: degrees(watermarkRotation),
          });
        }
      }
      
      // Save the watermarked PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create download link
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `watermarked_${pdfFile.name}`;
      link.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error adding watermark:', error);
      alert('Error adding watermark. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tool">
      <h2>Add Watermark</h2>
      <p className="tool-description">
        Add text or image watermark to your PDF document
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
              File: <strong>{pdfFile.name}</strong>
            </p>
          </div>
          
          <div className="watermark-options">
            <div className="option-group">
              <label>Watermark Type:</label>
              <div className="radio-options">
                <div className="radio-option">
                  <input
                    type="radio"
                    id="textWatermark"
                    name="watermarkType"
                    value="text"
                    checked={watermarkType === 'text'}
                    onChange={() => setWatermarkType('text')}
                  />
                  <label htmlFor="textWatermark">Text</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="imageWatermark"
                    name="watermarkType"
                    value="image"
                    checked={watermarkType === 'image'}
                    onChange={() => setWatermarkType('image')}
                  />
                  <label htmlFor="imageWatermark">Image</label>
                </div>
              </div>
            </div>
            
            {watermarkType === 'text' ? (
              <>
                <div className="option-group">
                  <label htmlFor="watermarkText">Text:</label>
                  <input
                    type="text"
                    id="watermarkText"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter watermark text"
                  />
                </div>
                
                <div className="option-group">
                  <label htmlFor="watermarkColor">Color:</label>
                  <input
                    type="color"
                    id="watermarkColor"
                    value={watermarkColor}
                    onChange={(e) => setWatermarkColor(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="option-group">
                <label>Image:</label>
                {watermarkImage ? (
                  <div className="watermark-image-preview">
                    <img 
                      src={watermarkImage.dataUrl} 
                      alt="Watermark"
                      className="watermark-img-preview" 
                    />
                    <button onClick={clearWatermarkImage} className="remove-button">
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="upload-button small-button">
                    Select Image
                    <input 
                      ref={imageInputRef}
                      type="file" 
                      accept="image/jpeg, image/png"
                      onChange={handleImageChange} 
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            )}
            
            <div className="option-group">
              <label htmlFor="watermarkOpacity">Opacity: {Math.round(watermarkOpacity * 100)}%</label>
              <input
                type="range"
                id="watermarkOpacity"
                min="0.1"
                max="1"
                step="0.05"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
              />
            </div>
            
            <div className="option-group">
              <label htmlFor="watermarkSize">Size: {watermarkSize}%</label>
              <input
                type="range"
                id="watermarkSize"
                min="10"
                max="100"
                step="5"
                value={watermarkSize}
                onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
              />
            </div>
            
            <div className="option-group">
              <label htmlFor="watermarkRotation">Rotation: {watermarkRotation}°</label>
              <input
                type="range"
                id="watermarkRotation"
                min="0"
                max="360"
                step="5"
                value={watermarkRotation}
                onChange={(e) => setWatermarkRotation(parseInt(e.target.value))}
              />
            </div>
            
            <div className="option-group">
              <label htmlFor="watermarkPosition">Position:</label>
              <select
                id="watermarkPosition"
                value={watermarkPosition}
                onChange={(e) => setWatermarkPosition(e.target.value)}
              >
                <option value="center">Center</option>
                <option value="topLeft">Top Left</option>
                <option value="topRight">Top Right</option>
                <option value="bottomLeft">Bottom Left</option>
                <option value="bottomRight">Bottom Right</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={addWatermark} 
            className="convert-button"
            disabled={isProcessing || (watermarkType === 'image' && !watermarkImage)}
          >
            {isProcessing ? 'Adding Watermark...' : 'Add Watermark'}
          </button>
        </>
      )}
    </div>
  );
}

export default AddWatermark;