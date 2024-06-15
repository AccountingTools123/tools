import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

function App() {
  const [data, setData] = useState(null); // Initialize data as null
  const [headers, setHeaders] = useState([]); // Initialize headers as an empty array
  const [sortConfig, setSortConfig] = useState([]); // Initialize sortConfig as an empty array
  const [filterConfig, setFilterConfig] = useState({}); // Initialize filterConfig as an empty object

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const newData = new Uint8Array(e.target.result);
      const workbook = XLSX.read(newData, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const [newHeaders, ...newRows] = excelData;

      const newDataMap = newRows.reduce((acc, row) => {
        const accountNumber = row[1];
        const rowData = {};
        newHeaders.forEach((header, index) => {
          rowData[header] = row[index] || '';
        });

        acc[accountNumber] = rowData;
        return acc;
      }, {});

      const existingDataMap = data ? data.reduce((acc, row) => {
        const accountNumber = row[headers[1]];
        acc[accountNumber] = row;
        return acc;
      }, {}) : {};

      const mergedData = Object.keys(newDataMap).map(accountNumber => {
        const newRow = newDataMap[accountNumber];
        const existingRow = existingDataMap[accountNumber];

        if (existingRow) {
          newHeaders.forEach(header => {
            if (header !== 'comments') {
              newRow[header] = newRow[header] || existingRow[header];
            }
          });
          newRow.comments = existingRow.comments || newRow.comments || '';
        } else {
          newRow.comments = newRow.comments || '';
        }
        return newRow;
      });

      const additionalRows = data ? Object.keys(existingDataMap)
        .filter(accountNumber => !newDataMap[accountNumber])
        .map(accountNumber => existingDataMap[accountNumber]) : [];

      const finalData = [...mergedData, ...additionalRows];

      setHeaders(newHeaders);
      setData(finalData);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleCommentChange = (index, comment) => {
    setData(prevData => {
      const newData = [...prevData];
      newData[index].comments = comment;
      return newData;
    });
  };

  const handleSaveData = () => {
    if (!data) return; // Handle case where data is not yet loaded
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(applySortAndFilter(data, sortConfig, filterConfig));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, 'updated_data.xlsx');
  };

  const applySortAndFilter = (data, sortConfig, filterConfig) => {
    const filteredData = applyFilter(data, filterConfig);
    const sortedData = applySort(filteredData, sortConfig);
    return sortedData;
  };

  const applySort = (data, sortConfig) => {
    return [...data].sort((a, b) => {
      for (const { key, direction } of sortConfig) {
        const dirMultiplier = direction === 'asc' ? 1 : -1;
        const aValue = parseFloat(a[key]) || 0;
        const bValue = parseFloat(b[key]) || 0;

        if (aValue < bValue) return -1 * dirMultiplier;
        if (aValue > bValue) return 1 * dirMultiplier;
      }
      return 0;
    });
  };

  const applyFilter = (data, filterConfig) => {
    return data.filter(row => {
      return Object.keys(filterConfig).every(key => {
        if (!filterConfig[key]) return true;
        return row[key].toString().includes(filterConfig[key]);
      });
    });
  };

  const handleSort = (header) => {
    let newSortConfig = [...sortConfig];
    const existingIndex = newSortConfig.findIndex(config => config.key === header);
    if (existingIndex !== -1) {
      newSortConfig[existingIndex].direction = newSortConfig[existingIndex].direction === 'asc' ? 'desc' : 'asc';
    } else {
      newSortConfig.push({ key: header, direction: 'desc' });
    }

    // Ensure specific order for sorting
    const predefinedOrder = ['91+ days', '61-90 days', '31-60 days', '1-30 days'];
    newSortConfig = newSortConfig.sort((a, b) => predefinedOrder.indexOf(a.key) - predefinedOrder.indexOf(b.key));

    setSortConfig(newSortConfig);
  };

  const handleFilterChange = (header, value) => {
    setFilterConfig(prevConfig => ({
      ...prevConfig,
      [header]: value
    }));
  };

  const sortedFilteredData = data ? applySortAndFilter(data, sortConfig, filterConfig) : [];

  return (
    <div className="App">
      <header className="App-header">
        <p>Welcome to Accounting Tools 123!</p>
      </header>
      <main>
        <div className="button-container">
          <input type="file" onChange={handleFileUpload} accept=".xlsx, .xls" />
          <button onClick={handleSaveData}>Save Data</button>
        </div>
        {data && ( // Render only if data is loaded
          <div>
            <h2>Excel Data</h2>
            <table>
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th key={index} onClick={() => handleSort(header)}>
                      {header} {sortConfig.find(config => config.key === header) ? (sortConfig.find(config => config.key === header).direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th>Comment</th>
                </tr>
                <tr>
                  {headers.map((header, index) => (
                    <th key={index}>
                      <input
                        type="text"
                        placeholder={`Filter by ${header}`}
                        onChange={(e) => handleFilterChange(header, e.target.value)}
                      />
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedFilteredData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {headers.map((header, cellIndex) => (
                      <td key={cellIndex}>{row[header]}</td>
                    ))}
                    <td>
                      <input
                        type="text"
                        value={row.comments}
                        onChange={(e) => handleCommentChange(rowIndex, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
