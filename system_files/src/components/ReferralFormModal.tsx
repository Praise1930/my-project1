// MamaTrack GPS — Uganda Ministry of Health Maternal Emergency Referral Record (Digital Transfer Form)

import React from 'react';
import { ReferralRecord, db } from '../services/db';
import { Icon } from './Icon';

interface ReferralFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  referral: ReferralRecord | null;
}

export const ReferralFormModal: React.FC<ReferralFormModalProps> = ({
  isOpen,
  onClose,
  referral
}) => {
  if (!isOpen || !referral) return null;

  const motherUser = db.users.find(u => u.id === referral.mother_id);
  const motherProfile = db.mothers.find(m => m.user_id === referral.mother_id);

  const handlePrint = () => {
    window.print();
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
        maxWidth: '820px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #cbd5e1',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header toolbar */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#0284c7', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
              MoH FORM 106-REF
            </span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              Uganda Maternal & Neonatal Emergency Referral Document
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Icon name="search" size={14} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#e2e8f0',
                color: '#334155',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Official Document Content */}
        <div id="printable-referral-form" style={{ padding: '32px', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          
          {/* Official Letterhead */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#475569' }}>
              Republic of Uganda • Ministry of Health
            </div>
            <h2 style={{ margin: '4px 0', fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>
              EMERGENCY MATERNAL & OBSTETRIC REFERRAL NOTE
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Referral Code: <strong style={{ color: '#0284c7' }}>{referral.referral_code}</strong> | Generated: {new Date(referral.created_at).toLocaleString()}
            </div>
          </div>

          {/* Section 1: Referral Routing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#0284c7' }}>Referring Source</div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{referral.referring_facility_name}</div>
              <div style={{ fontSize: '12px', color: '#475569' }}>Clinician: {referral.referring_clinician_name}</div>
              <div style={{ fontSize: '12px', color: '#475569' }}>Contact: {referral.referring_clinician_contact}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#0284c7' }}>Receiving Facility</div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{referral.receiving_facility_name}</div>
              <div style={{ fontSize: '12px', color: '#475569' }}>Receiving Clinician: {referral.receiving_clinician_name || 'Emergency Maternity Team on Duty'}</div>
              <div style={{ fontSize: '12px', color: '#475569' }}>Ambulance Vehicle: {referral.ambulance_plate} (Driver: {referral.driver_name})</div>
            </div>
          </div>

          {/* Section 2: Patient Demographics & Obstetric History */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px' }}>
              1. Patient Identification & Obstetric History
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '12.5px' }}>
              <div><strong>Patient Name:</strong> {motherUser?.full_name || 'Expectant Mother'}</div>
              <div><strong>National ID (NIN):</strong> {motherProfile?.national_id || 'CM-Pending'}</div>
              <div><strong>Age / DOB:</strong> {motherProfile?.date_of_birth || 'N/A'}</div>
              <div><strong>Blood Group:</strong> <span style={{ color: '#dc2626', fontWeight: 800 }}>{referral.obstetric_history.blood_group}</span></div>

              <div><strong>Gravida / Parity:</strong> G{referral.obstetric_history.gravida} P{referral.obstetric_history.parity}</div>
              <div><strong>Gestation:</strong> {referral.obstetric_history.gestational_weeks} Weeks</div>
              <div><strong>Expected Due Date:</strong> {referral.obstetric_history.edd}</div>
              <div><strong>Next of Kin:</strong> {motherProfile?.next_of_kin_name} ({motherProfile?.next_of_kin_relationship})</div>

              <div style={{ gridColumn: 'span 4' }}>
                <strong>Location:</strong> {motherProfile?.village}, {motherProfile?.sub_county}, {motherProfile?.district || 'Mukono District'}
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Findings & Reason for Referral */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px' }}>
              2. Reason for Referral & Clinical Findings
            </h4>
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '10px' }}>
              <strong>Primary Reason for Referral:</strong> {referral.reason_for_referral}
            </div>
            <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: '#334155' }}>
              <strong>Clinical Presentation Summary:</strong> {referral.clinical_summary}
            </div>
          </div>

          {/* Section 4: Vital Signs at Departure */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px', marginBottom: '10px' }}>
              3. Vital Signs & Pre-Referral Interventions
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '12px', marginBottom: '12px', background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
              <div>Blood Pressure: <strong>{referral.vitals_at_referral.bp} mmHg</strong></div>
              <div>Pulse Rate: <strong>{referral.vitals_at_referral.pulse} bpm</strong></div>
              <div>Temperature: <strong>{referral.vitals_at_referral.temp}°C</strong></div>
              <div>Fetal Heart Rate: <strong>{referral.vitals_at_referral.fetal_heart_rate || 'Normal'}</strong></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '12px' }}>
              <div>
                <strong>Pre-referral Clinical Procedures:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {referral.pre_referral_treatments.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Medications Administered (Dose & Route):</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, color: '#0369a1' }}>
                  {referral.medications_given.map((m, idx) => (
                    <li key={idx}><strong>{m}</strong></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section 5: Transit & Handover Verification */}
          <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
              <div>
                <div><strong>Ambulance Departure Time:</strong> {new Date(referral.departure_time).toLocaleString()}</div>
                <div><strong>Ambulance Crew Signature:</strong> ______________________</div>
              </div>
              <div>
                <div><strong>Hospital Arrival Time:</strong> {referral.arrival_time ? new Date(referral.arrival_time).toLocaleString() : 'En route / In transit'}</div>
                <div><strong>Receiving Clinician Signature:</strong> ______________________</div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            MamaTrack GPS Digital Health Platform • Conforms to Uganda MoH Referral Guidelines
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Note
          </button>
        </div>

      </div>
    </div>
  );
};
