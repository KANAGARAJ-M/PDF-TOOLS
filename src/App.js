import React, { useState } from 'react';
import jsPDF from 'jspdf';
import './App.css';

// Add metadata for nocorps.org
/**
 * @fileoverview PDF Tools App by NoCorps (https://nocorps.org)
 * @author NoCorps
 * @copyright NoCorps.org
 * @license MIT
 * @description Multi-tool PDF web app for conversion, merging, splitting, compression, watermarking, protection, repair, and rotation.
 */

// Import existing tool components
import ImageToPdf from './components/ImageToPdf';
import MergePdf from './components/MergePdf';
import SplitPdf from './components/SplitPdf';
import CompressPdf from './components/CompressPdf';

// Import new tool components
import PdfToImages from './components/PdfToImages';
import AddWatermark from './components/AddWatermark';
import ProtectPdf from './components/ProtectPdf';
import RepairPdf from './components/RepairPdf';
import RotatePdf from './components/RotatePdf';

function App() {
  const [selectedTool, setSelectedTool] = useState('imageToPdf');

  const tools = [
    { id: 'imageToPdf', name: 'Image to PDF', description: 'Convert images to PDF files' },
    { id: 'mergePdf', name: 'Merge PDF', description: 'Combine multiple PDFs into one' },
    { id: 'splitPdf', name: 'Split PDF', description: 'Separate PDF pages into files' },
    { id: 'compressPdf', name: 'Compress PDF', description: 'Reduce the size of your PDF' },
    { id: 'pdfToImages', name: 'PDF to Images', description: 'Extract images from PDF files' },
    { id: 'addWatermark', name: 'Add Watermark', description: 'Add text or image watermark to PDF' },
    { id: 'protectPdf', name: 'Protect PDF', description: 'Encrypt and password-protect your PDF' },
    { id: 'repairPdf', name: 'Repair PDF', description: 'Fix damaged or corrupted PDF files' },
    { id: 'rotatePdf', name: 'Rotate PDF', description: 'Rotate pages in your PDF document' },
  ];

  const renderSelectedTool = () => {
    switch (selectedTool) {
      case 'imageToPdf':
        return <ImageToPdf />;
      case 'mergePdf':
        return <MergePdf />;
      case 'splitPdf':
        return <SplitPdf />;
      case 'compressPdf':
        return <CompressPdf />;
      case 'pdfToImages':
        return <PdfToImages />;
      case 'addWatermark':
        return <AddWatermark />;
      case 'protectPdf':
        return <ProtectPdf />;
      case 'repairPdf':
        return <RepairPdf />;
      case 'rotatePdf':
        return <RotatePdf />;
      default:
        return <ImageToPdf />;
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="app-logo">
          <h1>PDF Tools</h1>
        </div>
        <nav className="app-nav">
          {tools.map(tool => (
            <button 
              key={tool.id}
              className={`nav-button ${selectedTool === tool.id ? 'active' : ''}`}
              onClick={() => setSelectedTool(tool.id)}
            >
              {tool.name}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-content">
        <div className="tool-container">
          {renderSelectedTool()}
        </div>
      </main>
      
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} NoCorps PDF Tools - All rights reserved</p>
      </footer>
    </div>
  );
}

export default App;
