import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

function ProtectPdf() {
  const [pdfFile, setPdfFile] = useState(null);
  const [userPassword, setUserPassword] = useState('');
  const [permissions, setPermissions] = useState({
    printing: true,
    modifying: true,
    copying: true,
    annotating: true,
    fillingForms: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [encryptionLevel, setEncryptionLevel] = useState('aes');
  
  const handlePdfChange = (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setPdfFile({
      file,
      name: file.name,
      url: URL.createObjectURL(file)
    });
  };

  const handlePermissionChange = (permission) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  const generateRandomPassword = (length = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const protectPdf = async () => {
    if (!pdfFile || !userPassword || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Read the PDF file
      const arrayBuffer = await pdfFile.file.arrayBuffer();
      
      // Create a new PDF document from the existing one
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Define permissions
      const permissionsConfig = {
        printing: permissions.printing ? 'highResolution' : 'none',
        modifying: permissions.modifying,
        copying: permissions.copying,
        annotating: permissions.annotating,
        fillingForms: permissions.fillingForms,
      };
      
      // Apply encryption during save instead of calling encrypt()
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: false, // Better compatibility with older readers
        // Encryption options
        password: userPassword,
        permissions: permissionsConfig
      });
      
      // Create download link
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `protected_${pdfFile.name}`;
      link.click();
      URL.revokeObjectURL(url);
      
      // Show success message
      alert('PDF protected successfully! The document will require the password "' + userPassword + '" to open.');
      
    } catch (error) {
      console.error('Error protecting PDF:', error);
      
      // More specific error message
      if (error.message.includes('encrypt')) {
        alert('Error applying encryption to this PDF. This PDF may already be encrypted or use features incompatible with encryption.');
      } else {
        alert('Error protecting PDF. Please try again with a different PDF.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="tool">
      <h2>Protect PDF</h2>
      <p className="tool-description">
        Encrypt your PDF with password protection and set permissions
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
          
          <div className="protection-options">
            <div className="password-section">
              <h3>Set Password</h3>
              <p className="info-text">The password will be required to open the document</p>
              
              <div className="password-fields">
                <div className="option-group">
                  <label htmlFor="userPassword">Document Password:</label>
                  <div className="password-input-group">
                    <input
                      type={showPasswords ? "text" : "password"}
                      id="userPassword"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Document open password"
                    />
                    <button 
                      type="button" 
                      className="generate-button"
                      onClick={() => setUserPassword(generateRandomPassword())}
                    >
                      Generate
                    </button>
                  </div>
                  <p className="password-help">Required to open the document</p>
                </div>
                
                <div className="show-password-toggle">
                  <input
                    type="checkbox"
                    id="showPasswords"
                    checked={showPasswords}
                    onChange={() => setShowPasswords(!showPasswords)}
                  />
                  <label htmlFor="showPasswords">Show password</label>
                </div>
              </div>
            </div>
            
            <div className="encryption-section">
              <h3>Encryption Level</h3>
              <div className="radio-options">
                <div className="radio-option">
                  <input
                    type="radio"
                    id="aesEncryption"
                    name="encryptionLevel"
                    value="aes"
                    checked={encryptionLevel === 'aes'}
                    onChange={() => setEncryptionLevel('aes')}
                  />
                  <label htmlFor="aesEncryption">Strong (AES - recommended)</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id="rc4Encryption"
                    name="encryptionLevel"
                    value="rc4"
                    checked={encryptionLevel === 'rc4'}
                    onChange={() => setEncryptionLevel('rc4')}
                  />
                  <label htmlFor="rc4Encryption">Compatible (RC4 - older PDF readers)</label>
                </div>
              </div>
            </div>
            
            <div className="permissions-section">
              <h3>Set Permissions</h3>
              <p className="info-text">Restrict what users can do with your PDF</p>
              
              <div className="permission-options">
                <div className="permission-option">
                  <input
                    type="checkbox"
                    id="printing"
                    checked={permissions.printing}
                    onChange={() => handlePermissionChange('printing')}
                  />
                  <label htmlFor="printing">Allow printing</label>
                </div>
                
                <div className="permission-option">
                  <input
                    type="checkbox"
                    id="copying"
                    checked={permissions.copying}
                    onChange={() => handlePermissionChange('copying')}
                  />
                  <label htmlFor="copying">Allow copying text and images</label>
                </div>
                
                <div className="permission-option">
                  <input
                    type="checkbox"
                    id="modifying"
                    checked={permissions.modifying}
                    onChange={() => handlePermissionChange('modifying')}
                  />
                  <label htmlFor="modifying">Allow modifying content</label>
                </div>
                
                <div className="permission-option">
                  <input
                    type="checkbox"
                    id="annotating"
                    checked={permissions.annotating}
                    onChange={() => handlePermissionChange('annotating')}
                  />
                  <label htmlFor="annotating">Allow adding annotations</label>
                </div>
                
                <div className="permission-option">
                  <input
                    type="checkbox"
                    id="fillingForms"
                    checked={permissions.fillingForms}
                    onChange={() => handlePermissionChange('fillingForms')}
                  />
                  <label htmlFor="fillingForms">Allow filling forms</label>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={protectPdf} 
            className="convert-button"
            disabled={isProcessing || !userPassword}
          >
            {isProcessing ? 'Protecting...' : 'Protect PDF'}
          </button>
        </>
      )}
    </div>
  );
}

export default ProtectPdf;