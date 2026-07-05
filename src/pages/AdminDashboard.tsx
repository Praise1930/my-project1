// MamaTrack GPS — System Admin Command Center (Dasher Theme with Mothers & Undo Capability)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, AuthService, EmergencyService, User, Emergency, Hospital, Driver, Doctor, Vehicle, Mother } from '../services/db';
import { MapComponent, MapMarker } from '../components/MapComponent';
import { RefreshCw } from 'lucide-react';
import { ThemeToggle, useTheme } from '../contexts/ThemeContext';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'facilities' | 'personnel' | 'mothers' | 'reports'>('dispatch');

  // Database states
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mothers, setMothers] = useState<Mother[]>([]);

  // Dispatch control states
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [dispatchDriver, setDispatchDriver] = useState<number>(0);
  const [dispatchDoctor, setDispatchDoctor] = useState<number>(0);
  const [dispatchHospital, setDispatchHospital] = useState<number>(0);
  const [dispatchEta, setDispatchEta] = useState<number>(20);

  // --- SEARCH QUERY STATE ---
  const [searchQuery, setSearchQuery] = useState('');

  // --- UNDO/BACKUP HISTORY STATE ---
  const [undoStack, setUndoStack] = useState<string[]>([]);

  const saveBackupState = () => {
    const snapshot = JSON.stringify({
      users: db.users,
      hospitals: db.hospitals,
      doctors: db.doctors,
      drivers: db.drivers,
      mothers: db.mothers
    });
    setUndoStack(prev => [...prev, snapshot]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const nextStack = [...undoStack];
    const previousStateRaw = nextStack.pop();
    if (previousStateRaw) {
      const state = JSON.parse(previousStateRaw);
      db.users = state.users;
      db.hospitals = state.hospitals;
      db.doctors = state.doctors;
      db.drivers = state.drivers;
      db.mothers = state.mothers;
      setUndoStack(nextStack);
      loadData();
      alert('↩️ Database restored back to previous backup snapshot.');
    }
  };

  // --- ADMIN ACTIONS STATE ---
  
  // Password Reset Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Mothers Modals
  const [showMotherModal, setShowMotherModal] = useState(false);
  const [editMother, setEditMother] = useState<Mother | null>(null);
  const [motherForm, setMotherForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    blood_type: 'O+',
    pregnancy_start_date: '',
    next_of_kin_name: '',
    next_of_kin_relationship: 'Husband',
    next_of_kin_phone: '',
    village: '',
    sub_county: 'Goma'
  });

  // Facilities Modals
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [editFacility, setEditFacility] = useState<Hospital | null>(null);
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    type: 'government' as Hospital['type'],
    latitude: 0.3536,
    longitude: 32.7554,
    address: '',
    sub_county: 'Goma',
    phone: '',
    email: '',
    total_beds: 15,
    has_cemonc: true,
    has_blood_bank: true,
    blood_types_available: 'O+, O-, A+, B+',
    has_surgical_capacity: true,
    has_ambulance: true,
    operating_hours: '24 Hours',
    facility_type: 'HC IV'
  });

  // Personnel Modals
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [personnelRole, setPersonnelRole] = useState<'doctor' | 'driver'>('doctor');
  const [editPersonnel, setEditPersonnel] = useState<Doctor | Driver | null>(null);
  const [personnelForm, setPersonnelForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    specialization: '', 
    license_number: '',
    hospital_id: 1,
    vehicle_id: 0, 
    years_experience: 3
  });

  // Dynamic Stylesheet Loading for isolating theme CSS
  useEffect(() => {
    // Add Dasher CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/dasher/theme.css';
    link.id = 'dasher-theme-css';
    document.head.appendChild(link);

    // Add Tabler icons Webfont
    const iconsLink = document.createElement('link');
    iconsLink.rel = 'stylesheet';
    iconsLink.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css';
    iconsLink.id = 'tabler-icons-css';
    document.head.appendChild(iconsLink);

    // Add Google font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&display=swap';
    fontLink.id = 'public-sans-css';
    document.head.appendChild(fontLink);

    return () => {
      // Unload on exit
      const linkEl = document.getElementById('dasher-theme-css');
      if (linkEl) linkEl.remove();
      const iconsEl = document.getElementById('tabler-icons-css');
      if (iconsEl) iconsEl.remove();
      const fontEl = document.getElementById('public-sans-css');
      if (fontEl) fontEl.remove();
    };
  }, []);

  // 1. Auth & Data loading
  useEffect(() => {
    const sessionUser = db.getCurrentSessionUser();
    if (!sessionUser || sessionUser.role !== 'admin') {
      navigate('/login?role=admin');
      return;
    }
    setUser(sessionUser);
    loadData();
  }, [navigate]);

  const loadData = () => {
    setEmergencies([...db.emergencies].reverse());
    setHospitals(db.hospitals);
    setDrivers(db.drivers);
    setDoctors(db.doctors);
    setVehicles(db.vehicles);
    setMothers(db.mothers);
  };

  // Simple state poller to keep dispatch screen live
  useEffect(() => {
    const timer = setInterval(() => {
      loadData();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Admin Workspace...</div>;

  // Contextual search filters
  const filteredMothers = mothers.filter(m => {
    const u = db.users.find(usr => usr.id === m.user_id);
    const q = searchQuery.toLowerCase();
    return (
      u?.full_name.toLowerCase().includes(q) ||
      u?.email.toLowerCase().includes(q) ||
      u?.phone.toLowerCase().includes(q) ||
      m.village.toLowerCase().includes(q) ||
      m.sub_county.toLowerCase().includes(q) ||
      m.blood_type.toLowerCase().includes(q)
    );
  });

  const filteredHospitals = hospitals.filter(h => {
    const q = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      h.sub_county.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q) ||
      h.facility_type.toLowerCase().includes(q)
    );
  });

  const filteredDoctors = doctors.filter(doc => {
    const u = db.users.find(usr => usr.id === doc.user_id);
    const q = searchQuery.toLowerCase();
    return (
      u?.full_name.toLowerCase().includes(q) ||
      doc.specialization.toLowerCase().includes(q) ||
      doc.license_number.toLowerCase().includes(q)
    );
  });

  const filteredDrivers = drivers.filter(drv => {
    const u = db.users.find(usr => usr.id === drv.user_id);
    const q = searchQuery.toLowerCase();
    return (
      u?.full_name.toLowerCase().includes(q) ||
      drv.driver_role.toLowerCase().includes(q) ||
      drv.license_number.toLowerCase().includes(q)
    );
  });

  const filteredEmergencies = emergencies.filter(emg => {
    const m = mothers.find(moth => moth.user_id === emg.mother_id);
    const u = m ? db.users.find(usr => usr.id === m.user_id) : null;
    const q = searchQuery.toLowerCase();
    return (
      emg.code.toLowerCase().includes(q) ||
      emg.status.toLowerCase().includes(q) ||
      emg.severity.toLowerCase().includes(q) ||
      (u && u.full_name.toLowerCase().includes(q)) ||
      emg.notes.toLowerCase().includes(q)
    );
  });

  // Stats calculation
  const pendingCount = emergencies.filter(e => e.status === 'pending').length;
  const activeDispatchCount = emergencies.filter(e => ['dispatched', 'en_route', 'arrived'].includes(e.status)).length;
  const onDutyDrivers = drivers.filter(d => d.is_on_duty).length;
  const onDutyDoctors = doctors.filter(doc => doc.is_on_duty).length;
  const totalAvailableBeds = hospitals.reduce((sum, h) => sum + h.available_beds, 0);

  // Map markers
  const getMapMarkers = (): MapMarker[] => {
    const list: MapMarker[] = [];

    // Add hospitals
    hospitals.forEach(h => {
      list.push({ id: `hosp-${h.id}`, lat: h.latitude, lng: h.longitude, type: 'hospital', label: h.name, sublabel: `Beds: ${h.available_beds}/${h.total_beds}` });
    });

    // Add active drivers
    drivers.forEach(d => {
      const u = db.users.find(usr => usr.id === d.user_id);
      if (d.is_on_duty) {
        list.push({ id: `driver-${d.id}`, lat: d.current_latitude, lng: d.current_longitude, type: 'driver', label: `Ambulance: ${u?.full_name || 'Driver'}` });
      }
    });

    // Add active emergencies
    emergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).forEach(e => {
      const m = db.users.find(usr => usr.id === e.mother_id);
      list.push({ id: `emg-${e.id}`, lat: e.latitude, lng: e.longitude, type: 'emergency', label: `🚨 Distress: ${m?.full_name || 'Patient'}`, sublabel: e.notes });
    });

    return list;
  };

  const getRoutePoints = (): [number, number][] => {
    if (selectedEmergency && selectedEmergency.driver_id) {
      const driver = drivers.find(d => d.user_id === selectedEmergency.driver_id);
      if (driver) {
        return [
          [driver.current_latitude, driver.current_longitude],
          [selectedEmergency.latitude, selectedEmergency.longitude]
        ];
      }
    }
    return [];
  };

  // Dispatch Action
  const handleAssignDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmergency) return;
    if (!dispatchDriver || !dispatchHospital) {
      alert('Please select both a driver and a matched hospital.');
      return;
    }

    try {
      saveBackupState(); // Save undo state
      EmergencyService.assignDispatch(
        selectedEmergency.id,
        dispatchDriver,
        dispatchDoctor || null,
        dispatchHospital,
        user.id,
        dispatchEta
      );
      setSelectedEmergency(null);
      setDispatchDriver(0);
      setDispatchDoctor(0);
      setDispatchHospital(0);
      loadData();
      alert('Ambulance driver has been dispatched successfully!');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Dispatch failed';
      alert(errMsg);
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm('Reset all databases and tables to default seed parameters? (This clears custom logs)')) {
      db.resetDatabase();
      loadData();
      alert('Database restored back to seeds. Please log in again.');
      navigate('/');
    }
  };

  // --- PASSWORD RESET ACTION ---
  const handleOpenPasswordReset = (targetUser: User) => {
    setPasswordUser(targetUser);
    setNewPassword('password123'); // seed temporary password
    setShowPasswordModal(true);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser) return;

    saveBackupState(); // Save backup for undo
    db.users = db.users.map(u => u.id === passwordUser.id ? {
      ...u,
      password_hash: newPassword
    } : u);

    setShowPasswordModal(false);
    setPasswordUser(null);
    setNewPassword('');
    alert('User password updated successfully. They can login with the new credential.');
  };

  // --- EXPECTANT MOTHER ACTIONS ---
  
  const handleOpenEditMother = (m: Mother) => {
    setEditMother(m);
    const u = db.users.find(usr => usr.id === m.user_id);
    setMotherForm({
      full_name: u?.full_name || '',
      email: u?.email || '',
      phone: u?.phone || '',
      blood_type: m.blood_type,
      pregnancy_start_date: m.pregnancy_start_date,
      next_of_kin_name: m.next_of_kin_name,
      next_of_kin_relationship: m.next_of_kin_relationship,
      next_of_kin_phone: m.next_of_kin_phone,
      village: m.village,
      sub_county: m.sub_county
    });
    setShowMotherModal(true);
  };

  const handleMotherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMother) return;

    saveBackupState(); // Save undo state
    
    // Update user record
    db.users = db.users.map(u => u.id === editMother.user_id ? {
      ...u,
      full_name: motherForm.full_name,
      email: motherForm.email,
      phone: motherForm.phone
    } : u);

    // Update maternal checklist variables
    db.mothers = db.mothers.map(m => m.id === editMother.id ? {
      ...m,
      blood_type: motherForm.blood_type,
      pregnancy_start_date: motherForm.pregnancy_start_date,
      next_of_kin_name: motherForm.next_of_kin_name,
      next_of_kin_relationship: motherForm.next_of_kin_relationship,
      next_of_kin_phone: motherForm.next_of_kin_phone,
      village: motherForm.village,
      sub_county: motherForm.sub_county
    } : m);

    setShowMotherModal(false);
    setEditMother(null);
    loadData();
    alert('Expectant Mother profile updated.');
  };

  const handleDeleteMother = (id: number, userId: number) => {
    if (window.confirm('Are you sure you want to delete this expectant mother?')) {
      saveBackupState(); // Save undo state
      db.mothers = db.mothers.filter(m => m.id !== id);
      db.users = db.users.filter(u => u.id !== userId);
      loadData();
      alert('Expectant mother record removed from database.');
    }
  };

  // --- FACILITY CRUD ACTIONS ---
  
  const handleOpenAddFacility = () => {
    setEditFacility(null);
    setFacilityForm({
      name: '',
      type: 'government',
      latitude: 0.3536,
      longitude: 32.7554,
      address: '',
      sub_county: 'Goma',
      phone: '',
      email: '',
      total_beds: 15,
      has_cemonc: true,
      has_blood_bank: true,
      blood_types_available: 'O+, O-, A+, B+',
      has_surgical_capacity: true,
      has_ambulance: true,
      operating_hours: '24 Hours',
      facility_type: 'HC IV'
    });
    setShowFacilityModal(true);
  };

  const handleOpenEditFacility = (h: Hospital) => {
    setEditFacility(h);
    setFacilityForm({
      name: h.name,
      type: h.type,
      latitude: h.latitude,
      longitude: h.longitude,
      address: h.address,
      sub_county: h.sub_county,
      phone: h.phone,
      email: h.email,
      total_beds: h.total_beds,
      has_cemonc: h.has_cemonc,
      has_blood_bank: h.has_blood_bank,
      blood_types_available: h.blood_types_available,
      has_surgical_capacity: h.has_surgical_capacity,
      has_ambulance: h.has_ambulance,
      operating_hours: h.operating_hours,
      facility_type: h.facility_type
    });
    setShowFacilityModal(true);
  };

  const handleDeleteFacility = (id: number) => {
    if (window.confirm('Are you sure you want to delete this health facility?')) {
      saveBackupState(); // Save undo state
      const updated = db.hospitals.filter(h => h.id !== id);
      db.hospitals = updated;
      loadData();
      alert('Health facility removed successfully.');
    }
  };

  const handleFacilitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBackupState(); // Save undo state
    if (editFacility) {
      const updated = db.hospitals.map(h => h.id === editFacility.id ? { 
        ...h, 
        name: facilityForm.name,
        type: facilityForm.type,
        latitude: Number(facilityForm.latitude),
        longitude: Number(facilityForm.longitude),
        address: facilityForm.address,
        sub_county: facilityForm.sub_county,
        phone: facilityForm.phone,
        email: facilityForm.email,
        total_beds: Number(facilityForm.total_beds),
        available_beds: Math.min(Number(facilityForm.total_beds), h.available_beds),
        has_cemonc: facilityForm.has_cemonc,
        has_blood_bank: facilityForm.has_blood_bank,
        blood_types_available: facilityForm.blood_types_available,
        has_surgical_capacity: facilityForm.has_surgical_capacity,
        has_ambulance: facilityForm.has_ambulance,
        operating_hours: facilityForm.operating_hours,
        facility_type: facilityForm.facility_type
      } : h);
      db.hospitals = updated;
      alert('Facility details updated successfully.');
    } else {
      const nextHospId = Math.max(...db.hospitals.map(h => h.id), 0) + 1;
      const newHospital: Hospital = {
        id: nextHospId,
        name: facilityForm.name,
        type: facilityForm.type,
        latitude: Number(facilityForm.latitude),
        longitude: Number(facilityForm.longitude),
        address: facilityForm.address,
        sub_county: facilityForm.sub_county,
        phone: facilityForm.phone,
        email: facilityForm.email,
        total_beds: Number(facilityForm.total_beds),
        available_beds: Number(facilityForm.total_beds),
        has_cemonc: facilityForm.has_cemonc,
        has_blood_bank: facilityForm.has_blood_bank,
        blood_types_available: facilityForm.blood_types_available,
        has_surgical_capacity: facilityForm.has_surgical_capacity,
        has_ambulance: facilityForm.has_ambulance,
        operating_hours: facilityForm.operating_hours,
        facility_type: facilityForm.facility_type
      };
      db.hospitals = [...db.hospitals, newHospital];
      alert('New health facility added.');
    }
    setShowFacilityModal(false);
    loadData();
  };

  // --- PERSONNEL CRUD ACTIONS ---
  
  const handleOpenAddPersonnel = (role: 'doctor' | 'driver') => {
    setPersonnelRole(role);
    setEditPersonnel(null);
    setPersonnelForm({
      full_name: '',
      email: '',
      phone: '',
      specialization: role === 'doctor' ? 'Obstetrician' : 'Ambulance Driver',
      license_number: '',
      hospital_id: db.hospitals[0]?.id || 1,
      vehicle_id: role === 'driver' ? (db.vehicles[0]?.id || 1) : 0,
      years_experience: 3
    });
    setShowPersonnelModal(true);
  };

  const handleOpenEditPersonnel = (role: 'doctor' | 'driver', person: Doctor | Driver) => {
    setPersonnelRole(role);
    setEditPersonnel(person);
    const u = db.users.find(usr => usr.id === person.user_id);
    
    setPersonnelForm({
      full_name: u?.full_name || '',
      email: u?.email || '',
      phone: u?.phone || '',
      specialization: role === 'doctor' ? (person as Doctor).specialization : (person as Driver).driver_role,
      license_number: person.license_number,
      hospital_id: person.hospital_id,
      vehicle_id: role === 'driver' ? ((person as Driver).vehicle_id || 0) : 0,
      years_experience: role === 'doctor' ? ((person as Doctor).years_experience || 3) : 3
    });
    setShowPersonnelModal(true);
  };

  const handleDeletePersonnel = (role: 'doctor' | 'driver', id: number, userId: number) => {
    if (window.confirm(`Are you sure you want to delete this ${role}?`)) {
      saveBackupState(); // Save undo state
      if (role === 'doctor') {
        db.doctors = db.doctors.filter(d => d.id !== id);
      } else {
        db.drivers = db.drivers.filter(d => d.id !== id);
      }
      db.users = db.users.filter(u => u.id !== userId);
      loadData();
      alert('Personnel profile deleted successfully.');
    }
  };

  const handlePersonnelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveBackupState(); // Save undo state
    if (editPersonnel) {
      db.users = db.users.map(u => u.id === editPersonnel.user_id ? {
        ...u,
        full_name: personnelForm.full_name,
        email: personnelForm.email,
        phone: personnelForm.phone
      } : u);

      if (personnelRole === 'doctor') {
        db.doctors = db.doctors.map(d => d.id === editPersonnel.id ? {
          ...d,
          hospital_id: Number(personnelForm.hospital_id),
          specialization: personnelForm.specialization,
          license_number: personnelForm.license_number,
          years_experience: Number(personnelForm.years_experience)
        } as Doctor : d);
      } else {
        db.drivers = db.drivers.map(d => d.id === editPersonnel.id ? {
          ...d,
          hospital_id: Number(personnelForm.hospital_id),
          vehicle_id: Number(personnelForm.vehicle_id) || null,
          license_number: personnelForm.license_number
        } as Driver : d);
      }
      alert('Personnel details updated successfully.');
    } else {
      const nextUserId = Math.max(...db.users.map(u => u.id), 0) + 1;
      const newUser: User = {
        id: nextUserId,
        full_name: personnelForm.full_name,
        email: personnelForm.email,
        phone: personnelForm.phone,
        password_hash: 'password123', 
        role: personnelRole,
        avatar: null,
        is_active: true,
        created_at: new Date().toISOString()
      };
      db.users = [...db.users, newUser];

      if (personnelRole === 'doctor') {
        const nextDocId = Math.max(...db.doctors.map(d => d.id), 0) + 1;
        const newDoctor: Doctor = {
          id: nextDocId,
          user_id: nextUserId,
          hospital_id: Number(personnelForm.hospital_id),
          specialization: personnelForm.specialization,
          license_number: personnelForm.license_number,
          is_on_duty: true,
          shift_start: '08:00',
          shift_end: '17:00',
          years_experience: Number(personnelForm.years_experience)
        };
        db.doctors = [...db.doctors, newDoctor];
      } else {
        const nextDrvId = Math.max(...db.drivers.map(d => d.id), 0) + 1;
        const newDriver: Driver = {
          id: nextDrvId,
          user_id: nextUserId,
          hospital_id: Number(personnelForm.hospital_id),
          vehicle_id: Number(personnelForm.vehicle_id) || null,
          license_number: personnelForm.license_number,
          driver_role: 'Ambulance Driver',
          is_on_duty: true,
          current_latitude: 0.3536,
          current_longitude: 32.7554
        };
        db.drivers = [...db.drivers, newDriver];
      }
      alert(`New ${personnelRole} profile configured successfully.`);
    }

    setShowPersonnelModal(false);
    loadData();
  };

  return (
    <div className="dasher-dashboard" style={{ background: '#f8fafd', minHeight: '100vh', fontFamily: "'Public Sans', sans-serif", display: 'flex' }}>
      
      {/* SCOPED OVERRIDES */}
      <style>{`
        .dasher-dashboard aside.sidebar-admin {
          width: 260px;
          background: #0f172a;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.08);
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          z-index: 100;
        }
        .dasher-dashboard .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          color: #94a3b8;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .dasher-dashboard .sidebar-nav-item:hover,
        .dasher-dashboard .sidebar-nav-item.active {
          color: #ffffff;
          background: rgba(255,255,255,0.06);
          border-left: 4px solid #3b82f6;
        }
        .dasher-dashboard .main-content-area {
          flex: 1;
          margin-left: 260px;
          padding: 2rem;
          background: #f8fafc;
        }
        .dasher-dashboard .bg-gradient-mixed {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          color: #ffffff;
        }
        .dasher-dashboard .card-metric {
          background: #ffffff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .dasher-dashboard .metric-val {
          font-size: 1.8rem;
          font-weight: 800;
          line-height: 1.2;
        }
        .dasher-dashboard .triage-card {
          padding: 16px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }
        .dasher-dashboard .triage-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59,130,246,0.06);
        }
        .dasher-dashboard .triage-card.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .dasher-dashboard .badge-alert-pending {
          background: #fef2f2;
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.2);
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .dasher-dashboard .badge-alert-dispatch {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid rgba(217,119,6,0.2);
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .dasher-dashboard .badge-alert-success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid rgba(22,163,74,0.2);
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
        }
        .dasher-dashboard .admin-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .dasher-dashboard .admin-modal-container {
          background: #ffffff;
          border-radius: 8px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
          border: 1px solid #cbd5e1;
        }
        .dasher-dashboard .form-label-admin {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          display: block;
          margin-bottom: 6px;
        }
        .dasher-dashboard .form-control-admin {
          font-size: 13px;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          width: 100%;
        }
      `}</style>

      {/* MOBILE RESPONSIVE + DARK MODE OVERRIDES */}
      <style>{`
        /* ── Admin Dashboard Responsive Mobile Rules ── */

        /* On mobile: sidebar becomes a fixed bottom navigation bar */
        @media (max-width: 768px) {
          .dasher-dashboard {
            flex-direction: column !important;
          }
          .dasher-dashboard aside.sidebar-admin {
            position: fixed !important;
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: auto !important;
            flex-direction: row !important;
            border-right: none !important;
            border-top: 1px solid rgba(255,255,255,0.08) !important;
            z-index: 200 !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
          }
          /* Hide the logo and user profile in mobile sidebar */
          .dasher-dashboard aside.sidebar-admin > div:first-child,
          .dasher-dashboard aside.sidebar-admin > div:last-child {
            display: none !important;
          }
          .dasher-dashboard aside.sidebar-admin nav {
            display: flex !important;
            flex-direction: row !important;
            width: 100% !important;
            padding: 0 !important;
            justify-content: space-around !important;
          }
          .dasher-dashboard .sidebar-nav-item {
            flex-direction: column !important;
            padding: 10px 8px !important;
            gap: 4px !important;
            font-size: 10px !important;
            flex: 1 !important;
            justify-content: center !important;
            text-align: center !important;
            border-left: none !important;
            border-top: 3px solid transparent !important;
          }
          .dasher-dashboard .sidebar-nav-item.active {
            border-left: none !important;
            border-top: 3px solid #3b82f6 !important;
          }
          .dasher-dashboard .sidebar-nav-item span {
            display: block !important;
            font-size: 9px !important;
            line-height: 1.2 !important;
          }
          .dasher-dashboard .main-content-area {
            margin-left: 0 !important;
            padding: 1rem !important;
            padding-bottom: 80px !important; /* space for bottom nav */
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          /* Stack stat cards into 2 columns */
          .dasher-dashboard .row.mb-6.g-4 {
            flex-wrap: wrap !important;
          }
          .dasher-dashboard .row.mb-6.g-4 > div {
            flex: 0 0 calc(50% - 10px) !important;
            min-width: 0 !important;
          }
          /* Stack dispatch grid: triage queue above, map below */
          .dasher-dashboard .dispatch-grid {
            grid-template-columns: 1fr !important;
          }
          /* Stack all 2-column grids */
          .dasher-dashboard [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          /* Search bar full width on mobile */
          .dasher-dashboard header > div:nth-child(2) {
            flex: 1 1 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            order: 3 !important;
          }
          /* Header wraps to rows on mobile */
          .dasher-dashboard header {
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          /* Topbar action buttons shrink */
          .dasher-dashboard header > div:last-child {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }
          .dasher-dashboard header > div:last-child button {
            font-size: 11px !important;
            padding: 6px 10px !important;
          }
          /* Modal becomes full-screen on mobile */
          .dasher-dashboard .admin-modal-container {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            border-radius: 16px 16px 0 0 !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
          .dasher-dashboard .admin-modal-overlay {
            align-items: flex-end !important;
          }
          /* Metric value text scales down */
          .dasher-dashboard .metric-val {
            font-size: 1.4rem !important;
          }
          /* Tables scroll horizontally within their container */
          .dasher-dashboard .table-responsive {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          /* Keep the greeting banner readable */
          .dasher-dashboard .bg-gradient-mixed h2 {
            font-size: 1.2rem !important;
          }
          .dasher-dashboard .bg-gradient-mixed p {
            font-size: 12px !important;
          }
        }
      `}</style>

      {/* VERTICAL SIDEBAR */}
      <aside className="sidebar-admin">
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#3b82f6', color: '#ffffff', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
            M
          </div>
          <div>
            <h5 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>MamaTrack</h5>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Command Desk</span>
          </div>
        </div>

        <nav style={{ flex: 1, paddingTop: '20px' }}>
          <div className={`sidebar-nav-item ${activeTab === 'dispatch' ? 'active' : ''}`} onClick={() => setActiveTab('dispatch')}>
            <i className="ti ti-alert-triangle" style={{ fontSize: '18px' }}></i>
            <span>Active Dispatch</span>
          </div>
          <div className={`sidebar-nav-item ${activeTab === 'facilities' ? 'active' : ''}`} onClick={() => setActiveTab('facilities')}>
            <i className="ti ti-building-hospital" style={{ fontSize: '18px' }}></i>
            <span>Health Facilities</span>
          </div>
          <div className={`sidebar-nav-item ${activeTab === 'personnel' ? 'active' : ''}`} onClick={() => setActiveTab('personnel')}>
            <i className="ti ti-users" style={{ fontSize: '18px' }}></i>
            <span>Duty Personnel</span>
          </div>
          <div className={`sidebar-nav-item ${activeTab === 'mothers' ? 'active' : ''}`} onClick={() => setActiveTab('mothers')}>
            <i className="ti ti-user-heart" style={{ fontSize: '18px' }}></i>
            <span>Expectant Mothers</span>
          </div>
          <div className={`sidebar-nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <i className="ti ti-file-analytics" style={{ fontSize: '18px' }}></i>
            <span>Audit & Fuel Logs</span>
          </div>
        </nav>

        {/* Sidebar Footer User profile */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ProfilePhotoUpload user={user} onUpdated={setUser} size={38} showLabel={false} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                {user.full_name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Hon\.)\s+/i, '').split(' ')[0]}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>System Admin</div>
            </div>
          </div>
          <button 
            onClick={() => { AuthService.logout(); navigate('/'); }}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Logout"
          >
            <i className="ti ti-logout" style={{ fontSize: '18px' }}></i>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER CONTENT AREA */}
      <main className="main-content-area">
        
        {/* TOPBAR HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Command Center Workspace</h4>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Mukono Regional Ambulance Dispatch Fleet Monitor</span>
          </div>

          {activeTab !== 'reports' && (
            <div style={{ flex: 1, maxWidth: '300px', position: 'relative', margin: '0 16px' }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '16px' }}></i>
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="admin-search-input"
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {undoStack.length > 0 && (
              <button 
                onClick={handleUndo} 
                className="btn btn-warning" 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, padding: '8px 16px', borderRadius: '6px', background: '#f59e0b', color: '#ffffff', border: 'none' }}
              >
                ↩️ Undo Last Change ({undoStack.length})
              </button>
            )}

            <button 
              onClick={handleResetDatabase} 
              className="btn btn-outline-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155' }}
            >
              <RefreshCw size={13} /> Reset Database
            </button>
            <ThemeToggle />
            <button 
              onClick={() => { AuthService.logout(); navigate('/'); }}
              className="admin-logout-btn"
              style={{ display: 'none', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '6px', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}
              title="Logout"
            >
              <i className="ti ti-logout" style={{ fontSize: '16px' }}></i>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* GREETING BANNER WIDGET */}
        <div className="bg-gradient-mixed rounded-3 p-6 mb-6" style={{ padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px', color: '#ffffff' }}>
            👋 Hello, {user.full_name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Hon\.)\s+/i, '')}!
          </h2>
          <p style={{ margin: 0, opacity: 0.95, fontSize: '14px', lineHeight: 1.5, color: '#cbd5e1' }}>
            Welcome to the regional command console. Coordinate emergency obstetric dispatches, monitor safety parameters, and manage clinic facility status parameters in Mukono District.
          </p>
        </div>

        {/* STATS COUNT METRICS ROW */}
        <div className="row mb-6 g-4" style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <div className="card-metric" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="metric-val" style={{ color: '#ef4444' }}>{pendingCount}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Pending SOS Alerts</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-metric" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="metric-val" style={{ color: '#3b82f6' }}>{activeDispatchCount}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Active Missions</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-metric" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="metric-val" style={{ color: '#10b981' }}>{onDutyDrivers}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Drivers On Duty</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-metric" style={{ borderLeft: '4px solid #6366f1' }}>
              <div className="metric-val" style={{ color: '#6366f1' }}>{onDutyDoctors}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Specialists On Duty</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="card-metric" style={{ borderLeft: '4px solid #22c55e' }}>
              <div className="metric-val" style={{ color: '#22c55e' }}>{totalAvailableBeds}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Available Ward Beds</div>
            </div>
          </div>
        </div>

        {/* TAB WORKSPACE CONTENT */}

        {/* TAB 1: ACTIVE DISPATCH BOARD */}
        {activeTab === 'dispatch' && (
          <div className="row g-4" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
            
            {/* Distress Triage Queue column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <h5 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>🚨 Distress Triage Queue</h5>
                </div>
                
                <div style={{ padding: '16px', maxHeight: '420px', overflowY: 'auto' }}>
                  {filteredEmergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '13px', color: '#64748b' }}>
                      🟢 No matching active emergencies reported in the region
                    </div>
                  ) : (
                    filteredEmergencies.filter(e => !['completed', 'cancelled'].includes(e.status)).map(e => {
                      const m = db.users.find(usr => usr.id === e.mother_id);
                      return (
                        <div
                          key={e.id}
                          className={`triage-card ${selectedEmergency?.id === e.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedEmergency(e);
                            setDispatchHospital(e.hospital_id || 1);
                            setDispatchDoctor(0); // Reset previously selected receiving doctor
                            const availableDrv = drivers.find(d => d.is_on_duty && d.vehicle_id);
                            if (availableDrv) setDispatchDriver(availableDrv.user_id);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '14px' }}>{e.code}</strong>
                            <span className={e.status === 'pending' ? 'badge-alert-pending' : 'badge-alert-dispatch'}>
                              {e.status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Patient: {m?.full_name || 'Mother'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Distress: {e.notes}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Dispatch Action Panel */}
              {selectedEmergency && selectedEmergency.status === 'pending' && (
                <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                      Dispatch Rescue to {db.users.find(u => u.id === selectedEmergency.mother_id)?.full_name}
                    </h5>
                  </div>
                  
                  <div style={{ padding: '20px' }}>
                    <form onSubmit={handleAssignDispatch}>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Target Hospital Facility</label>
                        <select className="form-select" style={{ fontSize: '13px', padding: '8px 12px' }} value={dispatchHospital} onChange={e => setDispatchHospital(Number(e.target.value))}>
                          {hospitals.map(h => (
                            <option key={h.id} value={h.id}>{h.name} (Beds: {h.available_beds})</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Ambulance Driver (On-Duty)</label>
                        <select className="form-select" style={{ fontSize: '13px', padding: '8px 12px' }} value={dispatchDriver} onChange={e => setDispatchDriver(Number(e.target.value))}>
                          <option value="0">-- Select Available Driver --</option>
                          {drivers.filter(d => d.is_on_duty).map(d => {
                            const u = db.users.find(usr => usr.id === d.user_id);
                            const v = vehicles.find(veh => veh.id === d.vehicle_id);
                            return (
                              <option key={d.id} value={d.user_id}>
                                {u?.full_name} - {v?.plate_number || 'No vehicle'}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Receiving Medical Specialist (Optional)</label>
                        <select className="form-select" style={{ fontSize: '13px', padding: '8px 12px' }} value={dispatchDoctor} onChange={e => setDispatchDoctor(Number(e.target.value))}>
                          <option value="0">-- Standby Triage Doctor --</option>
                          {doctors.filter(doc => doc.is_on_duty && doc.hospital_id === dispatchHospital).map(doc => {
                            const u = db.users.find(usr => usr.id === doc.user_id);
                            return (
                              <option key={doc.id} value={doc.user_id}>
                                {u?.full_name} ({doc.specialization})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Estimated Rescue Arrival (ETA - Mins)</label>
                        <input type="number" className="form-control" style={{ fontSize: '13px', padding: '8px 12px' }} value={dispatchEta} onChange={e => setDispatchEta(Number(e.target.value))} min={5} max={120} required />
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', fontWeight: 700, fontSize: '14px', background: '#3b82f6', border: 'none' }}>
                        Dispatch Rescue Mission →
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Map Fleet Monitor column */}
            <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '12px' }}>
                <h5 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}><i className="ti ti-map-pin" style={{ color: '#3b82f6' }}></i> GPS Fleet monitor Map</h5>
              </div>
              <div style={{ flex: 1, minHeight: '440px', borderRadius: '6px', overflow: 'hidden' }}>
                <MapComponent
                  center={[0.3536, 32.7554]} 
                  zoom={12}
                  markers={getMapMarkers()}
                  routePoints={getRoutePoints()}
                  theme={theme}
                />
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: HEALTH FACILITIES */}
        {activeTab === 'facilities' && (
          <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Hospital Referral Network Directory</h4>
              <button 
                onClick={handleOpenAddFacility}
                className="btn btn-primary" 
                style={{ fontSize: '13px', fontWeight: 700, padding: '6px 16px', border: 'none', background: '#3b82f6', borderRadius: '4px' }}
              >
                ➕ Add Health Facility
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {filteredHospitals.map(h => (
                <div key={h.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>{h.name}</strong>
                      <span className="badge-alert-success">{h.type.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>📍 {h.address}</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: '#334155', borderTop: '1px dashed #e2e8f0', paddingTop: '10px', marginBottom: '14px' }}>
                      <div>Ward Beds: <strong>{h.available_beds} / {h.total_beds}</strong></div>
                      <div>Clinic Hotline: <strong>{h.phone}</strong></div>
                      <div>Surgical Capacity: <strong>{h.has_surgical_capacity ? '✅ Available' : '❌ None'}</strong></div>
                      <div>CEmONC capability: <strong>{h.has_cemonc ? '✅ Yes' : '❌ No'}</strong></div>
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleOpenEditFacility(h)}
                      className="btn btn-sm btn-outline-secondary" 
                      style={{ fontSize: '12px', padding: '4px 10px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155' }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteFacility(h.id)}
                      className="btn btn-sm btn-outline-danger" 
                      style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PERSONNEL STATUS */}
        {activeTab === 'personnel' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Doctors roster */}
            <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Specialists Roster</h5>
                <button 
                  onClick={() => handleOpenAddPersonnel('doctor')}
                  className="btn btn-sm btn-primary"
                  style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', border: 'none', background: '#3b82f6' }}
                >
                  ➕ Add Doctor
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredDoctors.map(d => {
                  const u = db.users.find(usr => usr.id === d.user_id);
                  const h = hospitals.find(hosp => hosp.id === d.hospital_id);
                  return (
                    <div key={d.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>{u?.full_name}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{d.specialization} · {h?.name}</div>
                        </div>
                        <span className={d.is_on_duty ? 'badge-alert-success' : 'badge-alert-dispatch'}>
                          {d.is_on_duty ? 'ON SHIFT' : 'STANDBY'}
                        </span>
                      </div>

                      {/* Doctor actions row */}
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px', marginTop: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {u && (
                          <button 
                            onClick={() => handleOpenPasswordReset(u)}
                            style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', color: '#475569' }}
                          >
                            🔑 Reset Pass
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenEditPersonnel('doctor', d)}
                          style={{ fontSize: '11px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePersonnel('doctor', d.id, d.user_id)}
                          style={{ fontSize: '11px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drivers roster */}
            <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Ambulance Drivers</h5>
                <button 
                  onClick={() => handleOpenAddPersonnel('driver')}
                  className="btn btn-sm btn-primary"
                  style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', border: 'none', background: '#3b82f6' }}
                >
                  ➕ Add Driver
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredDrivers.map(d => {
                  const u = db.users.find(usr => usr.id === d.user_id);
                  const v = vehicles.find(veh => veh.id === d.vehicle_id);
                  return (
                    <div key={d.id} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>{u?.full_name}</strong>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Plate: {v?.plate_number || 'No vehicle'} ({v?.vehicle_type})</div>
                        </div>
                        <span className={d.is_on_duty ? 'badge-alert-success' : 'badge-alert-dispatch'}>
                          {d.is_on_duty ? 'ACTIVE SHIFT' : 'OFF SHIFT'}
                        </span>
                      </div>

                      {/* Driver actions row */}
                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '8px', marginTop: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {u && (
                          <button 
                            onClick={() => handleOpenPasswordReset(u)}
                            style={{ fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', color: '#475569' }}
                          >
                            🔑 Reset Pass
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenEditPersonnel('driver', d)}
                          style={{ fontSize: '11px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePersonnel('driver', d.id, d.user_id)}
                          style={{ fontSize: '11px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: EXPECTANT MOTHERS */}
        {activeTab === 'mothers' && (
          <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Registered Expectant Mothers Profiles</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {filteredMothers.map(m => {
                const u = db.users.find(usr => usr.id === m.user_id);
                return (
                  <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>{u?.full_name}</strong>
                        <span className="badge-alert-pending" style={{ background: '#fff0f6', color: '#d0145a', borderColor: 'rgba(208,20,90,0.2)' }}>
                          BLOOD: {m.blood_type}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '13px', color: '#334155', marginBottom: '12px' }}>
                        <div>📧 Email: <strong>{u?.email}</strong></div>
                        <div>📞 Phone: <strong>{u?.phone}</strong></div>
                        <div>📍 Location: <strong>{m.village}, {m.sub_county} Sub-county</strong></div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: '#475569', borderTop: '1px dashed #e2e8f0', paddingTop: '10px', marginBottom: '14px' }}>
                        <div>Pregnancy Start: <strong>{m.pregnancy_start_date}</strong></div>
                        <div>Kin: <strong>{m.next_of_kin_name} ({m.next_of_kin_relationship})</strong></div>
                        <div>Kin Phone: <strong>{m.next_of_kin_phone}</strong></div>
                        <div>VHT Assigned: <strong>{m.vht_name} ({m.vht_phone})</strong></div>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {u && (
                        <button 
                          onClick={() => handleOpenPasswordReset(u)}
                          className="btn btn-sm btn-outline-secondary" 
                          style={{ fontSize: '12px', padding: '4px 10px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569' }}
                        >
                          🔑 Reset Pass
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenEditMother(m)}
                        className="btn btn-sm btn-outline-secondary" 
                        style={{ fontSize: '12px', padding: '4px 10px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155' }}
                      >
                        ✏️ Edit Profile
                      </button>
                      <button 
                        onClick={() => handleDeleteMother(m.id, m.user_id)}
                        className="btn btn-sm btn-outline-danger" 
                        style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: REPORTS & HISTORICAL LOGS */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Historical SOS table */}
            <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
              <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>Historical Rescue Referral Audit Logs</h5>
              
              <div style={{ overflowX: 'auto' }}>
                <table className="table table-bordered" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontWeight: 700 }}>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Code</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Patient</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Hospital</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Assigned Driver</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Triggered At</th>
                      <th style={{ padding: '12px', border: '1px solid #cbd5e1' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmergencies.map(e => {
                      const m = db.users.find(u => u.id === e.mother_id);
                      const h = hospitals.find(hosp => hosp.id === e.hospital_id);
                      const d = db.users.find(u => u.id === e.driver_id);
                      return (
                        <tr key={e.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#3b82f6' }}>{e.code}</td>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{m?.full_name || 'Mother'}</td>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{h?.name || '-'}</td>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>{d?.full_name || '-'}</td>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1', color: '#64748b' }}>
                            {new Date(e.triggered_at).toLocaleDateString()} {new Date(e.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '12px', border: '1px solid #cbd5e1' }}>
                            <span className={e.status === 'completed' ? 'badge-alert-success' : e.status === 'cancelled' ? 'badge-alert-dispatch' : 'badge-alert-pending'}>
                              {e.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inspections and Fuel Logs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Safety inspections */}
              <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
                <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Pre-duty Safety Inspections</h5>
                <div style={{ maxHeight: '280px', overflowY: 'auto', fontSize: '13px' }}>
                  {db.inspections.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No inspection records logged.</div>
                  ) : (
                    db.inspections.map(i => {
                      const drv = db.users.find(u => u.id === i.driver_id);
                      const veh = db.vehicles.find(v => v.id === i.vehicle_id);
                      return (
                        <div key={i.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '10px 0' }}>
                          <div style={{ fontWeight: 600, color: '#334155' }}>Ambulance: {veh?.plate_number} ({drv?.full_name})</div>
                          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                            Fuel: {i.fuel_level.toUpperCase()} | Siren: {i.siren_ok ? '✅ OK' : '❌ Fail'} | Tires: {i.tires_ok ? '✅ OK' : '❌ Fail'} | Engine: {i.engine_ok ? '✅ OK' : '❌ Fail'}
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{new Date(i.checked_at).toLocaleString()}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Fuel purchase logs */}
              <div className="card" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', padding: '24px' }}>
                <h5 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>Ambulance Fuel Purchases</h5>
                <div style={{ maxHeight: '280px', overflowY: 'auto', fontSize: '13px' }}>
                  {db.fuelLogs.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No fuel records logged.</div>
                  ) : (
                    db.fuelLogs.map(f => {
                      const drv = db.users.find(u => u.id === f.driver_id);
                      const veh = db.vehicles.find(v => v.id === f.vehicle_id);
                      return (
                        <div key={f.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#334155' }}>Plate: {veh?.plate_number}</div>
                            <div style={{ color: '#64748b', fontSize: '12px' }}>Station: {f.station} · {f.liters} Liters (Drv: {drv?.full_name.split(' ')[0]})</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ color: '#10b981' }}>{f.cost.toLocaleString()} UGX</strong>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(f.logged_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* FOOTER */}
        <footer className="dashboard-footer">
          <p>© 2026 MamaTrack GPS · Regional Maternal Emergency Response System. All rights reserved.</p>
        </footer>
      </main>

      {/* --- PASSWORD RESET MODAL --- */}
      {showPasswordModal && passwordUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container" style={{ maxWidth: '400px' }}>
            <div style={{ background: '#0f172a', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', color: '#ffffff' }}>
              <h5 style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>🔑 Reset User Password</h5>
              <button onClick={() => { setShowPasswordModal(false); setPasswordUser(null); }} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            
            <form onSubmit={handlePasswordResetSubmit} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  Resetting credentials for: <strong>{passwordUser.full_name}</strong> ({passwordUser.role})
                </div>
                <label className="form-label-admin">New Account Password</label>
                <input 
                  type="text" 
                  className="form-control-admin"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="e.g. password123"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '15px' }}>
                <button type="button" className="btn btn-sm btn-outline-secondary" style={{ padding: '6px 14px' }} onClick={() => { setShowPasswordModal(false); setPasswordUser(null); }}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '6px 14px', background: '#3b82f6', border: 'none' }}>Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT EXPECTANT MOTHER PROFILE MODAL --- */}
      {showMotherModal && editMother && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div style={{ background: '#be123c', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', color: '#ffffff' }}>
              <h5 style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>✏️ Edit Expectant Mother Health Profile</h5>
              <button onClick={() => { setShowMotherModal(false); setEditMother(null); }} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <form onSubmit={handleMotherSubmit} style={{ padding: '20px', maxHeight: '480px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label-admin">Mother Full Name</label>
                <input 
                  type="text" 
                  className="form-control-admin" 
                  value={motherForm.full_name} 
                  onChange={e => setMotherForm({ ...motherForm, full_name: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label-admin">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control-admin" 
                    value={motherForm.email} 
                    onChange={e => setMotherForm({ ...motherForm, email: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label-admin">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control-admin" 
                    value={motherForm.phone} 
                    onChange={e => setMotherForm({ ...motherForm, phone: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label-admin">Blood Group</label>
                  <select 
                    className="form-control-admin" 
                    value={motherForm.blood_type} 
                    onChange={e => setMotherForm({ ...motherForm, blood_type: e.target.value })}
                  >
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
                <div>
                  <label className="form-label-admin">Pregnancy Confirmation Date</label>
                  <input 
                    type="date" 
                    className="form-control-admin" 
                    value={motherForm.pregnancy_start_date} 
                    onChange={e => setMotherForm({ ...motherForm, pregnancy_start_date: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <h6 style={{ fontSize: '12px', fontWeight: 700, borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', margin: '14px 0 10px', color: '#be123c' }}>Next of Kin Details</h6>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label-admin">Kin Full Name</label>
                  <input 
                    type="text" 
                    className="form-control-admin" 
                    value={motherForm.next_of_kin_name} 
                    onChange={e => setMotherForm({ ...motherForm, next_of_kin_name: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label-admin">Relationship</label>
                  <select 
                    className="form-control-admin" 
                    value={motherForm.next_of_kin_relationship} 
                    onChange={e => setMotherForm({ ...motherForm, next_of_kin_relationship: e.target.value })}
                  >
                    <option value="Husband">Husband</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="VHT Worker">VHT Worker</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label-admin">Kin Phone Number</label>
                <input 
                  type="tel" 
                  className="form-control-admin" 
                  value={motherForm.next_of_kin_phone} 
                  onChange={e => setMotherForm({ ...motherForm, next_of_kin_phone: e.target.value })} 
                  required 
                />
              </div>

              <h6 style={{ fontSize: '12px', fontWeight: 700, borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', margin: '14px 0 10px', color: '#be123c' }}>Residential Information</h6>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label-admin">Sub County</label>
                  <select 
                    className="form-control-admin" 
                    value={motherForm.sub_county} 
                    onChange={e => setMotherForm({ ...motherForm, sub_county: e.target.value })}
                  >
                    <option value="Goma">Goma</option>
                    <option value="Nama">Nama</option>
                    <option value="Mukono Municipality">Mukono Municipality</option>
                    <option value="Koome">Koome</option>
                    <option value="Ntenjeru">Ntenjeru</option>
                  </select>
                </div>
                <div>
                  <label className="form-label-admin">Village / Ward</label>
                  <input 
                    type="text" 
                    className="form-control-admin" 
                    value={motherForm.village} 
                    onChange={e => setMotherForm({ ...motherForm, village: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '15px' }}>
                <button type="button" className="btn btn-sm btn-outline-secondary" style={{ padding: '6px 14px' }} onClick={() => { setShowMotherModal(false); setEditMother(null); }}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '6px 14px', background: '#be123c', border: 'none' }}>Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT HEALTH FACILITY MODAL --- */}
      {showFacilityModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div style={{ background: '#3b82f6', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', color: '#ffffff' }}>
              <h5 style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>
                {editFacility ? '✏️ Edit Referral Facility' : '🏥 Add New Referral Facility'}
              </h5>
              <button onClick={() => setShowFacilityModal(false)} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <form onSubmit={handleFacilitySubmit} style={{ padding: '20px', maxHeight: '480px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label-admin">Facility Name</label>
                <input 
                  type="text" 
                  className="form-control-admin" 
                  value={facilityForm.name} 
                  onChange={e => setFacilityForm({ ...facilityForm, name: e.target.value })} 
                  placeholder="e.g. Mukono General Hospital" 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label-admin">Facility Type</label>
                  <select 
                    className="form-control-admin" 
                    value={facilityForm.type} 
                    onChange={e => setFacilityForm({ ...facilityForm, type: e.target.value as Hospital['type'] })}
                  >
                    <option value="government">Government</option>
                    <option value="private">Private</option>
                    <option value="ngo">NGO / Mission</option>
                  </select>
                </div>
                <div>
                  <label className="form-label-admin">Level Class</label>
                  <input 
                    type="text" 
                    className="form-control-admin" 
                    value={facilityForm.facility_type} 
                    onChange={e => setFacilityForm({ ...facilityForm, facility_type: e.target.value })} 
                    placeholder="e.g. General Hospital / HC IV" 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label-admin">Latitude</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    className="form-control-admin" 
                    value={facilityForm.latitude} 
                    onChange={e => setFacilityForm({ ...facilityForm, latitude: Number(e.target.value) })} 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label-admin">Longitude</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    className="form-control-admin" 
                    value={facilityForm.longitude} 
                    onChange={e => setFacilityForm({ ...facilityForm, longitude: Number(e.target.value) })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label-admin">Physical Address</label>
                <input 
                  type="text" 
                  className="form-control-admin" 
                  value={facilityForm.address} 
                  onChange={e => setFacilityForm({ ...facilityForm, address: e.target.value })} 
                  placeholder="e.g. Kampala-Jinja Highway, Mukono Town" 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label-admin">Sub County</label>
                  <select 
                    className="form-control-admin" 
                    value={facilityForm.sub_county} 
                    onChange={e => setFacilityForm({ ...facilityForm, sub_county: e.target.value })}
                  >
                    <option value="Goma">Goma</option>
                    <option value="Nama">Nama</option>
                    <option value="Mukono Municipality">Mukono Municipality</option>
                    <option value="Koome">Koome</option>
                    <option value="Ntenjeru">Ntenjeru</option>
                  </select>
                </div>
                <div>
                  <label className="form-label-admin">Hotline Phone</label>
                  <input 
                    type="tel" 
                    className="form-control-admin" 
                    value={facilityForm.phone} 
                    onChange={e => setFacilityForm({ ...facilityForm, phone: e.target.value })} 
                    placeholder="e.g. +256-788-000-000" 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label-admin">Total Ward Beds</label>
                  <input 
                    type="number" 
                    className="form-control-admin" 
                    value={facilityForm.total_beds} 
                    onChange={e => setFacilityForm({ ...facilityForm, total_beds: Number(e.target.value) })} 
                    min={1} 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label-admin">Facility Email</label>
                  <input 
                    type="email" 
                    className="form-control-admin" 
                    value={facilityForm.email} 
                    onChange={e => setFacilityForm({ ...facilityForm, email: e.target.value })} 
                    placeholder="clinic@mamatrack.go.ug" 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="checkbox" 
                    id="has_surgical_capacity"
                    checked={facilityForm.has_surgical_capacity} 
                    onChange={e => setFacilityForm({ ...facilityForm, has_surgical_capacity: e.target.checked })} 
                  />
                  <label htmlFor="has_surgical_capacity" style={{ fontSize: '11px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Surgical Theater</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="checkbox" 
                    id="has_cemonc"
                    checked={facilityForm.has_cemonc} 
                    onChange={e => setFacilityForm({ ...facilityForm, has_cemonc: e.target.checked })} 
                  />
                  <label htmlFor="has_cemonc" style={{ fontSize: '11px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>CEmONC Capability</label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '15px' }}>
                <button type="button" className="btn btn-sm btn-outline-secondary" style={{ padding: '6px 14px' }} onClick={() => setShowFacilityModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '6px 14px', background: '#3b82f6', border: 'none' }}>Save Facility</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT PERSONNEL MODAL --- */}
      {showPersonnelModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-container">
            <div style={{ background: '#3b82f6', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', color: '#ffffff' }}>
              <h5 style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>
                {editPersonnel ? `✏️ Edit ${personnelRole.toUpperCase()}` : `👥 Add New ${personnelRole.toUpperCase()}`}
              </h5>
              <button onClick={() => setShowPersonnelModal(false)} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>

            <form onSubmit={handlePersonnelSubmit} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label-admin">Full Name</label>
                <input 
                  type="text" 
                  className="form-control-admin" 
                  value={personnelForm.full_name} 
                  onChange={e => setPersonnelForm({ ...personnelForm, full_name: e.target.value })} 
                  placeholder="e.g. Dr. Dan Ssemanda" 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label className="form-label-admin">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control-admin" 
                    value={personnelForm.email} 
                    onChange={e => setPersonnelForm({ ...personnelForm, email: e.target.value })} 
                    placeholder="name@mamatrack.go.ug" 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label-admin">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control-admin" 
                    value={personnelForm.phone} 
                    onChange={e => setPersonnelForm({ ...personnelForm, phone: e.target.value })} 
                    placeholder="+256-772-000-000" 
                    required 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="form-label-admin">Assigned Facility</label>
                <select 
                  className="form-control-admin" 
                  value={personnelForm.hospital_id} 
                  onChange={e => setPersonnelForm({ ...personnelForm, hospital_id: Number(e.target.value) })}
                >
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                {personnelRole === 'doctor' ? (
                  <>
                    <div>
                      <label className="form-label-admin">Specialization</label>
                      <input 
                        type="text" 
                        className="form-control-admin" 
                        value={personnelForm.specialization} 
                        onChange={e => setPersonnelForm({ ...personnelForm, specialization: e.target.value })} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="form-label-admin">Years Experience</label>
                      <input 
                        type="number" 
                        className="form-control-admin" 
                        value={personnelForm.years_experience} 
                        onChange={e => setPersonnelForm({ ...personnelForm, years_experience: Number(e.target.value) })} 
                        required 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="form-label-admin">Driver License No.</label>
                      <input 
                        type="text" 
                        className="form-control-admin" 
                        value={personnelForm.license_number} 
                        onChange={e => setPersonnelForm({ ...personnelForm, license_number: e.target.value })} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="form-label-admin">Assigned Ambulance</label>
                      <select 
                        className="form-control-admin" 
                        value={personnelForm.vehicle_id} 
                        onChange={e => setPersonnelForm({ ...personnelForm, vehicle_id: Number(e.target.value) })}
                      >
                        <option value="0">-- None / Standby --</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.plate_number} ({v.vehicle_type})</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label-admin">Professional License / Registration No.</label>
                <input 
                  type="text" 
                  className="form-control-admin" 
                  value={personnelForm.license_number} 
                  onChange={e => setPersonnelForm({ ...personnelForm, license_number: e.target.value })} 
                  placeholder="e.g. MOH/DOC-8321"
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #cbd5e1', paddingTop: '15px' }}>
                <button type="button" className="btn btn-sm btn-outline-secondary" style={{ padding: '6px 14px' }} onClick={() => setShowPersonnelModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary" style={{ padding: '6px 14px', background: '#3b82f6', border: 'none' }}>Save Personnel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
