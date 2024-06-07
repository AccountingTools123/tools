// Import React and useState
import React, { useState } from 'react';
// Import XLSX library for Excel file parsing
import * as XLSX from 'xlsx'; 
// Import CSS file
import './App.css';

function App() {
  // State to hold user information
  const [user, setUser] = useState(null);
  // State to hold Excel data
  const [data, setData] = useState([]);
  // State to hold column headers
  const [headers, setHeaders] = useState([]);

  // Function to handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const newData = new Uint8Array(e.target.result);
      const workbook = XLSX.read(newData, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Store the headers separately
      const [newHeaders, ...newRows] = excelData;

      // Store the Excel data and headers in state
      setHeaders(newHeaders);

      const existingDataMap = data.reduce((acc, row) => {
        const rowName = row[newHeaders[0]]; // Assuming the first column is the row identifier
        acc[rowName] = row;
        return acc;
      }, {});

      const updatedData = newRows.map(newRow => {
        const rowName = newRow[0];
        const rowData = {};
        newHeaders.forEach((header, index) => {
          rowData[header] = newRow[index] || '';
        });

        if (existingDataMap[rowName]) {
          rowData.comment = existingDataMap[rowName].comment || '';
        } else {
          rowData.comment = '';
        }

        return rowData;
      });

      setData(updatedData);
    };

    reader.readAsArrayBuffer(file);
  };

  // Function to handle saving comments
  const handleCommentChange = (index, comment) => {
    setData(prevData => {
      const newData = [...prevData];
      newData[index].comment = comment;
      return newData;
    });
  };

  // Function to handle saving updated data as Excel file
  const handleSaveData = () => {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    // Save workbook as Excel file
    XLSX.writeFile(workbook, 'updated_data.xlsx');
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>Welcome to Accounting Tools 123!</p>
      </header>
      <main>
        {/* File upload input */}
        <input type="file" onChange={handleFileUpload} accept=".xlsx, .xls" />
        {/* Display Excel data */}
        <div>
          <h2>Excel Data</h2>
          <table>
            <thead>
              <tr>
                {/* Render table headers dynamically */}
                {headers.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
                <th>Comment</th> {/* Add a header for the comment column */}
              </tr>
            </thead>
            <tbody>
              {/* Render table rows dynamically */}
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header, cellIndex) => (
                    <td key={cellIndex}>{row[header]}</td>
                  ))}
                  <td>
                    {/* Add a text box for entering comments */}
                    <input
                      type="text"
                      value={row.comment}
                      onChange={(e) => handleCommentChange(rowIndex, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSaveData}>Save Data</button> {/* Button to save updated data */}
        </div>
      </main>
    </div>
  );
}

export default App;
