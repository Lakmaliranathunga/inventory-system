import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './Reports.css';

const API = 'http://localhost:5000';
const getToken = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];



const REPORT_TYPES = [
  { id: 'monthly',           label: 'Monthly Inventory',    icon: 'bi-calendar-month' },
  { id: 'yearly',            label: 'Yearly Inventory',     icon: 'bi-calendar3' },
  { id: 'item-wise',         label: 'Item Wise',            icon: 'bi-box-seam' },
  { id: 'division-wise',     label: 'Division Wise',        icon: 'bi-building' },
  { id: 'section-wise',      label: 'Section Wise',         icon: 'bi-diagram-3' },
];

// ========== PRINT UTILITY ==========
function printTable(title, html) {
  const w = window.open('', '_blank');
  w.document.write(`
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .print-header { text-align:center; margin-bottom: 16px; }
        .print-header h2 { color: #1a3a5c; margin:0; font-size:16px; }
        .print-header p { color: #555; font-size: 11px; margin: 4px 0 0; }
        table { width:100%; border-collapse:collapse; }
        th { background:#1a3a5c; color:#fff; padding:8px; text-align:left; font-size:11px; }
        td { padding:7px 8px; border-bottom:1px solid #eee; font-size:11px; }
        tfoot td { font-weight:bold; border-top:2px solid #2563a8; background:#f1f5f9; }
        @media print { .no-print { display:none; } }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h2>Sri Lanka Ports Authority</h2>
        <p>Inventory Management System – ${title}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
      </div>
      ${html}
      <br/>
      <button class="no-print" onclick="window.print()">Print</button>
    </body>
    </html>
  `);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

// ========== MAIN COMPONENT ==========
const Reports = () => {
  const [activeReport, setActiveReport] = useState('monthly');
  const [dashStats, setDashStats] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [divisions, setDivisions] = useState([]);
  const [sections, setSections] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Filters
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [transactionType, setTransactionType] = useState('');

  const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchDashboard();
    fetchDropdowns();
  }, []);

  const fetchDashboard = async () => {
    setDashLoading(true);
    try {
      const res = await axios.get(`${API}/api/reports/dashboard`, getToken());
      if (res.data.success) setDashStats(res.data.stats);
    } catch (e) {
      console.error(e);
    } finally {
      setDashLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [divRes, secRes, supRes] = await Promise.all([
        axios.get(`${API}/divisions`, getToken()),
        axios.get(`${API}/sections`, getToken()),
        axios.get(`${API}/api/suppliers`, getToken()),
      ]);
      setDivisions(divRes.data || []);
      setSections(secRes.data || []);
      setSuppliers(supRes.data.suppliers || []);
    } catch (e) { console.error(e); }
  };

  const generateReport = useCallback(async () => {
    setReportLoading(true);
    setGenerated(false);
    let url = '';
    const params = {};

    switch (activeReport) {
      case 'monthly':
        url = `${API}/api/reports/monthly`;
        if (year) params.year = year;
        if (month) params.month = month;
        break;
      case 'yearly':
        url = `${API}/api/reports/yearly`;
        if (year) params.year = year;
        break;
      case 'item-wise':
        url = `${API}/api/reports/item-wise`;
        if (itemSearch) params.query = itemSearch;
        break;
      case 'division-wise':
        url = `${API}/api/reports/division-wise`;
        if (divisionId) params.divisionId = divisionId;
        break;
      case 'section-wise':
        url = `${API}/api/reports/section-wise`;
        if (sectionId) params.sectionId = sectionId;
        if (divisionId) params.divisionId = divisionId;
        break;
      case 'supplier':
        url = `${API}/api/reports/supplier`;
        break;
      case 'invoice':
        url = `${API}/api/reports/invoice`;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (supplierId) params.supplierId = supplierId;
        if (invoiceNumber) params.invoiceNumber = invoiceNumber;
        break;
      case 'stock-transactions':
        url = `${API}/api/reports/stock-transactions`;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (transactionType) params.type = transactionType;
        break;
      case 'low-stock':
        url = `${API}/api/reports/low-stock`;
        break;
      case 'complete':
        url = `${API}/api/reports/complete`;
        break;
      default:
        setReportLoading(false);
        return;
    }

    try {
      const res = await axios.get(url, { ...getToken(), params });
      setReportData(res.data.data || []);
      setGenerated(true);
    } catch (e) {
      console.error(e);
      setReportData([]);
      setGenerated(true);
    } finally {
      setReportLoading(false);
    }
  }, [activeReport, year, month, divisionId, sectionId, supplierId, itemSearch, startDate, endDate, invoiceNumber, transactionType]);

  // ====== EXPORT PDF ======
  const exportPDF = () => {
    const reportLabel = REPORT_TYPES.find(r => r.id === activeReport)?.label || 'Report';
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.setTextColor(26, 58, 92);
    doc.text('Sri Lanka Ports Authority', 14, 15);
    doc.setFontSize(11);
    doc.text(`Inventory Management System – ${reportLabel}`, 14, 22);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Records: ${reportData.length}`, 14, 34);

    const { head, body } = getTableHeadBody();
    autoTable(doc, {
      head: [head],
      body: body,
      startY: 40,
      headStyles: { fillColor: [26, 58, 92], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`${reportLabel.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // ====== EXPORT EXCEL ======
  const exportExcel = () => {
    const reportLabel = REPORT_TYPES.find(r => r.id === activeReport)?.label || 'Report';
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportLabel.substring(0, 31));
    XLSX.writeFile(wb, `${reportLabel.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // ====== PRINT ======
  const handlePrint = () => {
    const reportLabel = REPORT_TYPES.find(r => r.id === activeReport)?.label || 'Report';
    const { head, body } = getTableHeadBody();
    const tHead = `<tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>`;
    const tBody = body.map(row => `<tr>${row.map(cell => `<td>${cell ?? ''}</td>`).join('')}</tr>`).join('');
    const html = `<table><thead>${tHead}</thead><tbody>${tBody}</tbody></table>`;
    printTable(reportLabel, html);
  };

  // ====== TABLE DATA BUILDER ======
  const getTableHeadBody = () => {
    let head = [];
    let body = [];

    switch (activeReport) {
      case 'monthly':
      case 'yearly':
      case 'complete':
        head = ['#', 'Item Code', 'Item Name', 'Type', 'Main Category', 'Sub Category', 'Division', 'Section', 'Qty', 'Condition', 'Purchase Date', 'Warranty Date'];
        body = reportData.map((d, i) => [
          i + 1, d.itemCode, d.itemName, d.itemTypeName, d.mainCategoryName, d.subCategoryName,
          d.divisionName, d.sectionName, d.quantity, d.itemCondition,
          d.purchaseDate ? new Date(d.purchaseDate).toLocaleDateString() : '–',
          d.warrantyExpireDate ? new Date(d.warrantyExpireDate).toLocaleDateString() : '–'
        ]);
        break;
      case 'item-wise':
        head = ['#', 'Item Code', 'Item Name', 'Type', 'Category', 'Sub Category', 'Division', 'Section', 'Qty', 'Condition', 'Purchase Date'];
        body = reportData.map((d, i) => [
          i + 1, d.itemCode, d.itemName, d.itemTypeName, d.mainCategoryName, d.subCategoryName,
          d.divisionName, d.sectionName, d.quantity, d.itemCondition,
          d.purchaseDate ? new Date(d.purchaseDate).toLocaleDateString() : '–'
        ]);
        break;
      case 'division-wise':
        head = ['#', 'Item Code', 'Item Name', 'Division', 'Section', 'Qty', 'Condition', 'Purchase Date'];
        body = reportData.map((d, i) => [
          i + 1, d.itemCode, d.itemName, d.divisionName, d.sectionName, d.quantity,
          d.itemCondition, d.purchaseDate ? new Date(d.purchaseDate).toLocaleDateString() : '–'
        ]);
        break;
      case 'section-wise':
        head = ['#', 'Item Code', 'Item Name', 'Division', 'Section', 'Qty', 'Condition'];
        body = reportData.map((d, i) => [
          i + 1, d.itemCode, d.itemName, d.divisionName, d.sectionName, d.quantity, d.itemCondition
        ]);
        break;
      case 'supplier':
        head = ['#', 'Supplier Name', 'Contact Person', 'Contact No', 'Email', 'Address', 'Total Invoices', 'Total Value (LKR)'];
        body = reportData.map((d, i) => [
          i + 1, d.supplierName, d.contactPerson, d.contactNo, d.email, d.address,
          d.totalInvoices, Number(d.totalValue).toLocaleString('en-LK', { minimumFractionDigits: 2 })
        ]);
        break;
      case 'invoice':
        head = ['#', 'Invoice No', 'Supplier', 'PO No', 'PO Date', 'Invoice Date', 'Amount (LKR)', 'Remarks'];
        body = reportData.map((d, i) => [
          i + 1, d.invoiceNumber, d.supplierName, d.poNo, 
          d.poDate ? new Date(d.poDate).toLocaleDateString() : '–',
          d.invoiceDate ? new Date(d.invoiceDate).toLocaleDateString() : '–',
          Number(d.totalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2 }), d.remarks
        ]);
        break;
      case 'stock-transactions':
        head = ['#', 'Date', 'Type', 'Item Code', 'Item Name', 'Qty', 'From Location', 'To Location', 'Handled By', 'Remarks'];
        body = reportData.map((d, i) => [
          i + 1,
          d.transactionDate ? new Date(d.transactionDate).toLocaleDateString() : '–',
          d.transactionType, d.itemCode, d.itemName, d.quantity,
          d.fromLocation || '–', d.toLocation || '–', d.handledByName || '–', d.remarks || '–'
        ]);
        break;
      case 'low-stock':
        head = ['#', 'Item Code', 'Item Name', 'Type', 'Division', 'Section', 'Current Qty', 'Condition'];
        body = reportData.map((d, i) => [
          i + 1, d.itemCode, d.itemName, d.itemTypeName, d.divisionName, d.sectionName, d.quantity, d.itemCondition
        ]);
        break;
      default:
        head = Object.keys(reportData[0] || {});
        body = reportData.map(d => head.map(k => d[k]));
    }

    return { head, body };
  };

  const totalQty = reportData.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
  const totalAmount = reportData.reduce((acc, r) => acc + (Number(r.totalAmount) || Number(r.totalValue) || 0), 0);

  // ====== CONDITION BADGE ======
  const condBadge = (c) => {
    const map = { Good: 'good', New: 'new', Fair: 'fair', Poor: 'poor' };
    return <span className={`badge-condition badge-${map[c] || 'new'}`}>{c || '–'}</span>;
  };

  const txBadge = (t) => {
    const map = {
      'Stock In': 'stockin', 'Stock Out': 'stockout', 'Transfer': 'transfer',
      'Return': 'return', 'Damaged': 'damaged', 'Disposal': 'disposal'
    };
    return <span className={`badge-condition badge-${map[t] || 'new'}`}>{t}</span>;
  };



  // ====== RENDER TABLE ROWS ======
  const renderTableRows = () => {
    if (activeReport === 'monthly' || activeReport === 'yearly' || activeReport === 'complete') {
      return reportData.map((d, i) => (
        <tr key={i}>
          <td>{i + 1}</td>
          <td><code style={{fontSize:'0.76rem'}}>{d.itemCode}</code></td>
          <td>{d.itemName}</td>
          <td>{d.itemTypeName}</td>
          <td>{d.mainCategoryName}</td>
          <td>{d.subCategoryName}</td>
          <td>{d.divisionName}</td>
          <td>{d.sectionName}</td>
          <td><strong>{d.quantity}</strong></td>
          <td>{condBadge(d.itemCondition)}</td>
          <td>{d.purchaseDate ? new Date(d.purchaseDate).toLocaleDateString() : '–'}</td>
          <td>{d.warrantyExpireDate ? new Date(d.warrantyExpireDate).toLocaleDateString() : '–'}</td>
        </tr>
      ));
    }
    if (activeReport === 'item-wise') {
      return reportData.map((d, i) => (
        <tr key={i}>
          <td>{i + 1}</td>
          <td><code style={{fontSize:'0.76rem'}}>{d.itemCode}</code></td>
          <td>{d.itemName}</td>
          <td>{d.itemTypeName}</td>
          <td>{d.mainCategoryName}</td>
          <td>{d.subCategoryName}</td>
          <td>{d.divisionName}</td>
          <td>{d.sectionName}</td>
          <td><strong>{d.quantity}</strong></td>
          <td>{condBadge(d.itemCondition)}</td>
          <td>{d.purchaseDate ? new Date(d.purchaseDate).toLocaleDateString() : '–'}</td>
        </tr>
      ));
    }
    if (activeReport === 'division-wise') {
      return reportData.map((d, i) => (
        <tr key={i}>
          <td>{i + 1}</td>
          <td><code style={{fontSize:'0.76rem'}}>{d.itemCode}</code></td>
          <td>{d.itemName}</td>
          <td>{d.divisionName}</td>
          <td>{d.sectionName}</td>
          <td><strong>{d.quantity}</strong></td>
          <td>{condBadge(d.itemCondition)}</td>
          <td>{d.purchaseDate ? new Date(d.purchaseDate).toLocaleDateString() : '–'}</td>
        </tr>
      ));
    }
    if (activeReport === 'section-wise') {
      return reportData.map((d, i) => (
        <tr key={i}>
          <td>{i + 1}</td>
          <td><code style={{fontSize:'0.76rem'}}>{d.itemCode}</code></td>
          <td>{d.itemName}</td>
          <td>{d.divisionName}</td>
          <td>{d.sectionName}</td>
          <td><strong>{d.quantity}</strong></td>
          <td>{condBadge(d.itemCondition)}</td>
        </tr>
      ));
    }
    if (activeReport === 'supplier') {
      return reportData.map((d, i) => (
        <tr key={i}>
          <td>{i + 1}</td>
          <td><strong>{d.supplierName}</strong></td>
          <td>{d.contactPerson}</td>
          <td>{d.contactNo}</td>
          <td>{d.email}</td>
          <td style={{maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.address}</td>
          <td><strong>{d.totalInvoices}</strong></td>
          <td><strong>{Number(d.totalValue).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong></td>
        </tr>
      ));
    }
    if (activeReport === 'invoice') {
      return reportData.map((d, i) => (
        <tr key={i}>
          <td>{i + 1}</td>
          <td><code style={{fontSize:'0.76rem'}}>{d.invoiceNumber}</code></td>
          <td>{d.supplierName}</td>
          <td>{d.poNo}</td>
          <td>{d.poDate ? new Date(d.poDate).toLocaleDateString() : '–'}</td>
          <td>{d.invoiceDate ? new Date(d.invoiceDate).toLocaleDateString() : '–'}</td>
          <td><strong>{Number(d.totalAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong></td>
          <td>{d.remarks}</td>
        </tr>
      ));
    }
    if (activeReport === 'stock-transactions') {
      return reportData.map((d, i) => (
        <tr key={i}>
          <td>{i + 1}</td>
          <td>{d.transactionDate ? new Date(d.transactionDate).toLocaleDateString() : '–'}</td>
          <td>{txBadge(d.transactionType)}</td>
          <td><code style={{fontSize:'0.76rem'}}>{d.itemCode}</code></td>
          <td>{d.itemName}</td>
          <td><strong>{d.quantity}</strong></td>
          <td>{d.fromLocation || '–'}</td>
          <td>{d.toLocation || '–'}</td>
          <td>{d.handledByName || '–'}</td>
          <td>{d.remarks || '–'}</td>
        </tr>
      ));
    }
    if (activeReport === 'low-stock') {
      return reportData.map((d, i) => (
        <tr key={i}>
          <td>{i + 1}</td>
          <td><code style={{fontSize:'0.76rem'}}>{d.itemCode}</code></td>
          <td>{d.itemName}</td>
          <td>{d.itemTypeName}</td>
          <td>{d.divisionName}</td>
          <td>{d.sectionName}</td>
          <td><span style={{color:'#dc2626',fontWeight:'700'}}>{d.quantity}</span></td>
          <td>{condBadge(d.itemCondition)}</td>
        </tr>
      ));
    }
    return null;
  };

  // ====== TABLE HEADERS ======
  const renderTableHeader = () => {
    const headers = {
      'monthly':           ['#', 'Item Code', 'Item Name', 'Type', 'Main Category', 'Sub Category', 'Division', 'Section', 'Qty', 'Condition', 'Purchase Date', 'Warranty Date'],
      'yearly':            ['#', 'Item Code', 'Item Name', 'Type', 'Main Category', 'Sub Category', 'Division', 'Section', 'Qty', 'Condition', 'Purchase Date', 'Warranty Date'],
      'item-wise':         ['#', 'Item Code', 'Item Name', 'Type', 'Main Category', 'Sub Category', 'Division', 'Section', 'Qty', 'Condition', 'Purchase Date'],
      'division-wise':     ['#', 'Item Code', 'Item Name', 'Division', 'Section', 'Qty', 'Condition', 'Purchase Date'],
      'section-wise':      ['#', 'Item Code', 'Item Name', 'Division', 'Section', 'Qty', 'Condition'],
      'supplier':          ['#', 'Supplier Name', 'Contact Person', 'Contact No', 'Email', 'Address', 'Total Invoices', 'Total Value (LKR)'],
      'invoice':           ['#', 'Invoice No', 'Supplier', 'PO No', 'PO Date', 'Invoice Date', 'Amount (LKR)', 'Remarks'],
      'stock-transactions':['#', 'Date', 'Type', 'Item Code', 'Item Name', 'Qty', 'From Location', 'To Location', 'Handled By', 'Remarks'],
      'low-stock':         ['#', 'Item Code', 'Item Name', 'Type', 'Division', 'Section', 'Current Qty', 'Condition'],
      'complete':          ['#', 'Item Code', 'Item Name', 'Type', 'Main Category', 'Sub Category', 'Division', 'Section', 'Qty', 'Condition', 'Purchase Date', 'Warranty Date'],
    };
    return (headers[activeReport] || []).map((h, i) => <th key={i}>{h}</th>);
  };

  // ====== FILTER PANEL ======
  const renderFilters = () => {
    if (activeReport === 'dashboard') return null;

    return (
      <div className="report-filter-panel">
        <h6><i className="bi bi-funnel me-2"></i>Filter Options</h6>
        <div className="row g-3 align-items-end">

          {/* Year */}
          {['monthly', 'yearly'].includes(activeReport) && (
            <div className="col-md-2 col-sm-4">
              <label className="form-label">Year</label>
              <select className="form-select" value={year} onChange={e => setYear(e.target.value)}>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {/* Month */}
          {activeReport === 'monthly' && (
            <div className="col-md-2 col-sm-4">
              <label className="form-label">Month</label>
              <select className="form-select" value={month} onChange={e => setMonth(e.target.value)}>
                <option value="">All Months</option>
                {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
          )}

          {/* Item Search */}
          {activeReport === 'item-wise' && (
            <div className="col-md-4">
              <label className="form-label">Search (Item Code / Name / Type / Category)</label>
              <input className="form-control" type="text" value={itemSearch} onChange={e => setItemSearch(e.target.value)} placeholder="Enter item code, name, or category..." />
            </div>
          )}

          {/* Division */}
          {['division-wise', 'section-wise'].includes(activeReport) && (
            <div className="col-md-3 col-sm-6">
              <label className="form-label">Division</label>
              <select className="form-select" value={divisionId} onChange={e => setDivisionId(e.target.value)}>
                <option value="">All Divisions</option>
                {divisions.map(d => <option key={d.divisionId} value={d.divisionId}>{d.divisionName}</option>)}
              </select>
            </div>
          )}

          {/* Section */}
          {activeReport === 'section-wise' && (
            <div className="col-md-3 col-sm-6">
              <label className="form-label">Section</label>
              <select className="form-select" value={sectionId} onChange={e => setSectionId(e.target.value)}>
                <option value="">All Sections</option>
                {sections
                  .filter(s => !divisionId || s.divisionId === Number(divisionId))
                  .map(s => <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>)
                }
              </select>
            </div>
          )}

          {/* Invoice Filters */}
          {activeReport === 'invoice' && (
            <>
              <div className="col-md-2 col-sm-6">
                <label className="form-label">Invoice No</label>
                <input className="form-control" type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Search invoice..." />
              </div>
              <div className="col-md-3 col-sm-6">
                <label className="form-label">Supplier</label>
                <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                  <option value="">All Suppliers</option>
                  {suppliers.map(s => <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Date Range */}
          {['invoice', 'stock-transactions'].includes(activeReport) && (
            <>
              <div className="col-md-2 col-sm-6">
                <label className="form-label">Start Date</label>
                <input className="form-control" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="col-md-2 col-sm-6">
                <label className="form-label">End Date</label>
                <input className="form-control" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </>
          )}

          {/* Transaction Type */}
          {activeReport === 'stock-transactions' && (
            <div className="col-md-2 col-sm-6">
              <label className="form-label">Transaction Type</label>
              <select className="form-select" value={transactionType} onChange={e => setTransactionType(e.target.value)}>
                <option value="">All Types</option>
                <option>Stock In</option>
                <option>Stock Out</option>
                <option>Transfer</option>
                <option>Return</option>
                <option>Damaged</option>
                <option>Disposal</option>
              </select>
            </div>
          )}

          <div className="col-md-2 col-sm-12">
            <button className="report-generate-btn w-100" onClick={generateReport} disabled={reportLoading}>
              {reportLoading
                ? <><span className="spinner-border spinner-border-sm me-1"></span> Generating...</>
                : <><i className="bi bi-play-circle"></i> Generate</>
              }
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ====== DASHBOARD VIEW ======
  const renderDashboard = () => (
    <>
    </>
  );

  // ====== MAIN RENDER ======
  return (
    <div className="reports-page">
      {/* PAGE HEADER */}
      <div className="reports-page-header">
        <div className="reports-page-header-left">
          <h2><i className="bi bi-file-earmark-bar-graph me-2"></i>Reports Module</h2>
          <p>Sri Lanka Ports Authority – Inventory Management System</p>
        </div>
        <i className="bi bi-file-earmark-bar-graph-fill reports-page-header-icon"></i>
      </div>

      {/* REPORT TYPE TABS */}
      <div className="report-type-tabs">
        {REPORT_TYPES.map(r => (
          <button
            key={r.id}
            className={`report-tab-btn ${activeReport === r.id ? 'active' : ''}`}
            onClick={() => { setActiveReport(r.id); setGenerated(false); setReportData([]); }}
          >
            <i className={`bi ${r.icon}`}></i>
            {r.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {activeReport === 'dashboard' && (
        dashLoading
          ? <div className="report-loading"><span className="spinner-border spinner-border-sm me-2"></span>Loading dashboard...</div>
          : renderDashboard()
      )}

      {/* FILTERS */}
      {activeReport !== 'dashboard' && renderFilters()}

      {/* RESULTS TABLE */}
      {activeReport !== 'dashboard' && generated && (
        <div className="report-results-panel">
          <div className="report-results-header">
            <h6>
              <i className="bi bi-table me-2"></i>
              {REPORT_TYPES.find(r => r.id === activeReport)?.label}
              <span className="report-results-title-badge">{reportData.length} records</span>
            </h6>
            <div className="report-export-btns">
              <button className="btn-export btn-export-print" onClick={handlePrint}>
                <i className="bi bi-printer"></i> Print
              </button>
              <button className="btn-export btn-export-pdf" onClick={exportPDF} disabled={reportData.length === 0}>
                <i className="bi bi-file-pdf"></i> Export PDF
              </button>
              <button className="btn-export btn-export-excel" onClick={exportExcel} disabled={reportData.length === 0}>
                <i className="bi bi-file-excel"></i> Export Excel
              </button>
            </div>
          </div>

          {reportLoading ? (
            <div className="report-loading"><span className="spinner-border spinner-border-sm me-2"></span>Loading data...</div>
          ) : reportData.length === 0 ? (
            <div className="report-empty-state">
              <div><i className="bi bi-inbox"></i></div>
              <p>No records found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="report-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>{renderTableHeader()}</tr>
                </thead>
                <tbody>
                  {renderTableRows()}
                </tbody>
                {(totalQty > 0 || totalAmount > 0) && (
                  <tfoot>
                    <tr>
                      <td colSpan={renderTableHeader().length - 2} style={{ textAlign: 'right' }}>
                        <strong>TOTAL</strong>
                      </td>
                      {totalQty > 0 && <td><strong>{totalQty}</strong></td>}
                      {totalAmount > 0 && <td><strong>LKR {totalAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong></td>}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
