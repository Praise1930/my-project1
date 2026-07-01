// MamaTrack GPS — Custom Landing Page adapted from Health Center template

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Import template stylesheets
import '../styles/health-center/bootstrap.min.css';
import '../styles/health-center/font-awesome.min.css';
import '../styles/health-center/animate.css';
import '../styles/health-center/tooplate-style.css';

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
      buttonText: "Access Portal",
      link: "#portals",
      bgClass: "item-first",
    },
    {
      subtitle: "Professional Medical Guidance Anywhere, Anytime",
      title: "24/7 On-Duty Clinical Doctor Consultations",
      desc: "Expectant mothers are matched directly with local medical practitioners for symptom chats.",
      buttonText: "Clinical Portal",
      link: "/login?role=doctor",
      bgClass: "item-second",
    },
    {
      subtitle: "Transmitting Live Coordinates to Responder Networks",
      title: "GPS-Powered Ambulance Navigation Logs",
      desc: "Drivers receive alerts and routing paths dynamically to reduce transport delays.",
      buttonText: "Driver Portal",
      link: "/login?role=driver",
      bgClass: "item-third",
    }
  ];

  return (
    <div id="top" className="health-landing-root" style={{ background: '#ffffff', color: '#757575', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* HEADER BAR */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #f2f2f2', height: 'auto', padding: '10px 0' }}>
        <div className="container">
          <div className="row">
            <div className="col-md-5 col-sm-6">
              <p style={{ margin: 0, fontSize: '12px', color: '#747474' }}>
                MamaTrack GPS — Mukono District Maternal Support System
              </p>
            </div>
            <div className="col-md-7 col-sm-6 text-right text-align-right">
              <span style={{ fontSize: '12px', color: '#747474', fontWeight: 500, display: 'inline-block', padding: '0 15px' }}>
                <i className="fa fa-phone" style={{ color: '#a5c422', marginRight: '5px' }}></i> 0800-MAMATRACK
              </span>
              <span style={{ fontSize: '12px', color: '#747474', fontWeight: 500, display: 'inline-block', padding: '0 15px', borderLeft: '1px solid #f2f2f2' }}>
                <i className="fa fa-envelope-o" style={{ color: '#a5c422', marginRight: '5px' }}></i> support@mamatrack.go.ug
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* NAVBAR MENU */}
      <nav className="navbar navbar-default navbar-static-top" role="navigation" style={{ marginBottom: 0, padding: '10px 0' }}>
        <div className="container">
          <div className="navbar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Link to="/" className="navbar-brand" style={{ fontSize: '1.8rem', fontWeight: 600, color: '#393939' }}>
              <i className="fa fa-h-square" style={{ color: '#a5c422', marginRight: '8px' }}></i>ealth Center MamaTrack
            </Link>
            
            {/* Nav Menu Links */}
            <div className="collapse navbar-collapse in" style={{ display: 'block', border: 'none', boxShadow: 'none' }}>
              <ul className="nav navbar-nav navbar-right" style={{ display: 'flex', alignItems: 'center', margin: 0, listStyle: 'none', flexDirection: 'row' }}>
                <li><a href="#top" className="smoothScroll">Home</a></li>
                <li><a href="#portals" className="smoothScroll">System Portals</a></li>
                <li><a href="#about" className="smoothScroll">About Us</a></li>
                <li><a href="#team" className="smoothScroll">Doctors</a></li>
                <li><a href="#news" className="smoothScroll">News</a></li>
                <li className="appointment-btn" style={{ marginLeft: '15px' }}>
                  <Link to="/register" style={{ background: '#a5c422', borderRadius: '3px', color: '#ffffff', fontWeight: 600, padding: '10px 18px', textDecoration: 'none' }}>
                    Register Profile
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SLIDER SECTION */}
      <section id="home" className="slider" style={{ position: 'relative', height: '650px', background: '#252525', overflow: 'hidden' }}>
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`item ${slide.bgClass}`}
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
            <div className="caption" style={{ width: '100%' }}>
              <div className="container">
                <div className="row">
                  <div className="col-md-offset-1 col-md-10" style={{ color: '#ffffff' }}>
                    <h3 style={{ color: '#ffffff', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.02em', marginBottom: '16px', background: 'rgba(0,0,0,0.4)', display: 'inline-block', padding: '6px 16px', borderRadius: '4px' }}>
                      {slide.subtitle}
                    </h3>
                    <h1 style={{ color: '#ffffff', fontSize: '3.8rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.5)', marginTop: '8px', marginBottom: '24px' }}>
                      {slide.title}
                    </h1>
                    <p style={{ color: '#ffffff', fontSize: '1.15rem', textShadow: '0 1px 5px rgba(0,0,0,0.5)', marginBottom: '32px', maxWidth: '650px' }}>
                      {slide.desc}
                    </p>
                    {slide.link.startsWith('#') ? (
                      <a href={slide.link} className="section-btn btn btn-default smoothScroll" style={{ background: '#a5c422', border: 0, color: '#ffffff', padding: '14px 28px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}>
                        {slide.buttonText}
                      </a>
                    ) : (
                      <Link to={slide.link} className="section-btn btn btn-default" style={{ background: '#a5c422', border: 0, color: '#ffffff', padding: '14px 28px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}>
                        {slide.buttonText}
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
      <section id="portals" style={{ padding: '80px 0', background: '#f9f9f9', textAlign: 'center' }}>
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="section-title">
                <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#272727', marginBottom: '10px' }}>
                  MamaTrack GPS Portals
                </h2>
                <p style={{ maxWidth: '600px', margin: '0 auto 40px', fontSize: '15px' }}>
                  Select your portal configuration to proceed to the secure authenticated dashboards
                </p>
              </div>
            </div>
          </div>

          <div className="row" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
            
            {/* Expectant Mother */}
            <div className="col-md-3 col-sm-6" style={{ flex: '1 1 240px', maxWidth: '270px' }}>
              <div className="portal-card" style={{ background: '#ffffff', border: '1px solid #eef2f5', borderRadius: '8px', padding: '30px 20px', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '3rem', color: '#a5c422', marginBottom: '20px' }}>
                  <i className="fa fa-heartbeat"></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#393939', marginBottom: '12px' }}>Expectant Mother</h3>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#757575', flex: 1, marginBottom: '24px' }}>
                  Trigger real-time rescue beacons, check antenatal milestones, and chat with matching specialist doctors.
                </p>
                <Link to="/login?role=mother" style={{ background: '#a5c422', color: '#ffffff', textDecoration: 'none', padding: '10px 20px', borderRadius: '4px', display: 'inline-block', fontSize: '13px', fontWeight: 600 }}>
                  Enter Mother Portal
                </Link>
              </div>
            </div>

            {/* Clinical Doctor */}
            <div className="col-md-3 col-sm-6" style={{ flex: '1 1 240px', maxWidth: '270px' }}>
              <div className="portal-card" style={{ background: '#ffffff', border: '1px solid #eef2f5', borderRadius: '8px', padding: '30px 20px', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '3rem', color: '#4267b2', marginBottom: '20px' }}>
                  <i className="fa fa-user-md"></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#393939', marginBottom: '12px' }}>Clinical Doctor</h3>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#757575', flex: 1, marginBottom: '24px' }}>
                  Access emergency patient triage cards, track incoming ambulance status, and manage clinic resources.
                </p>
                <Link to="/login?role=doctor" style={{ background: '#4267b2', color: '#ffffff', textDecoration: 'none', padding: '10px 20px', borderRadius: '4px', display: 'inline-block', fontSize: '13px', fontWeight: 600 }}>
                  Enter Clinical Portal
                </Link>
              </div>
            </div>

            {/* Ambulance Driver */}
            <div className="col-md-3 col-sm-6" style={{ flex: '1 1 240px', maxWidth: '270px' }}>
              <div className="portal-card" style={{ background: '#ffffff', border: '1px solid #eef2f5', borderRadius: '8px', padding: '30px 20px', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '3rem', color: '#f59e0b', marginBottom: '20px' }}>
                  <i className="fa fa-ambulance"></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#393939', marginBottom: '12px' }}>Ambulance Driver</h3>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#757575', flex: 1, marginBottom: '24px' }}>
                  Receive dispatcher rescue trips, stream live GPS routing coordinates, and submit vehicle safety logs.
                </p>
                <Link to="/login?role=driver" style={{ background: '#f59e0b', color: '#ffffff', textDecoration: 'none', padding: '10px 20px', borderRadius: '4px', display: 'inline-block', fontSize: '13px', fontWeight: 600 }}>
                  Enter Driver Portal
                </Link>
              </div>
            </div>

            {/* System Administrator */}
            <div className="col-md-3 col-sm-6" style={{ flex: '1 1 240px', maxWidth: '270px' }}>
              <div className="portal-card" style={{ background: '#ffffff', border: '1px solid #eef2f5', borderRadius: '8px', padding: '30px 20px', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '3rem', color: '#393939', marginBottom: '20px' }}>
                  <i className="fa fa-cogs"></i>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#393939', marginBottom: '12px' }}>System Admin</h3>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#757575', flex: 1, marginBottom: '24px' }}>
                  Coordinate regional clinic bed allocations, monitor dispatch queues, and manage system accounts.
                </p>
                <Link to="/login?role=admin" style={{ background: '#393939', color: '#ffffff', textDecoration: 'none', padding: '10px 20px', borderRadius: '4px', display: 'inline-block', fontSize: '13px', fontWeight: 600 }}>
                  Enter Command Portal
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="row">
            <div className="col-md-6 col-sm-6">
              <div className="about-info">
                <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#272727', marginBottom: '20px' }}>
                  Welcome to Your <i className="fa fa-h-square" style={{ color: '#a5c422' }}></i>ealth Center MamaTrack
                </h2>
                <div>
                  <p style={{ fontSize: '14px', lineHeight: '24px', marginBottom: '15px' }}>
                    MamaTrack is an integrated maternal emergency response system deployed in Mukono District to eliminate delays in obstetric referrals. By linking VHT village coordinators, ambulance teams, and hospital surgeries, we protect maternal wellness throughout delivery.
                  </p>
                  <p style={{ fontSize: '14px', lineHeight: '24px', marginBottom: '30px' }}>
                    Expectant mothers registered on our platform gain direct access to active safety guidelines, antenatal visits tracking, specialist doctor consultations, and instant GPS locator dispatch.
                  </p>
                </div>
                <figure className="profile" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '30px' }}>
                  <img src="/images/author-image.jpg" className="img-responsive" alt="Director DMO" style={{ borderRadius: '50%', width: '60px', height: '60px', objectFit: 'cover' }} />
                  <figcaption>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#393939' }}>Dr. Francis Muhinda</h3>
                    <p style={{ margin: 0, fontSize: '12px' }}>District Health Officer, Mukono</p>
                  </figcaption>
                </figure>
              </div>
            </div>
            
            <div className="col-md-6 col-sm-6">
              <img src="/images/about-bg.jpg" className="img-responsive" alt="Clinical Center" style={{ borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* DOCTORS SECTION */}
      <section id="team" style={{ padding: '80px 0', background: '#f9f9f9' }}>
        <div className="container">
          <div className="row">
            <div className="col-md-6 col-sm-6">
              <div className="about-info">
                <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#272727', marginBottom: '40px' }}>
                  On-Duty Emergency Obstetricians
                </h2>
              </div>
            </div>
            <div className="clearfix"></div>

            {/* Doctor 1 */}
            <div className="col-md-4 col-sm-6" style={{ marginBottom: '30px' }}>
              <div className="team-thumb" style={{ background: '#ffffff', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <img src="/images/team-image1.jpg" className="img-responsive" alt="" style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                <div className="team-info" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#393939' }}>Dr. Nate Baston</h3>
                  <p style={{ color: '#a5c422', fontSize: '13px', fontWeight: 500, margin: '4px 0 12px' }}>General Principal & Obstetrician</p>
                  <div className="team-contact-info" style={{ borderTop: '1px solid #f2f2f2', paddingTop: '12px', marginTop: '12px' }}>
                    <p style={{ fontSize: '13px', margin: '4px 0' }}><i className="fa fa-phone" style={{ color: '#a5c422', marginRight: '5px' }}></i> 0800-MAMATRACK</p>
                    <p style={{ fontSize: '13px', margin: '4px 0' }}><i className="fa fa-envelope-o" style={{ color: '#a5c422', marginRight: '5px' }}></i> general@mamatrack.go.ug</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor 2 */}
            <div className="col-md-4 col-sm-6" style={{ marginBottom: '30px' }}>
              <div className="team-thumb" style={{ background: '#ffffff', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <img src="/images/team-image2.jpg" className="img-responsive" alt="" style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                <div className="team-info" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#393939' }}>Dr. Jason Stewart</h3>
                  <p style={{ color: '#a5c422', fontSize: '13px', fontWeight: 500, margin: '4px 0 12px' }}>Specialist in Maternal Health</p>
                  <div className="team-contact-info" style={{ borderTop: '1px solid #f2f2f2', paddingTop: '12px', marginTop: '12px' }}>
                    <p style={{ fontSize: '13px', margin: '4px 0' }}><i className="fa fa-phone" style={{ color: '#a5c422', marginRight: '5px' }}></i> 0800-MAMATRACK</p>
                    <p style={{ fontSize: '13px', margin: '4px 0' }}><i className="fa fa-envelope-o" style={{ color: '#a5c422', marginRight: '5px' }}></i> pregnancy@mamatrack.go.ug</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Doctor 3 */}
            <div className="col-md-4 col-sm-6" style={{ marginBottom: '30px' }}>
              <div className="team-thumb" style={{ background: '#ffffff', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <img src="/images/team-image3.jpg" className="img-responsive" alt="" style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                <div className="team-info" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#393939' }}>Dr. Miasha Nakahara</h3>
                  <p style={{ color: '#a5c422', fontSize: '13px', fontWeight: 500, margin: '4px 0 12px' }}>CEmONC Surgeon Specialist</p>
                  <div className="team-contact-info" style={{ borderTop: '1px solid #f2f2f2', paddingTop: '12px', marginTop: '12px' }}>
                    <p style={{ fontSize: '13px', margin: '4px 0' }}><i className="fa fa-phone" style={{ color: '#a5c422', marginRight: '5px' }}></i> 0800-MAMATRACK</p>
                    <p style={{ fontSize: '13px', margin: '4px 0' }}><i className="fa fa-envelope-o" style={{ color: '#a5c422', marginRight: '5px' }}></i> surgeon@mamatrack.go.ug</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* LATEST NEWS SECTION */}
      <section id="news" style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="section-title" style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#272727' }}>Maternal Health & Safety News</h2>
              </div>
            </div>

            {/* News Item 1 */}
            <div className="col-md-4 col-sm-6" style={{ marginBottom: '30px' }}>
              <div className="news-thumb" style={{ background: '#ffffff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eef2f5' }}>
                <img src="/images/news-image1.jpg" className="img-responsive" alt="" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <div className="news-info" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>March 08, 2026</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#393939', margin: '10px 0' }}>
                    Using GPS Technology in Obstetric Referrals
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#757575' }}>
                    Deploying automatic GPS coordinate mapping reduces ambulance transit times by over 45% in Mukono sub-counties.
                  </p>
                </div>
              </div>
            </div>

            {/* News Item 2 */}
            <div className="col-md-4 col-sm-6" style={{ marginBottom: '30px' }}>
              <div className="news-thumb" style={{ background: '#ffffff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eef2f5' }}>
                <img src="/images/news-image2.jpg" className="img-responsive" alt="" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <div className="news-info" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>February 20, 2026</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#393939', margin: '10px 0' }}>
                    WHO Safe Childbirth Checklist Integration
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#757575' }}>
                    Our team launches checkup tracking benchmarks matching WHO guidelines for expectant mothers from week 8 to 40.
                  </p>
                </div>
              </div>
            </div>

            {/* News Item 3 */}
            <div className="col-md-4 col-sm-6" style={{ marginBottom: '30px' }}>
              <div className="news-thumb" style={{ background: '#ffffff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eef2f5' }}>
                <img src="/images/news-image3.jpg" className="img-responsive" alt="" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <div className="news-info" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>January 27, 2026</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#393939', margin: '10px 0' }}>
                    Reducing Maternal Mortality Outcomes
                  </h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#757575' }}>
                    Highlighting the role of VHT village coordinators in managing pre-referral diagnostics and ambulance notification flags.
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
      <footer style={{ padding: '60px 0 20px', background: '#393939', color: '#909090' }}>
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
                <div style={{ marginTop: '15px', color: '#a5c422', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#a5c422', borderRadius: '50%', animation: 'active-emergency-pulse 1.5s infinite alternate' }} /> Secure System Online
                </div>
              </div>
            </div>

          </div>

          <div className="row border-top" style={{ borderTop: '1px solid #454545', marginTop: '40px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div className="col-md-6 col-sm-6">
              <p style={{ margin: 0, fontSize: '12px', color: '#909090' }}>
                Copyright &copy; 2026 MamaTrack GPS. All rights reserved.
              </p>
            </div>
            <div className="col-md-6 col-sm-6 text-right text-align-right">
              <p style={{ margin: 0, fontSize: '12px', color: '#909090' }}>
                Design integrated with Tooplate Health Center template.
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
