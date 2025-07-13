// Block 13 Implementation: CSV Import Wizard Scaffold
import React, { useState } from 'react';

const MOCK_HEADERS = ['Date', 'Symbol', 'Quantity', 'Price', 'Side'];
const MOCK_SAMPLE_ROWS: Array<Record<string, string>> = [
  { Date: '2024-06-01', Symbol: 'BTC', Quantity: '0.5', Price: '68000', Side: 'Buy' },
  { Date: '2024-06-02', Symbol: 'ETH', Quantity: '2', Price: '3800', Side: 'Sell' },
  { Date: '2024-06-03', Symbol: 'TSLA', Quantity: '10', Price: '180', Side: 'Buy' },
];

const STEPS = [
  'Upload CSV',
  'Map Columns',
  'Preview Rows',
  'Confirm Import',
];

export default function CSVImportWizard() {
  // Block 13 Implementation: Step state
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState('');
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});

  // Block 13 Implementation: Handlers (mock only)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleMapChange = (csvCol: string, mappedTo: string) => {
    setColumnMap(prev => ({ ...prev, [csvCol]: mappedTo }));
  };

  const handleNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setStep(s => Math.max(s - 1, 0));
  const handleRestart = () => {
    setStep(0);
    setFileName('');
    setColumnMap({});
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 mt-8">
      {/* Block 13 Implementation: Stepper */}
      <div className="flex items-center mb-6">
        {STEPS.map((label, idx) => (
          <React.Fragment key={label}>
            <div className={`flex items-center ${idx === step ? 'text-primary font-bold' : 'text-muted-foreground'}`}> 
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${idx === step ? 'bg-primary text-white' : 'bg-muted'}`}>{idx + 1}</div>
              <span className="ml-2 text-sm">{label}</span>
            </div>
            {idx < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-muted mx-2" />}
          </React.Fragment>
        ))}
      </div>

      {/* Block 13 Implementation: Step Content */}
      {step === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <label className="block mb-4 text-lg font-medium">Upload your CSV file</label>
          <input type="file" accept=".csv" className="mb-4" onChange={handleFileChange} disabled />
          <div className="text-muted-foreground mb-2">(CSV upload coming soon)</div>
          {fileName && <div className="mb-2">Selected: <span className="font-mono">{fileName}</span></div>}
          <button className="btn btn-primary mt-4 px-4 py-2 rounded bg-primary text-white" onClick={handleNext}>Next</button>
        </div>
      )}
      {step === 1 && (
        <div className="flex flex-col gap-6 min-h-[200px]">
          <div className="mb-2 text-lg font-medium">Map CSV Columns</div>
          <div className="grid grid-cols-1 gap-4">
            {MOCK_HEADERS.map(header => (
              <div key={header} className="flex items-center gap-4">
                <span className="w-32 font-mono">{header}</span>
                <select
                  className="border rounded px-2 py-1 bg-background"
                  value={columnMap[header] || ''}
                  onChange={e => handleMapChange(header, e.target.value)}
                >
                  <option value="">Select field</option>
                  <option value="date">Date</option>
                  <option value="symbol">Symbol</option>
                  <option value="quantity">Quantity</option>
                  <option value="price">Price</option>
                  <option value="side">Side</option>
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <button className="btn btn-outline px-4 py-2 rounded border" onClick={handleBack}>Back</button>
            <button className="btn btn-primary px-4 py-2 rounded bg-primary text-white" onClick={handleNext}>Next</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col gap-6 min-h-[200px]">
          <div className="mb-2 text-lg font-medium">Preview Rows</div>
          <div className="overflow-x-auto">
            <table className="min-w-full border rounded">
              <thead>
                <tr>
                  {MOCK_HEADERS.map(h => (
                    <th key={h} className="px-3 py-2 border-b bg-muted text-left font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_SAMPLE_ROWS.map((row, i) => (
                  <tr key={i} className="odd:bg-muted/30">
                    {MOCK_HEADERS.map(h => (
                      <td key={h} className="px-3 py-2 border-b font-mono text-xs">{row[h as keyof typeof row]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between mt-6">
            <button className="btn btn-outline px-4 py-2 rounded border" onClick={handleBack}>Back</button>
            <button className="btn btn-primary px-4 py-2 rounded bg-primary text-white" onClick={handleNext}>Next</button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <div className="text-2xl font-bold mb-2">Import Complete!</div>
          <div className="text-muted-foreground mb-4">Your trades have been (mock) imported.</div>
          <button className="btn btn-primary px-4 py-2 rounded bg-primary text-white" onClick={handleRestart}>Import Another</button>
        </div>
      )}
    </div>
  );
} 