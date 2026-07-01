// MamaTrack GPS — Custom Landing Page (Integrated with Medical Center Template)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Import template stylesheets
import '../styles/medical-center/bootstrap.min.css';
import '../styles/medical-center/flaticon.css';
import '../styles/medical-center/themify-icons.css';
import '../styles/medical-center/fontawesome-all.min.css';
import '../styles/medical-center/style.css';

export const Landing: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-cycle slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slides = [
    {
      subtitle: "Bringing a life should not end another",
      title: "Mukono Maternal Emergency Rescue Dispatch",
      desc: "One-tap GPS beacon coordinates to dispatch nearby drivers in seconds.",
      buttonText: "Access Portals",
      link: "#portals",
    },
    {
      subtitle: "Professional Medical Guidance Anywhere, Anytime",
      title: "24/7 On-Duty Clinical Doctor Consultations",
      desc: "Expectant mothers are matched directly with local medical practitioners for symptom chats.",
      buttonText: "Clinical Portal",
      link: "/login?role=doctor",
    },
    {
      subtitle: "Transmitting Live Coordinates to Responder Networks",
      title: "GPS-Powered Ambulance Navigation Logs",
      desc: "Drivers receive alerts and routing paths dynamically to reduce transport delays.",
      buttonText: "Driver Portal",
      link: "/login?role=driver",
    }
  ];

  return (
    <div id="top" className="medical-landing-root" style={{ background: '#ffffff', color: '#757575', fontFamily: "'Muli', sans-serif" }}>
      
      {/* HEADER START */}
      <header>
        <div className="header-area">
          <div className="main-header header-sticky" style={{ background: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div className="container-fluid" style={{ padding: '0 40px' }}>
              <div className="row align-items-center" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0' }}>
                {/* Logo */}
                <div className="col-xl-3 col-lg-3 col-md-3">
                  <div className="logo">
                    <Link to="/" style={{ fontSize: '1.9rem', fontWeight: 800, color: '#030431', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#0f61ef', color: '#ffffff', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                        <i className="fa fa-h-square"></i>
                      </span>
                      <span>Mama<span style={{ color: '#0f61ef' }}>Track</span></span>
                    </Link>
                  </div>
                </div>
                
                {/* Navigation Menu */}
                <div className="col-xl-9 col-lg-9 col-md-9" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div className="menu-main d-flex align-items-center justify-content-end" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div className="main-menu d-none d-lg-block">
                      <nav>
                        <ul id="navigation" style={{ display: 'flex', listStyle: 'none', gap: '28px', margin: 0, padding: 0, flexDirection: 'row' }}>
                          <li><a href="#top" style={{ color: '#102039', fontWeight: 600, fontSize: '15px' }}>Home</a></li>
                          <li><a href="#portals" style={{ color: '#102039', fontWeight: 600, fontSize: '15px' }}>System Portals</a></li>
                          <li><a href="#about" style={{ color: '#102039', fontWeight: 600, fontSize: '15px' }}>About</a></li>
                          <li><a href="#news" style={{ color: '#102039', fontWeight: 600, fontSize: '15px' }}>News</a></li>
                        </ul>
                      </nav>
                    </div>
                    
                    <div className="header-right-btn f-right d-none d-lg-block ml-30">
                      <Link to="/register" className="btn header-btn" style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '6px', color: '#ffffff', textDecoration: 'none' }}>
                        Register Profile
                      </Link>
                    </div>
                  </div>
                </div>   
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SLIDER SECTION */}
      <section id="home" className="slider-area" style={{ position: 'relative', height: '620px', overflow: 'hidden', background: '#ffffff url(/assets/img/hero/h1_hero.png) no-repeat center center / cover' }}>
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className="single-slider slider-height d-flex align-items-center"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: activeSlide === idx ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              zIndex: activeSlide === idx ? 2 : 1
            }}
          >
            <div className="container">
              <div className="row">
                <div className="col-xl-8 col-lg-10 col-md-10">
                  <div className="hero__caption" style={{ padding: '40px 0' }}>
                    <span style={{ color: '#0f61ef', fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '14px' }}>
                      {slide.subtitle}
                    </span>
                    <h1 style={{ color: '#030431', fontSize: '3.6rem', fontWeight: 900, lineHeight: 1.15, marginBottom: '20px' }}>
                      {slide.title}
                    </h1>
                    <p style={{ color: '#4b5563', fontSize: '1.1rem', marginBottom: '35px', maxWidth: '600px', lineHeight: 1.6 }}>
                      {slide.desc}
                    </p>
                    {slide.link.startsWith('#') ? (
                      <a href={slide.link} className="btn hero-btn" style={{ padding: '14px 28px', color: '#ffffff', textDecoration: 'none', borderRadius: '6px' }}>
                        {slide.buttonText} <i className="ti-arrow-right" style={{ marginLeft: '8px' }}></i>
                      </a>
                    ) : (
                      <Link to={slide.link} className="btn hero-btn" style={{ padding: '14px 28px', color: '#ffffff', textDecoration: 'none', borderRadius: '6px' }}>
                        {slide.buttonText} <i className="ti-arrow-right" style={{ marginLeft: '8px' }}></i>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* SYSTEM PORTALS SECTION */}
      <section id="portals" className="team-area section-padding30" style={{ padding: '90px 0', background: '#f8fafd' }}>
        <style>{`
          .portal-hover-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease !important;
          }
          .portal-hover-card:hover {
            transform: translateY(-6px) !important;
          }
          /* Dynamic operational hover overrides matching UI themes */
          .portal-mother:hover {
            border-color: rgba(244, 63, 94, 0.45) !important;
            box-shadow: 0 12px 30px rgba(244, 63, 94, 0.12) !important;
          }
          .portal-doctor:hover {
            border-color: rgba(16, 185, 129, 0.45) !important;
            box-shadow: 0 12px 30px rgba(16, 185, 129, 0.12) !important;
          }
          .portal-driver:hover {
            border-color: rgba(245, 158, 11, 0.45) !important;
            box-shadow: 0 12px 30px rgba(245, 158, 11, 0.12) !important;
          }
          .portal-admin:hover {
            border-color: rgba(59, 130, 246, 0.45) !important;
            box-shadow: 0 12px 30px rgba(59, 130, 246, 0.12) !important;
          }
          /* Prevent template hovers from overriding portal text and background colors */
          .portal-hover-card:hover .team-caption {
            background: #ffffff !important;
          }
          .portal-hover-card:hover h3 {
            color: inherit !important;
          }
          .portal-hover-card:hover span {
            color: #4b5563 !important;
          }
          .portal-hover-card:hover a.btn {
            color: #ffffff !important;
            opacity: 0.95 !important;
          }
        `}</style>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="section-tittle text-center mb-90" style={{ textAlign: 'center', marginBottom: '60px' }}>
                <span style={{ color: '#0f61ef', fontWeight: 700 }}>MamaTrack Portals</span>
                <h2>Select Portal to Enter</h2>
                <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '15px' }}>
                  Secure authentication access points for registered expectant mothers, clinical doctors, ambulance teams, and dispatch command administrators.
                </p>
              </div>
            </div>
          </div>

          <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
            
            {/* Expectant Mother */}
            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6" style={{ flex: '1 1 240px', maxWidth: '270px' }}>
              <div className="single-team portal-hover-card portal-mother" style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(244, 63, 94, 0.18)', boxShadow: '0 10px 30px rgba(244, 63, 94, 0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'rgba(244,63,94,0.05)', padding: '30px 0', display: 'flex', justifyContent: 'center', fontSize: '3.5rem' }}>🤰</div>
                <div className="team-caption" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fb7185' }}>Expectant Mother</h3>
                  <span style={{ display: 'block', fontSize: '13px', margin: '6px 0 16px', color: '#64676c', flex: 1 }}>
                    Trigger emergency beacons, check ANC milestones checklists, and chat with specialist doctors.
                  </span>
                  <Link to="/login?role=mother" className="btn" style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', color: '#ffffff', textDecoration: 'none', backgroundImage: 'linear-gradient(to left, #fb7185, #f43f5e, #fb7185)' }}>
                    Enter Portal
                  </Link>
                </div>
              </div>
            </div>

            {/* Clinical Doctor */}
            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6" style={{ flex: '1 1 240px', maxWidth: '270px' }}>
              <div className="single-team portal-hover-card portal-doctor" style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(16, 185, 129, 0.18)', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'rgba(16,185,129,0.05)', padding: '30px 0', display: 'flex', justifyContent: 'center', fontSize: '3.5rem' }}>🩺</div>
                <div className="team-caption" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>Clinical Doctor</h3>
                  <span style={{ display: 'block', fontSize: '13px', margin: '6px 0 16px', color: '#64676c', flex: 1 }}>
                    Receive emergency alerts, view incoming patient logs, record diagnostics, and check bed availability.
                  </span>
                  <Link to="/login?role=doctor" className="btn" style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', color: '#ffffff', textDecoration: 'none', backgroundImage: 'linear-gradient(to left, #10b981, #059669, #10b981)' }}>
                    Enter Portal
                  </Link>
                </div>
              </div>
            </div>

            {/* Ambulance Driver */}
            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6" style={{ flex: '1 1 240px', maxWidth: '270px' }}>
              <div className="single-team portal-hover-card portal-driver" style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(245, 158, 11, 0.18)', boxShadow: '0 10px 30px rgba(245, 158, 11, 0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'rgba(245,158,11,0.05)', padding: '30px 0', display: 'flex', justifyContent: 'center', fontSize: '3.5rem' }}>🚑</div>
                <div className="team-caption" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>Ambulance Driver</h3>
                  <span style={{ display: 'block', fontSize: '13px', margin: '6px 0 16px', color: '#64676c', flex: 1 }}>
                    Receive dispatch route trips, update live trip coordinates, and submit pre-duty safety checklists.
                  </span>
                  <Link to="/login?role=driver" className="btn" style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', color: '#ffffff', textDecoration: 'none', backgroundImage: 'linear-gradient(to left, #f59e0b, #d97706, #f59e0b)' }}>
                    Enter Portal
                  </Link>
                </div>
              </div>
            </div>

            {/* System Admin */}
            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6" style={{ flex: '1 1 240px', maxWidth: '270px' }}>
              <div className="single-team portal-hover-card portal-admin" style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(59, 130, 246, 0.18)', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'rgba(59,130,246,0.05)', padding: '30px 0', display: 'flex', justifyContent: 'center', fontSize: '3.5rem' }}>📡</div>
                <div className="team-caption" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>System Admin</h3>
                  <span style={{ display: 'block', fontSize: '13px', margin: '6px 0 16px', color: '#64676c', flex: 1 }}>
                    Coordinate regional ambulance dispatches, monitor safety checklists, and manage clinic facility status parameters.
                  </span>
                  <Link to="/login?role=admin" className="btn" style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', fontSize: '13px', color: '#ffffff', textDecoration: 'none', backgroundImage: 'linear-gradient(to left, #3b82f6, #1d4ed8, #3b82f6)' }}>
                    Enter Portal
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ABOUT AREA */}
      <section id="about" className="about-area section-padding2" style={{ padding: '90px 0' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-10">
              <div className="about-caption mb-50" style={{ paddingRight: '20px' }}>
                <div className="section-tittle section-tittle2 mb-35">
                  <span style={{ color: '#0f61ef', fontWeight: 700 }}>About Our Platform</span>
                  <h2>Welcome To MamaTrack</h2>
                </div>
                <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#64676c', marginBottom: '20px' }}>
                  MamaTrack GPS integrates ambulance dispatch workflows, VHT village health support pathways, and hospital surgical teams into one digital referral console in Mukono District.
                </p>
                <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#64676c', marginBottom: '35px' }}>
                  Registered expectant mothers gain direct channels for real-time obstetric consultations, checkup schedules logging, and instant rescue beacons coordinate tracking.
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img src="/assets/img/gallery/Homepage_testi.png" alt="DMO" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h5 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#030431' }}>Dr. Francis Muhinda</h5>
                    <span style={{ fontSize: '12px', color: '#64676c' }}>District Health Officer, Mukono</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 col-md-10" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="about-img" style={{ width: '100%' }}>
                <img src="/assets/img/gallery/about1.png" alt="Clinical Center" style={{ width: '100%', maxWidth: '440px', display: 'block', margin: '0 auto', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }} />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* TESTIMONIAL STARUPS START */}
      <section className="all-starups-area testimonial-area fix" style={{ display: 'flex', alignItems: 'center', background: '#0b162b', color: '#ffffff', minHeight: '480px' }}>
        <div className="starups" style={{ width: '50%', padding: '60px 40px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="single-testimonial text-center" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <div className="testimonial-caption">
              <div className="testimonial-top-cap" style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 300, lineHeight: 1.6, color: '#ffffff', fontStyle: 'italic' }}>
                  "The GPS tracking console ensured our ambulance driver Moses located my home in Seeta ward within 15 minutes of my contractions starting. I delivered safely at Mukono Hospital."
                </p>
              </div>
              <div className="testimonial-founder" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
                <div className="founder-text">
                  <span style={{ display: 'block', fontSize: '16px', fontWeight: 700, color: '#0f61ef' }}>Sarah Nabosa</span>
                  <p style={{ margin: 0, fontSize: '12px', color: '#9fabbe' }}>Registered Expectant Mother</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="starups-img" style={{ width: '50%', height: '480px', backgroundImage: 'url(/assets/img/gallery/startup.png)', backgroundSize: 'cover', backgroundPosition: 'center center' }}></div>
      </section>

      {/* NEWS AREA SECTION */}
      <section id="news" style={{ padding: '90px 0' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="section-tittle text-center mb-100" style={{ textAlign: 'center', marginBottom: '60px' }}>
                <span style={{ color: '#0f61ef', fontWeight: 700 }}>News Updates</span>
                <h2>Maternal Health News</h2>
              </div>
            </div>
          </div>
          <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
            
            {/* News 1 */}
            <div className="col-lg-4 col-md-6" style={{ flex: '1 1 300px', maxWidth: '360px' }}>
              <div className="news-thumb" style={{ border: '1px solid #eef2f5', borderRadius: '8px', overflow: 'hidden' }}>
                <img src="/assets/img/gallery/blog1.png" alt="" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                <div className="news-info" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '11px', color: '#a5c422', textTransform: 'uppercase', fontWeight: 600 }}>March 08, 2026</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#030431', margin: '8px 0' }}>
                    GPS Referrals in Rural Mukono District
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#64676c' }}>
                    How mapping coordinate beacons saves critical minutes for mothers experiencing severe delivery labor.
                  </p>
                </div>
              </div>
            </div>

            {/* News 2 */}
            <div className="col-lg-4 col-md-6" style={{ flex: '1 1 300px', maxWidth: '360px' }}>
              <div className="news-thumb" style={{ border: '1px solid #eef2f5', borderRadius: '8px', overflow: 'hidden' }}>
                <img src="/assets/img/gallery/blog2.png" alt="" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                <div className="news-info" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '11px', color: '#a5c422', textTransform: 'uppercase', fontWeight: 600 }}>February 20, 2026</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#030431', margin: '8px 0' }}>
                    Safe Delivery WHO Checklist Launch
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#64676c' }}>
                    Integrating checkup milestones checklist templates mapping weeks 8 to 40 directly into user profiles.
                  </p>
                </div>
              </div>
            </div>

            {/* News 3 */}
            <div className="col-lg-4 col-md-6" style={{ flex: '1 1 300px', maxWidth: '360px' }}>
              <div className="news-thumb" style={{ border: '1px solid #eef2f5', borderRadius: '8px', overflow: 'hidden' }}>
                <img src="/assets/img/gallery/blog3.png" alt="" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                <div className="news-info" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '11px', color: '#a5c422', textTransform: 'uppercase', fontWeight: 600 }}>January 27, 2026</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#030431', margin: '8px 0' }}>
                    Integrating VHT Coordinator Alerts
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#64676c' }}>
                    Training community teams to register pregnancy profiles, coordinate ambulances, and communicate symptoms.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* GOOGLE MAP */}
      <section id="google-map" style={{ lineHeight: 0, margin: 0, padding: 0 }}>
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127670.3664797034!2d32.69747515159784!3d0.354029272365225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177db59841f3ecfd%3A0xe210214a1cd34df8!2sMukono!5e0!3m2!1sen!2sug!4v1700000000000" 
          width="100%" 
          height="380" 
          frameBorder="0" 
          style={{ border: 0 }} 
          allowFullScreen
          title="Mukono District Map Location"
        />
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '60px 0 20px', background: '#0b162b', color: '#909090' }}>
        <div className="container">
          <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
            
            <div className="col-md-4 col-sm-4" style={{ flex: '1 1 250px' }}>
              <div className="footer-thumb">
                <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Contact Info</h4>
                <p style={{ color: '#909090', fontSize: '13px', lineHeight: 1.6, marginBottom: '15px' }}>
                  Mukono District Health Department, Uganda. Coordinating maternal safety and emergency referral transports.
                </p>
                <div className="contact-info">
                  <p style={{ color: '#909090', fontSize: '13px', margin: '4px 0' }}><i className="fa fa-phone" style={{ marginRight: '5px' }}></i> 0800-MAMATRACK</p>
                  <p style={{ color: '#909090', fontSize: '13px', margin: '4px 0' }}><i className="fa fa-envelope-o" style={{ marginRight: '5px' }}></i> support@mamatrack.go.ug</p>
                </div>
              </div>
            </div>

            <div className="col-md-4 col-sm-4" style={{ flex: '1 1 250px' }}>
              <div className="footer-thumb">
                <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Quick Portals</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link to="/login?role=mother" style={{ color: '#909090', textDecoration: 'none', fontSize: '13px' }}><i className="fa fa-angle-right" style={{ marginRight: '8px' }}></i> Expectant Mother Portal</Link>
                  <Link to="/login?role=doctor" style={{ color: '#909090', textDecoration: 'none', fontSize: '13px' }}><i className="fa fa-angle-right" style={{ marginRight: '8px' }}></i> Clinical Doctor Portal</Link>
                  <Link to="/login?role=driver" style={{ color: '#909090', textDecoration: 'none', fontSize: '13px' }}><i className="fa fa-angle-right" style={{ marginRight: '8px' }}></i> Ambulance Driver Portal</Link>
                  <Link to="/login?role=admin" style={{ color: '#909090', textDecoration: 'none', fontSize: '13px' }}><i className="fa fa-angle-right" style={{ marginRight: '8px' }}></i> System Admin Portal</Link>
                </div>
              </div>
            </div>

            <div className="col-md-4 col-sm-4" style={{ flex: '1 1 250px' }}>
              <div className="footer-thumb">
                <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>System Status</h4>
                <p style={{ color: '#909090', fontSize: '13px', lineHeight: 1.6 }}>
                  MamaTrack GPS Dispatch operates 24/7 across Mukono sub-counties. Encrypted database servers are active.
                </p>
                <div style={{ marginTop: '15px', color: '#0f61ef', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#0f61ef', borderRadius: '50%', animation: 'active-emergency-pulse 1.5s infinite alternate' }} /> Secure System Online
                </div>
              </div>
            </div>

          </div>

          <div className="row border-top" style={{ borderTop: '1px solid #16243d', marginTop: '40px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div className="col-md-6 col-sm-6">
              <p style={{ margin: 0, fontSize: '12px', color: '#909090' }}>
                Copyright &copy; 2026 MamaTrack GPS. All rights reserved.
              </p>
            </div>
            <div className="col-md-6 col-sm-6 text-right text-align-right">
              <p style={{ margin: 0, fontSize: '12px', color: '#909090' }}>
                Design integrated with Medical Center template styles.
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
