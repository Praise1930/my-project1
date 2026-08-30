// MamaTrack GPS — Uganda Clinical Decision Support System (CDSS) Triage Modal

import React, { useState } from 'react';
import { CdssService, OBSTETRIC_CATEGORIES_METADATA, ObstetricEmergencyCategory } from '../services/db';
import { Icon } from './Icon';

interface CdssTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: ObstetricEmergencyCategory;
  onApplyProtocol?: (category: ObstetricEmergencyCategory, notes: string) => void;
}

export const CdssTriageModal: React.FC<CdssTriageModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'pph',
  onApplyProtocol
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ObstetricEmergencyCategory>(initialCategory);
  const [selectedDangerSigns, setSelectedDangerSigns] = useState<string[]>([]);
  const dangerSigns = CdssService.getDangerSigns();
  const protocol = CdssService.getProtocolForCategory(selectedCategory);
  const categoryMeta = OBSTETRIC_CATEGORIES_METADATA[selectedCategory];

  if (!isOpen) return null;

  const toggleDangerSign = (id: string) => {
    setSelectedDangerSigns(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    if (onApplyProtocol) {
      const notes = `CDSS Protocol Applied: ${categoryMeta.label}. Danger signs flagged: ${selectedDangerSigns.join(', ') || 'None'}.`;
      onApplyProtocol(selectedCategory, notes);
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
        maxWidth: '840px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                UGANDA MoH CDSS
              </span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                Clinical Decision-Support & Danger Signs Triage
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.9 }}>
              Evidence-based maternal emergency stabilization protocols (Uganda Clinical Guidelines - UCG)
            </p>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Step 1: Danger Signs Checklist */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="pulse" size={16} /> 1. Maternal Danger Signs Assessment (Select all observed)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {dangerSigns.map(sign => {
                const isSelected = selectedDangerSigns.includes(sign.id);
                return (
                  <div
                    key={sign.id}
                    onClick={() => toggleDangerSign(sign.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${isSelected ? (sign.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b') : '#e2e8f0'}`,
                      background: isSelected ? (sign.severity === 'CRITICAL' ? '#fef2f2' : '#fffbeb') : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#0f172a' : '#334155' }}>
                        {sign.label}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: sign.severity === 'CRITICAL' ? '#fee2e2' : '#fef3c7',
                        color: sign.severity === 'CRITICAL' ? '#b91c1c' : '#b45309'
                      }}>
                        {sign.severity}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.3 }}>
                      {sign.immediateAction}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Emergency Category Selector */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="heart" size={16} /> 2. Primary Obstetric Emergency Category
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
              {(Object.keys(OBSTETRIC_CATEGORIES_METADATA) as ObstetricEmergencyCategory[]).map(cat => {
                const meta = OBSTETRIC_CATEGORIES_METADATA[cat];
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: `1.5px solid ${isSelected ? '#0284c7' : '#cbd5e1'}`,
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      color: isSelected ? '#0369a1' : '#334155',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <span>{meta.label}</span>
                    <span style={{ fontSize: '10px', color: meta.urgency === 'CRITICAL' ? '#dc2626' : '#d97706', fontWeight: 700 }}>
                      • {meta.urgency} PRIORITY
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Uganda Clinical Guidelines Protocol Display */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #0284c7',
            borderRadius: '12px',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0369a1' }}>
                📋 {protocol.title}
              </h5>
              <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                Standardized MoH Flow
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {protocol.steps.map((step, idx) => (
                <div key={idx} style={{ fontSize: '12.5px', color: '#1e293b', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#0284c7', fontWeight: 800 }}>•</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
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
            Supports qualified clinical judgment. Never delay emergency ambulance transfer.
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            <button
              onClick={handleApply}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2,132,199,0.3)'
              }}
            >
              Apply to Emergency Triage
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
