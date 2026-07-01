// MamaTrack GPS — Expectant Mother Registration Portal

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/db';
import { User, Phone, Mail, Calendar, MapPin, Heart, Users } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password_hash: 'password123', // default demo password
    date_of_birth: '',
    blood_type: 'O+',
    pregnancy_start_date: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: 'Husband',
    village: '',
    sub_county: 'Goma'
  });
  
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = AuthService.registerMother(formData);
    if (res.success) {
      navigate('/mother');
    } else {
      setError(res.error || 'Failed to create account');
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <style>{`
        .health-register-card {
          max-width: 780px !important;
          padding: 4rem 3.5rem !important;
        }
        .health-register-card h2 {
          font-size: 2.2rem !important;
          font-weight: 800 !important;
          color: #1f2937 !important;
        }
        .health-register-card p.subtitle-desc {
          font-size: 1.05rem !important;
        }
        .health-register-card h3 {
          font-size: 1.15rem !important;
          margin-top: 1.5rem !important;
        }
        .health-register-card .form-label {
          font-size: 1.02rem !important;
          font-weight: 600 !important;
          color: #374151 !important;
          margin-bottom: 6px !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
        }
        .health-register-card .form-input {
          padding: 12px 18px !important;
          font-size: 1.08rem !important;
          border-radius: 10px !important;
        }
        .health-register-card .btn-rose {
          padding: 14px 24px !important;
          font-size: 1.15rem !important;
          border-radius: 10px !important;
        }
        .health-register-card .footer-link-text {
          font-size: 0.98rem !important;
        }
      `}</style>

      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-3" />
      </div>

      <div className="card card-glass health-register-card" style={{ width: '100%', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🤰</div>
          <h2>Expectant Mother Registration</h2>
          <p className="subtitle-desc" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Register your profile to enable GPS emergency rescue response.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger-400)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: User details */}
          <h3 style={{ fontSize: '0.9rem', color: 'var(--rose-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
            Personal Account Info
          </h3>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label"><User size={13} /> Full Name</label>
              <input type="text" name="full_name" className="form-input" placeholder="e.g. Nabosa Sarah" value={formData.full_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label"><Phone size={13} /> Phone Number</label>
              <input type="tel" name="phone" className="form-input" placeholder="e.g. +256-772-000-000" value={formData.phone} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label"><Mail size={13} /> Email Address</label>
              <input type="email" name="email" className="form-input" placeholder="e.g. sarah@gmail.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label"><Calendar size={13} /> Date of Birth</label>
              <input type="date" name="date_of_birth" className="form-input" value={formData.date_of_birth} onChange={handleChange} required />
            </div>
          </div>

          {/* Section 2: Clinical Details */}
          <h3 style={{ fontSize: '0.9rem', color: 'var(--rose-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
            Pregnancy & Clinical Details
          </h3>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label"><Heart size={13} /> Blood Group</label>
              <select name="blood_type" className="form-input" value={formData.blood_type} onChange={handleChange}>
                <option value="O+">O Positive (O+)</option>
                <option value="O-">O Negative (O-)</option>
                <option value="A+">A Positive (A+)</option>
                <option value="A-">A Negative (A-)</option>
                <option value="B+">B Positive (B+)</option>
                <option value="B-">B Negative (B-)</option>
                <option value="AB+">AB Positive (AB+)</option>
                <option value="AB-">AB Negative (AB-)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><Calendar size={13} /> Pregnancy Confirm/Start Date</label>
              <input type="date" name="pregnancy_start_date" className="form-input" value={formData.pregnancy_start_date} onChange={handleChange} required />
            </div>
          </div>

          {/* Section 3: Next of Kin */}
          <h3 style={{ fontSize: '0.9rem', color: 'var(--rose-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
            Next of Kin Contact
          </h3>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label"><Users size={13} /> Kin Full Name</label>
              <input type="text" name="next_of_kin_name" className="form-input" placeholder="e.g. Ssemanda Dan" value={formData.next_of_kin_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label"><Users size={13} /> Relationship</label>
              <select name="next_of_kin_relationship" className="form-input" value={formData.next_of_kin_relationship} onChange={handleChange}>
                <option value="Husband">Husband</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="VHT Worker">VHT Worker</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label"><Phone size={13} /> Kin Phone Number</label>
            <input type="tel" name="next_of_kin_phone" className="form-input" placeholder="e.g. +256-751-000-000" value={formData.next_of_kin_phone} onChange={handleChange} required />
          </div>

          {/* Section 4: Location */}
          <h3 style={{ fontSize: '0.9rem', color: 'var(--rose-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
            Residential Location
          </h3>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label"><MapPin size={13} /> Sub County</label>
              <select name="sub_county" className="form-input" value={formData.sub_county} onChange={handleChange}>
                <option value="Goma">Goma</option>
                <option value="Nama">Nama</option>
                <option value="Mukono Municipality">Mukono Municipality</option>
                <option value="Koome">Koome</option>
                <option value="Ntenjeru">Ntenjeru</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><MapPin size={13} /> Village / Ward</label>
              <input type="text" name="village" className="form-input" placeholder="e.g. Seeta Ward" value={formData.village} onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="btn btn-rose btn-block" style={{ fontWeight: 700, padding: '0.8rem', background: 'var(--rose-500)' }}>
            Complete Account Setup
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p className="footer-link-text" style={{ color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login?role=mother" style={{ color: 'var(--rose-400)', fontWeight: 700, textDecoration: 'underline' }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
