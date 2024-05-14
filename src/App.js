import React, { useState } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Tesseract from 'tesseract.js'; // Import Tesseract.js for OCR
import './App.css';

function App() {
  const [files, setFiles] = useState(null);
  const [filenamePrefix, setFilenamePrefix] = useState('');
  const [invoiceText, setInvoiceText] = useState('');

  const handleFileChange = (event) => {
    setFiles(event.target.files);
  }

  const handlePrefixChange = (event) => {
    setFilenamePrefix(event.target.value);
  }

  const handleDownload = () => {
    if (!files) {
      alert('Please select files to compress.');
      return;
    }

    let zip = new JSZip();
    Array.from(files).forEach((file, index) => {
      let newName = filenamePrefix + (index + 1);
      zip.file(newName, file);
    });

    zip.generateAsync({ type: 'blob' })
      .then((content) => {
        saveAs(content, 'output.zip');
      });
  }

  const rename = () => {
    const data = {
      "files": files,
      "filenamePrefix": filenamePrefix
    }
    axios.post('http://localhost:3000/rename', data)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  const handleDownloadInvoice = () => {
    if (!invoiceText) {
      alert('Invoice is not generated yet.');
      return;
    }
    // For simplicity, let's just download the text as a text file
    const blob = new Blob([invoiceText], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'invoice.txt');
  }

  const generateInvoice = () => {
    if (!files) {
      alert('Please select files to generate invoice.');
      return;
    }

    // Use Tesseract.js for OCR
    Tesseract.recognize(
      files[0], // Assuming only one file is selected
      'eng', // Language
      { logger: m => console.log(m) } // Optional logger
    ).then(({ data: { text } }) => {
      // Set the generated invoice text
      setInvoiceText(text);
    }).catch(error => {
      console.error(error);
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        <p>Welcome to Accounting Tools 123!</p>
      </header>
      
      <body>
        <div className="icons">
          <div>
            <p>Click here to rename your files</p>
            <div><img src="/rename.png" /></div>
            
            <input type="file" id="files" multiple onChange={handleFileChange} required />
            <input type="text" id="filenamePrefix" placeholder="Enter filename prefix" value={filenamePrefix} onChange={handlePrefixChange} />
            <button onClick={handleDownload}>Compress & Download ZIP File</button>
            <button onClick={rename}>Rename Files</button>
          </div>
  
          <div>
            <p>Click here to generate invoices</p>
            <div><img src="/invoice.png" /></div>
            
            <input type="file" id="files" onChange={handleFileChange} required />
            <p>only JPEG, PNG, or TIFF acceptable</p>
            <button onClick={generateInvoice}>Generate Invoice</button>
            <div>
              <p>Invoice Text:</p>
              <textarea value={invoiceText} readOnly />
              <button onClick={handleDownloadInvoice}>Download Invoice</button>
            </div>
          </div>
          
          <div>
            <p>Click here to create an expense report</p>
            <div><img src="/expense.png" /></div>
            
            <input type="file" id="files" onChange={handleFileChange} required />
            <p>only JPEG, PNG, or TIFF acceptable</p>
            <button onClick={generateInvoice}>Generate Expense Report</button>
            <div>
              <p>Expense Report:</p>
              <textarea value={invoiceText} readOnly />
              <button onClick={handleDownloadInvoice}>Download Expense Report</button>
            </div>
          </div>
        </div>
      </body>
    </div>
  );
}

export default App;
