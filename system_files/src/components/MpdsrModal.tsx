// MamaTrack GPS — Uganda MPDSR (Maternal & Perinatal Death Surveillance and Response) Audit Modal

import React, { useState } from 'react';
import { MpdsrRecord, MpdsrService, Emergency, db } from '../services/db';
import { showToast } from './toastBus';
import { Icon } from './Icon';

interface MpdsrModalProps {
  isOpen: boolean;
  onClose: () => void;
  emergency: Emergency | null;
  onSaved?: (record: MpdsrRecord) => void;
}

export const MpdsrModal: React.FC<MpdsrModalProps> = ({
  isOpen,
  onClose,
  emergency,
  onSaved
}) => {
  if (!isOpen || !emergency) return null;

  const existing = MpdsrService.getRecordByEmergencyId(emergency.id);
  const motherUser = db.users.find(u => u.id === emergency.mother_id);

  const [classification, setClassification] = useState<'maternal_near_miss' | 'maternal_death' | 'severe_complication_resolved'>(
    existing?.case_classification || 'maternal_near_miss'
  );
  const [primaryCause, setPrimaryCause] = useState(existing?.primary_cause || emergency.notes || 'Postpartum Haemorrhage (PPH)');
  
  // Delay 1: Seeking care
  const [delay1Present, setDelay1Present] = useState(existing?.delay_1_seeking_care.present || false);
  const [delay1Notes, setDelay1Notes] = useState(existing?.delay_1_seeking_care.notes || '');

  // Delay 2: Reaching care (Transport & Dispatch)
  const [delay2Present, setDelay2Present] = useState(existing?.delay_2_reaching_care.present || true);
  const [delay2Notes, setDelay2Notes] = useState(existing?.delay_2_reaching_care.notes || 'Emergency ambulance response monitored via GPS.');

  // Delay 3: Receiving care (Facility level)
  const [delay3Present, setDelay3Present] = useState(existing?.delay_3_receiving_care.present || false);
  const [delay3Notes, setDelay3Notes] = useState(existing?.delay_3_receiving_care.notes || '');

  const [correctiveAction, setCorrectiveAction] = useState(
    existing?.corrective_action_plan || 'Pre-position emergency response vehicle in rural sub-county; reinforce VHT danger sign screening.'
  );
  const [responsibleFacility, setResponsibleFacility] = useState(existing?.responsible_facility || 'Mukono General Hospital');
  const [responsiblePerson, setResponsiblePerson] = useState(existing?.responsible_person || 'District Health Officer (DHO)');
  const [committeeStatus, setCommitteeStatus] = useState<MpdsrRecord['review_committee_status']>(
    existing?.review_committee_status || 'audit_completed'
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = MpdsrService.saveRecord({
      id: existing?.id,
      emergency_id: emergency.id,
      mother_id: emergency.mother_id,
      case_classification: classification,
      primary_cause: primaryCause,
      contributing_clinical_factors: ['Gestational Complication', 'Geographical Distance'],
      delay_1_seeking_care: {
        present: delay1Present,
        factors: delay1Present ? ['Recognition of danger signs', 'Decision to seek transport'] : [],
        notes: delay1Notes
      },
      delay_2_reaching_care: {
        present: delay2Present,
        factors: delay2Present ? ['Road terrain', 'Ambulance travel time'] : [],
        notes: delay2Notes
      },
      delay_3_receiving_care: {
        present: delay3Present,
        factors: delay3Present ? ['Theatre availability', 'Blood stock'] : [],
        notes: delay3Notes
      },
      avoidable_factors: ['Transport optimization', 'Community early warning'],
      review_committee_status: committeeStatus,
      corrective_action_plan: correctiveAction,
      responsible_facility: responsibleFacility,
      responsible_person: responsiblePerson,
      audit_date: new Date().toISOString(),
      follow_up_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]
    });

    showToast('MPDSR Maternal Surveillance Audit Record Saved Successfully', 'success');
    if (onSaved) onSaved(saved);
    onClose();
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
        maxWidth: '800px',
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
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
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
                UGANDA MPDSR MODULE
              </span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                Maternal & Perinatal Death Surveillance and Response Audit
              </h3>
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
              Case: <strong>{emergency.code}</strong> — Patient: {motherUser?.full_name || 'Expectant Mother'}
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

        {/* Audit Form Content */}
        <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Classification */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Case Classification
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: 600 }}
              >
                <option value="maternal_near_miss">Maternal Near-Miss (Severe acute complication survived)</option>
                <option value="severe_complication_resolved">Severe Obstetric Complication Resolved</option>
                <option value="maternal_death">Institutional Maternal Death</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Primary Clinical Cause / Diagnosis
              </label>
              <input
                type="text"
                value={primaryCause}
                onChange={(e) => setPrimaryCause(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                placeholder="e.g., Postpartum Haemorrhage with Hypovolemic Shock"
                required
              />
            </div>
          </div>

          {/* Three-Delay Model Diagnostic */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1.5px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="trend" size={16} /> Three-Delay Model Root Cause Investigation (Uganda MoH Framework)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Delay 1 */}
              <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={delay1Present}
                    onChange={(e) => setDelay1Present(e.target.checked)}
                  />
                  <span>Delay 1: Delay in deciding to seek care (Awareness / Socio-cultural / Financial)</span>
                </label>
                {delay1Present && (
                  <input
                    type="text"
                    value={delay1Notes}
                    onChange={(e) => setDelay1Notes(e.target.value)}
                    placeholder="Details: e.g. Late recognition of danger signs by family"
                    style={{ width: '100%', marginTop: '6px', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              {/* Delay 2 */}
              <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={delay2Present}
                    onChange={(e) => setDelay2Present(e.target.checked)}
                  />
                  <span>Delay 2: Delay in identifying and reaching medical facility (Transport / Road / Distance)</span>
                </label>
                {delay2Present && (
                  <input
                    type="text"
                    value={delay2Notes}
                    onChange={(e) => setDelay2Notes(e.target.value)}
                    placeholder="Details: e.g. Feeder road flooding; distance to HC IV"
                    style={{ width: '100%', marginTop: '6px', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              {/* Delay 3 */}
              <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={delay3Present}
                    onChange={(e) => setDelay3Present(e.target.checked)}
                  />
                  <span>Delay 3: Delay in receiving adequate clinical care at facility (Blood / Theatre / Staff)</span>
                </label>
                {delay3Present && (
                  <input
                    type="text"
                    value={delay3Notes}
                    onChange={(e) => setDelay3Notes(e.target.value)}
                    placeholder="Details: e.g. Blood bank unit crossmatch time; theatre turn-around"
                    style={{ width: '100%', marginTop: '6px', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Corrective Action Plan */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              MPDSR Corrective Action Plan & Quality Improvement Recommendations
            </label>
            <textarea
              rows={3}
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
              placeholder="Specify institutional, transport, or clinical changes to prevent recurrence..."
              required
            />
          </div>

          {/* Accountability & Review Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Responsible Facility</label>
              <input
                type="text"
                value={responsibleFacility}
                onChange={(e) => setResponsibleFacility(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Accountable Officer</label>
              <input
                type="text"
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>Committee Status</label>
              <select
                value={committeeStatus}
                onChange={(e) => setCommitteeStatus(e.target.value as any)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600 }}
              >
                <option value="audit_completed">Audit Completed</option>
                <option value="action_plan_active">Action Plan Active</option>
                <option value="under_review">Under Review</option>
                <option value="pending_audit">Pending Committee</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}
            >
              Save MPDSR Surveillance Record
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
