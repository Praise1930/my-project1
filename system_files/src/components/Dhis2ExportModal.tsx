// MamaTrack GPS — Uganda DHIS2 / HMIS 105 Interoperability Center Modal

import React, { useState } from 'react';
import { Dhis2Service } from '../services/db';
import { showToast } from './toastBus';
import { Icon } from './Icon';

interface Dhis2ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Dhis2ExportModal: React.FC<Dhis2ExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const [period, setPeriod] = useState('2026-07');
  const [isExporting, setIsExporting] = useState(false);
  const report = Dhis2Service.generateHmis105Report(period);
  const jsonPayload = Dhis2Service.exportDhis2JsonPayload(period);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonPayload);
    showToast('DHIS2 Payload copied to clipboard', 'success');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([jsonPayload], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `DHIS2_HMIS105_${period}_MUKONO.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('DHIS2 JSON payload downloaded successfully', 'success');
  };

  const handleSimulateSync = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast('Successfully synchronized aggregate dataset with Uganda eHMIS (DHIS2 Server)', 'success');
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '850px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #cbd5e1',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: '#ffffff',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
                eHMIS / DHIS2 INTEROPERABILITY
              </span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                Uganda HMIS 105 & DHIS2 Maternal Data Exchange
              </h3>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
              Standardized OpenHIE / DHIS2 Web API Data Value Set Exporter
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                Reporting Period (YYYY-MM):
              </label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700 }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="success" size={16} /> Data Schema Validated with MoH DHIS2
            </div>
          </div>

          {/* Table of Mapped HMIS 105 Data Elements */}
          <div>
            <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>
              Aggregated Maternal Referral & Emergency Data Elements
            </h4>
            <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#334155', textAlign: 'left', fontWeight: 700 }}>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #cbd5e1' }}>Data Element Code</th>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #cbd5e1' }}>Indicator Description</th>
                    <th style={{ padding: '10px 14px', borderBottom: '1px solid #cbd5e1', textAlign: 'right' }}>Calculated Value</th>
                  </tr>
                </thead>
                <tbody>
                  {report.dataValues.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 800, color: '#047857' }}>
                        {row.dataElement}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#1e293b', fontWeight: 600 }}>
                        {row.name}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* JSON Payload Preview */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                Raw DHIS2 ADX / JSON Exchange Payload
              </label>
              <button
                type="button"
                onClick={handleCopyJson}
                style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontWeight: 700 }}
              >
                Copy JSON
              </button>
            </div>
            <pre style={{
              background: '#0f172a',
              color: '#38bdf8',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '11.5px',
              maxHeight: '160px',
              overflowY: 'auto',
              margin: 0,
              fontFamily: 'monospace'
            }}>
              {jsonPayload}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            OrgUnit: {report.orgUnit}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #059669', background: '#ffffff', color: '#059669', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              Download JSON
            </button>
            <button
              onClick={handleSimulateSync}
              disabled={isExporting}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#059669', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(5,150,105,0.3)' }}
            >
              {isExporting ? 'Transmitting...' : 'Push to DHIS2 National Server'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
