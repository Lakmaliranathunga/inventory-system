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
        table { width:100%; border-collapse:collapse; margin-bottom: 20px; }
        th { background:#1a3a5c; color:#fff; padding:8px; text-align:left; font-size:11px; }
        td { padding:7px 8px; border-bottom:1px solid #eee; font-size:11px; }
        tfoot td { font-weight:bold; border-top:2px solid #2563a8; background:#f1f5f9; }
        .section-title { color: #1a3a5c; margin-top:20px; margin-bottom:10px; font-size:14px; border-bottom:2px solid #1a3a5c; padding-bottom:4px; }
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

  const getAdjustmentStatus = (d) => {
    if (d.adjustmentType === 'DAMAGED' || d.itemCondition === 'Damaged' || d.itemCondition === 'Poor') return 'Damaged';
    if (d.adjustmentType === 'DISPOSAL' || d.itemCondition === 'Disposal') return 'Disposal';
    return 'Good';
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

  // Derived datasets & counts
  const totalQty = reportData.reduce((acc, r) => acc + (Number(r.quantity) || 0), 0);
  const totalAmount = reportData.reduce((acc, r) => acc + (Number(r.totalAmount) || Number(r.totalValue) || 0), 0);
  
  const adjustedItems = reportData.filter(d => getAdjustmentStatus(d) === 'Damaged' || getAdjustmentStatus(d) === 'Disposal');
  const damagedCount = reportData.filter(d => getAdjustmentStatus(d) === 'Damaged').length;
  const disposalCount = reportData.filter(d => getAdjustmentStatus(d) === 'Disposal').length;
  const goodCount = reportData.filter(d => getAdjustmentStatus(d) === 'Good').length;
  const totalAdjustments = adjustedItems.length;

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
    doc.text(`Total Items: ${reportData.length} | Good: ${goodCount} | Total Stock Adjustments: ${totalAdjustments} (Damaged: ${damagedCount}, Disposal: ${disposalCount})`, 14, 34);

    const { head, body } = getTableHeadBody();
    autoTable(doc, {
      head: [head],
      body: body,
      startY: 40,
      headStyles: { fillColor: [26, 58, 92], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    if (['monthly', 'yearly', 'item-wise', 'division-wise', 'section-wise'].includes(activeReport) && adjustedItems.length > 0) {
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 150;
      doc.setFontSize(11);
      doc.setTextColor(26, 58, 92);
      doc.text(`Stock Adjustment Details (${adjustedItems.length} items)`, 14, finalY);

      const adjHead = ['#', 'Item Code', 'Item Name', 'Adjustment Type', 'Division / Section', 'Date & Time', 'Remarks / Reason'];
      const adjBody = adjustedItems.map((d, i) => [
        i + 1, d.itemCode, d.itemName, getAdjustmentStatus(d),
        `${d.divisionName || '–'} / ${d.sectionName || '–'}`,
        d.adjustmentDate ? new Date(d.adjustmentDate).toLocaleString() : '–',
        d.adjustmentRemarks || '–'
      ]);

      autoTable(doc, {
        head: [adjHead],
        body: adjBody,
        startY: finalY + 5,
        headStyles: { fillColor: [217, 119, 6], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [254, 243, 199] },
      });
    }

    doc.save(`${reportLabel.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // ====== EXPORT EXCEL ======
  const exportExcel = () => {
    const reportLabel = REPORT_TYPES.find(r => r.id === activeReport)?.label || 'Report';
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All_Items');

    if (adjustedItems.length > 0) {
      const adjWs = XLSX.utils.json_to_sheet(adjustedItems);
      XLSX.utils.book_append_sheet(wb, adjWs, 'Stock_Adjustments');
    }

    XLSX.writeFile(wb, `${reportLabel.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // ====== PRINT ======
  const handlePrint = () => {
    const reportLabel = REPORT_TYPES.find(r => r.id === activeReport)?.label || 'Report';
    const { head, body } = getTableHeadBody();
    const tHead = `<tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>`;
    const tBody = body.map(row => `<tr>${row.map(cell => `<td>${cell ?? ''}</td>`).join('')}</tr>`).join('');
    
    let html = `<h3 class="section-title">All Inventory Items (${reportData.length})</h3><table><thead>${tHead}</thead><tbody>${tBody}</tbody></table>`;

    if (['monthly', 'yearly', 'item-wise', 'division-wise', 'section-wise'].includes(activeReport)) {
      html += `<h3 class="section-title">Stock Adjustment Items (${adjustedItems.length})</h3>`;
      if (adjustedItems.length === 0) {
        html += `<p>No stock adjustments recorded for this period.</p>`;
      } else {
        const adjHead = `<tr><th>#</th><th>Item Code</th><th>Item Name</th><th>Type</th><th>Division / Section</th><th>Date</th><th>Reason / Remarks</th></tr>`;
        const adjBody = adjustedItems.map((d, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${d.itemCode}</td>
            <td>${d.itemName}</td>
            <td>${getAdjustmentStatus(d)}</td>
            <td>${d.divisionName || '–'} / ${d.sectionName || '–'}</td>
            <td>${d.adjustmentDate ? new Date(d.adjustmentDate).toLocaleDateString() : '–'}</td>
            <td>${d.adjustmentRemarks || '–'}</td>
          </tr>
        `).join('');
        html += `<table><thead>${adjHead}</thead><tbody>${adjBody}</tbody></table>`;
      }
    }

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
          d.divisionName, d.sectionName, d.quantity, getAdjustmentStatus(d),
          d.purchaseDate ? new Date(d.purchaseDate).toLocaleDateString() : '–',
          d.warrantyExpireDate ? new Date(d.warrantyExpireDate).toLocaleDateString() : '–'
        ]);
        break;
      case 'item-wise':
        head = ['#', 'Item Code', 'Item Name', 'Type', 'Category', 'Sub Category', 'Division', 'Section', 'Qty', 'Condition', 'Purchase Date'];
        body = reportData.map((d, i) => [
          i + 1, d.itemCode, d.itemName, d.itemTypeName, d.mainCategoryName, d.subCategoryName,
          d.divisionName, d.sectionName, d.quantity, getAdjustmentStatus(d),
          d.purchaseDate ? new Date(d.purchaseDate).toLocaleDateString() : '–'
        ]);
        break;
      case 'division-wise':
        head = ['#', 'Item Code', 'Item Name', 'Division', 'Section', 'Qty', 'Condition', 'Purchase Date'];
        body = reportData.map((d, i) => [
          i + 1, d.itemCode, d.itemName, d.divisionName, d.sectionName, d.quantity,
          getAdjustmentStatus(d), d.purchaseDate ? new Date(d.purchaseDate).toLocaleDateString() : '–'
        ]);
        break;
      case 'section-wise':
        head = ['#', 'Item Code', 'Item Name', 'Division', 'Section', 'Qty', 'Condition'];
        body = reportData.map((d, i) => [
          i + 1, d.itemCode, d.itemName, d.divisionName, d.sectionName, d.quantity, getAdjustmentStatus(d)
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
          i + 1, d.itemCode, d.itemName, d.itemTypeName, d.divisionName, d.sectionName, d.quantity, getAdjustmentStatus(d)
        ]);
        break;
      default:
        head = Object.keys(reportData[0] || {});
        body = reportData.map(d => head.map(k => d[k]));
    }

    return { head, body };
  };

  // ====== STATUS BADGE RENDERER ======
  const renderAdjustmentStatusBadge = (d) => {
    const status = getAdjustmentStatus(d);
    if (status === 'Damaged') {
      return (
        <span className="badge-condition badge-damaged">
          <i className="bi bi-exclamation-triangle-fill me-1"></i> Damaged
        </span>
      );
    }
    if (status === 'Disposal') {
      return (
        <span className="badge-condition badge-poor">
          <i className="bi bi-trash-fill me-1"></i> Disposal
        </span>
      );
    }
    return (
      <span className="badge-condition badge-good">
        <i className="bi bi-check-circle-fill me-1"></i> Good
      </span>
    );
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
          <td>{renderAdjustmentStatusBadge(d)}</td>
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
          <td>{renderAdjustmentStatusBadge(d)}</td>
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
          <td>{renderAdjustmentStatusBadge(d)}</td>
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
          <td>{renderAdjustmentStatusBadge(d)}</td>
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
          <td>{renderAdjustmentStatusBadge(d)}</td>
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
            onClick={() => { setActiveReport(r.id); setGenerated(false); setReportData([]); setTransactionType(''); }}
          >
            <i className={`bi ${r.icon}`}></i>
            {r.label}
          </button>
        ))}
      </div>

      {/* FILTERS */}
      {renderFilters()}

      {/* RESULTS PANEL */}
      {generated && (
        <div className="report-results-panel">
          <div className="report-results-header">
            <h6>
              <i className="bi bi-table me-2"></i>
              {REPORT_TYPES.find(r => r.id === activeReport)?.label}
              <span className="report-results-title-badge">{reportData.length} items</span>
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

          {/* SUMMARY STATS CARDS FOR REPORT */}
          {['monthly', 'yearly', 'item-wise', 'division-wise', 'section-wise'].includes(activeReport) && (
            <div className="report-summary-grid mt-2 mb-4">
              <div className="report-summary-card blue">
                <div className="rsc-icon blue"><i className="bi bi-boxes"></i></div>
                <div>
                  <div className="rsc-label">Total All Items</div>
                  <div className="rsc-value">{reportData.length}</div>
                </div>
              </div>
              <div className="report-summary-card green">
                <div className="rsc-icon green"><i className="bi bi-check-circle-fill"></i></div>
                <div>
                  <div className="rsc-label">Good / Active Items</div>
                  <div className="rsc-value">{goodCount}</div>
                </div>
              </div>
              <div className="report-summary-card yellow">
                <div className="rsc-icon yellow"><i className="bi bi-exclamation-triangle-fill"></i></div>
                <div>
                  <div className="rsc-label">Damaged Count</div>
                  <div className="rsc-value">{damagedCount}</div>
                </div>
              </div>
              <div className="report-summary-card red">
                <div className="rsc-icon red"><i className="bi bi-trash-fill"></i></div>
                <div>
                  <div className="rsc-label">Disposal Count</div>
                  <div className="rsc-value">{disposalCount}</div>
                </div>
              </div>
              <div className="report-summary-card purple">
                <div className="rsc-icon purple"><i className="bi bi-shield-exclamation"></i></div>
                <div>
                  <div className="rsc-label">Stock Adjusted Items</div>
                  <div className="rsc-value">{totalAdjustments}</div>
                </div>
              </div>
            </div>
          )}

          {reportLoading ? (
            <div className="report-loading"><span className="spinner-border spinner-border-sm me-2"></span>Loading data...</div>
          ) : reportData.length === 0 ? (
            <div className="report-empty-state">
              <div><i className="bi bi-inbox"></i></div>
              <p>No records found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              {/* 1. ALL INVENTORY ITEMS TABLE */}
              <div className="mb-4">
                <h6 className="fw-bold text-dark mb-2">
                  <i className="bi bi-list-ul me-2"></i>1. All Inventory Items ({reportData.length})
                </h6>
                <div className="report-table-wrapper">
                  <table className="report-table">
                    <thead>
                      <tr>{renderTableHeader()}</tr>
                    </thead>
                    <tbody>
                      {renderTableRows()}
                    </tbody>
                    <tfoot>
                      {['monthly', 'yearly', 'item-wise', 'division-wise', 'section-wise'].includes(activeReport) ? (
                        <tr>
                          <td colSpan={renderTableHeader().length} style={{ textAlign: 'left', padding: '10px 14px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                              <span><strong>Total Items:</strong> {reportData.length}</span>
                              <span style={{ color: '#16a34a' }}><strong>Good / Active:</strong> {goodCount}</span>
                              <span style={{ color: '#d97706' }}><strong>Damaged:</strong> {damagedCount}</span>
                              <span style={{ color: '#dc2626' }}><strong>Disposal:</strong> {disposalCount}</span>
                            </div>
                          </td>
                        </tr>
                      ) : (totalQty > 0 || totalAmount > 0) ? (
                        <tr>
                          <td colSpan={renderTableHeader().length - 2} style={{ textAlign: 'right' }}>
                            <strong>TOTAL</strong>
                          </td>
                          {totalQty > 0 && <td><strong>{totalQty}</strong></td>}
                          {totalAmount > 0 && <td><strong>LKR {totalAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong></td>}
                        </tr>
                      ) : null}
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 2. STOCK ADJUSTMENTS ITEMS TABLE (SHOWN AFTER ALL ITEMS) */}
              {['monthly', 'yearly', 'item-wise', 'division-wise', 'section-wise'].includes(activeReport) && (
                <div className="mt-4 pt-3 border-top">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-bold text-dark m-0">
                      <i className="bi bi-shield-exclamation text-warning me-2"></i>
                      2. Stock Adjustment Items Details ({adjustedItems.length})
                    </h6>
                    <span className="badge bg-light text-dark border">
                      Damaged: <strong>{damagedCount}</strong> | Disposal: <strong>{disposalCount}</strong> | Total Adjusted: <strong>{totalAdjustments}</strong>
                    </span>
                  </div>

                  {adjustedItems.length === 0 ? (
                    <div className="alert alert-light border text-muted py-3 px-4 rounded-3" style={{ fontSize: '0.85rem' }}>
                      <i className="bi bi-info-circle me-2 text-primary"></i>
                      No stock adjustments (Damage / Disposal) were recorded for the items in this report.
                    </div>
                  ) : (
                    <div className="report-table-wrapper">
                      <table className="report-table">
                        <thead>
                          <tr style={{ background: '#2563a8' }}>
                            <th>#</th>
                            <th>Item Code</th>
                            <th>Item Name</th>
                            <th>Adjustment Type</th>
                            <th>Division / Section</th>
                            <th>Adjustment Date</th>
                            <th>Remarks / Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adjustedItems.map((d, i) => (
                            <tr key={i}>
                              <td>{i + 1}</td>
                              <td><code>{d.itemCode}</code></td>
                              <td><strong>{d.itemName}</strong></td>
                              <td>{renderAdjustmentStatusBadge(d)}</td>
                              <td>{`${d.divisionName || '–'} / ${d.sectionName || '–'}`}</td>
                              <td>{d.adjustmentDate ? new Date(d.adjustmentDate).toLocaleString() : '–'}</td>
                              <td><span className="text-dark fw-semibold">{d.adjustmentRemarks || '–'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'left', padding: '10px 14px', background: '#fef3c7' }}>
                              <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem', color: '#92400e' }}>
                                <span><strong>Total Stock Adjustment Items:</strong> {adjustedItems.length}</span>
                                <span><strong>Damaged Items:</strong> {damagedCount}</span>
                                <span><strong>Disposal Items:</strong> {disposalCount}</span>
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
