// Narrative content for the MamaTrack GPS research report.
// Kept apart from build.js so the prose can be edited without touching layout code.
//
// Node types:
//   p     paragraph                     b     bulleted item
//   n     numbered item                 h2/h3 sub-headings (x.y / x.y.z)
//   fig   figure + caption below it     tbl   caption above + table rows
//   note  small-type explanatory note   shot  placeholder plate for a screenshot

const ACRONYMS = [
  ['ANC', 'Antenatal Care'],
  ['API', 'Application Programming Interface'],
  ['CEmONC', 'Comprehensive Emergency Obstetric and Newborn Care'],
  ['CSS', 'Cascading Style Sheets'],
  ['DFD', 'Data Flow Diagram'],
  ['ERD', 'Entity-Relationship Diagram'],
  ['GIS', 'Geographic Information System'],
  ['GPS', 'Global Positioning System'],
  ['GSM', 'Global System for Mobile Communications'],
  ['HIS', 'Health Information Systems'],
  ['HMIS', 'Health Management Information System'],
  ['HTTP', 'Hypertext Transfer Protocol'],
  ['IoT', 'Internet of Things'],
  ['JSON', 'JavaScript Object Notation'],
  ['mHealth', 'Mobile Health'],
  ['NDP III', 'Third National Development Plan'],
  ['PPH', 'Postpartum Haemorrhage'],
  ['PWA', 'Progressive Web Application'],
  ['RLS', 'Row Level Security'],
  ['SDG', 'Sustainable Development Goals'],
  ['SDLC', 'Systems Development Life Cycle'],
  ['SMS', 'Short Message Service'],
  ['SQL', 'Structured Query Language'],
  ['SWOT', 'Strengths, Weaknesses, Opportunities and Threats'],
  ['UBOS', 'Uganda Bureau of Statistics'],
  ['UI', 'User Interface'],
  ['UML', 'Unified Modeling Language'],
  ['USSD', 'Unstructured Supplementary Service Data'],
  ['VHT', 'Village Health Team'],
  ['WHO', 'World Health Organization'],
];

const TERMS = [
  ['GPS (Global Positioning System)', 'A satellite-based navigation system used to provide precise, real-time geographic coordinates (latitude and longitude) that identify a mother’s exact physical location during an emergency.'],
  ['Maternal Health', 'The health of women during pregnancy, childbirth and the postpartum period. In this study it refers specifically to reducing mortality arising from life-threatening complications such as Postpartum Haemorrhage.'],
  ['Emergency Response', 'The coordinated process of dispatching medical assistance, such as ambulances and Village Health Teams, to a patient in immediate need of life-saving care.'],
  ['Monitoring System', 'A digital infrastructure consisting of a mobile interface and a centralised hospital dashboard used to track, observe and manage the status and location of expectant mothers in real time.'],
  ['Spatial Invisibility', 'A technical gap in which healthcare providers lack digital visibility of a patient’s location, arising from poorly mapped areas and reliance on vague verbal directions.'],
  ['Second Delay', 'The critical time lost between the decision to seek care and the actual arrival of the mother at a health facility.'],
  ['Maternal Health Informatics', 'The interdisciplinary study of the design, development, adoption and application of IT-based innovations in healthcare services for expectant mothers.'],
  ['Real-time Analytics', 'The use of data as soon as it enters a system, allowing immediate feedback and decision-making during an obstetric crisis.'],
  ['Geospatial Integration', 'The process of combining GPS coordinates with existing health databases in order to visualise patient locations on a digital map.'],
  ['Referral Loop', 'A systemic failure in which a patient is sent between multiple health facilities that all lack the resources to treat her, caused by the absence of real-time resource visibility.'],
  ['Offline-first', 'A design approach in which the application writes to a local store first and replicates to the server when connectivity allows, so that the system remains usable where the network does not reach.'],
  ['Dispatch State Machine', 'The defined set of states an emergency case may occupy — pending, dispatched, en-route, arrived, delivered, completed or cancelled — together with the permitted transitions between them.'],
];

// ---------------------------------------------------------------- abstract

const ABSTRACT = [
  { t: 'p', x: 'This research investigated the problem of spatial invisibility in maternal emergency response in Mukono District, Uganda, where a mother in obstetric distress cannot reliably be located by the responders sent to reach her. Uganda’s maternal mortality ratio stands at 284 deaths per 100,000 live births (Uganda Bureau of Statistics, 2022), and a substantial share of these deaths is attributable to the second of the three delays — the time lost reaching a health facility. Current referral workflows in the district are location-blind, depending on telephone calls, paper antenatal cards and verbal directions to poorly mapped settlements in sub-counties such as Nama and to island communities in Koome. The main purpose of the study was to design, develop and validate a GPS-enabled maternal health information system that makes a mother’s precise location visible to responders before she arrives at a facility.' },
  { t: 'p', x: 'A systems engineering methodology following the Systems Development Life Cycle was used to analyse, design, implement and test the system. Requirements were elicited through interviews with clinical and dispatch staff, questionnaires administered to expectant mothers and Village Health Team members, observation of the existing referral workflow, and review of facility records. The current system was analysed using SWOT analysis. The new system was modelled using Data Flow Diagrams, an Entity-Relationship Diagram and Unified Modeling Language use case, state machine and sequence diagrams, and was implemented as a Progressive Web Application built with React, TypeScript and Leaflet over a Supabase PostgreSQL database with realtime replication.' },
  { t: 'p', x: 'The study produced a working system comprising five role-specific portals — for expectant mothers, doctors, ambulance drivers, Village Health Team members and district administrators — operating over one shared, offline-capable data layer. Validation through simulated emergency scenarios confirmed that an SOS raised on a mother’s device propagates to the district command console on a separate device without any shared local state, and that the system automatically resolves the nearest capable facility, assigns an available ambulance and driver, notifies the receiving clinician, and advances the case through its dispatch lifecycle. Static verification of the delivered code returned no compiler errors and no lint warnings, and the production build completed successfully. Five defects were identified during validation and corrected, the most serious being a realtime subscription fault capable of terminating the entire interface during startup.' },
  { t: 'p', x: 'This study recommends that the district adopt the system in a supervised pilot covering Mukono General Hospital and its surrounding health centres before wider rollout, and that the permissive database access policy used for demonstration be replaced with role-scoped policies bound to authenticated identity before any real patient record is entered. It further recommends that Village Health Teams be equipped and trained as the field entry point for registration and vitals capture, since their coverage determines how much of the district the system can actually see.' },
];

// ---------------------------------------------------------------- chapter one

const CH1 = [
  { t: 'h2', n: '1.0', x: 'Introduction' },
  { t: 'p', x: 'This chapter establishes the foundation of the research. It opens with the background to the study, which situates the maternal health crisis within the wider transition of health informatics toward location-aware systems. It then presents the problem statement, which analyses the causes and consequences of spatial invisibility within current emergency maternal care workflows. The general and specific objectives are defined to outline the technical milestones of the work, the research questions are stated, and the subject, geographical and time boundaries of the study are established. The chapter closes with the justification and significance of the research and a summary.' },
  { t: 'p', x: 'The sector under study is public maternal healthcare service delivery in Uganda, and specifically the emergency obstetric referral pathway that connects a mother in her home to a facility capable of treating her. This sector is characterised by adequate clinical protocol and inadequate logistical coordination: the knowledge of how to treat postpartum haemorrhage exists in the district, but the means of reaching the woman experiencing it in time does not. It is a sector in which an information failure produces a medical outcome.' },

  { t: 'h2', n: '1.1', x: 'Background of the Study' },
  { t: 'p', x: 'The field of maternal health informatics has moved from static record-keeping toward the dynamic integration of the Internet of Things, Global Positioning Systems and real-time analytics. Globally, the World Health Organization reports approximately 800 daily maternal deaths from preventable causes, with 95% occurring in low-resource settings (World Health Organization, 2023). In emerging economies such as India, the deployment of GPS-tracked ambulances and IoT-enabled wearable sensors has proved effective in reducing the second delay, the critical interval required to reach a health facility (Thaddeus & Maine, 1994).' },
  { t: 'p', x: 'In Africa, digital health initiatives have centred primarily on mHealth. While programmes such as Kenya’s Linda Mama have increased service uptake, they remain fundamentally location-blind. In Uganda, where the maternal mortality ratio stands at 284 deaths per 100,000 live births (Uganda Bureau of Statistics, 2022), existing interventions such as UNICEF’s SMS-based reminders and Kampala’s eHealth referral pilots lack real-time geospatial integration. This technical deficit prevents responders from acting on a mother’s position at the moment it matters most.' },
  { t: 'p', x: 'The current influence of GPS and IoT on Ugandan maternal health is restricted to high-level urban pilots, leaving a significant technological gap in peri-urban and rural districts. Existing systems function as static databases rather than active emergency dispatch tools, resulting in navigation errors during complications such as postpartum haemorrhage.' },
  { t: 'p', x: 'Mukono District, the case study for this research, epitomises these challenges. As a region characterised by poorly mapped rural villages in Nama and isolated island communities in Koome, verbal directions are frequently unreliable. Consequently, maternal referrals to Mukono General Hospital suffer from spatial invisibility. This study developed a GPS-enabled solution within Mukono to provide a scalable, data-driven model for reducing maternal mortality through precise, real-time location tracking.' },

  { t: 'h2', n: '1.2', x: 'Problem Statement' },
  { t: 'p', x: 'Despite national interventions, Uganda’s maternal mortality ratio remains critically high at 284 deaths per 100,000 live births (Uganda Bureau of Statistics, 2022). In Mukono District, a primary driver of these fatalities is the second delay, the time lost in locating and transporting a mother during an obstetric emergency. Current response workflows are location-blind, relying on manual records and vague verbal directions, which prevents the timely dispatch of ambulances and Village Health Teams. This lack of spatial visibility frequently turns manageable complications, such as postpartum haemorrhage, into avoidable tragedies.' },
  { t: 'p', x: 'The root cause of this crisis is spatial information invisibility. The absence of a digital infrastructure to transmit precise GPS coordinates leads to navigation errors in poorly mapped areas such as Nama and isolated island communities such as Koome. This is compounded by fragmented communication and reliance on physical paper cards, which restricts access to vital clinical history during transit. Consequently, mothers lose the critical therapeutic window for intervention, often falling into inefficient referral loops between facilities that lack the necessary resources.' },
  { t: 'p', x: 'To address these challenges, this research developed a GPS-enabled maternal health information system for Mukono District. By integrating a mobile interface for mothers with a web-based hospital dashboard, the system uses geospatial technology to provide real-time tracking and automated resource identification, ensuring that a mother’s precise location is visible to medical responders before she arrives at the facility.' },

  { t: 'h2', n: '1.3', x: 'Objectives' },
  { t: 'h3', n: '1.3.1', x: 'General Objective' },
  { t: 'p', x: 'The main objective of this research was to design and develop a GPS-enabled maternal health information system for Mukono District in order to eliminate spatial invisibility and reduce the second delay during obstetric emergencies.' },
  { t: 'h3', n: '1.3.2', x: 'Specific Objectives' },
  { t: 'n', x: 'To study and analyse the strengths and weaknesses of the current maternal emergency response and referral workflows within Mukono General Hospital and its surrounding health centres.' },
  { t: 'n', x: 'To determine and specify the functional and technical requirements for a real-time geospatial tracking and alert system tailored to the terrain of Mukono District.' },
  { t: 'n', x: 'To design a GPS-integrated maternal health system consisting of a mobile emergency interface for mothers and a centralised navigation dashboard for hospital administrators.' },
  { t: 'n', x: 'To implement, test and validate the new system through simulated emergency scenarios in order to measure its effectiveness in improving response times and coordination.' },

  { t: 'h2', n: '1.4', x: 'Research Questions' },
  { t: 'p', x: 'To achieve the objectives of this research, the following questions were addressed:' },
  { t: 'n', x: 'What are the strengths and weaknesses of the existing maternal emergency response and referral workflows in Mukono General Hospital and its surrounding health centres?' },
  { t: 'n', x: 'What functional and technical requirements are necessary to develop a real-time geospatial tracking and alert system that accounts for the terrain of Mukono District?' },
  { t: 'n', x: 'How can a GPS-integrated system be designed to provide an intuitive mobile interface for expectant mothers and a comprehensive navigation dashboard for hospital administrators?' },
  { t: 'n', x: 'How effective is the implemented system in reducing emergency response times and improving coordination when tested through simulated maternal emergency scenarios?' },

  { t: 'h2', n: '1.5', x: 'Scope of the Study' },
  { t: 'h3', n: '1.5.1', x: 'Subject Scope' },
  { t: 'p', x: 'The subject scope of this research covered the design and development of a GPS-enabled maternal health information system addressing the spatial invisibility of expectant mothers during obstetric emergencies, specifically targeting the reduction of the second delay. The primary stakeholders of the system are:' },
  { t: 'b', x: 'Expectant mothers — the end users who require emergency tracking and rapid response.' },
  { t: 'b', x: 'Healthcare providers — midwives, obstetricians and administrators at Mukono General Hospital who monitor the real-time navigation dashboard.' },
  { t: 'b', x: 'Emergency responders — ambulance drivers and Village Health Teams who use the GPS data for precise navigation.' },
  { t: 'b', x: 'District health officers — who use the generated geospatial data for resource allocation and health planning.' },
  { t: 'p', x: 'The study did not extend to the clinical treatment of obstetric complications, to the procurement or maintenance of ambulances, or to the integration of wearable physiological sensors, all of which lie outside the information-systems boundary of the work.' },
  { t: 'h3', n: '1.5.2', x: 'Geographical Scope' },
  { t: 'p', x: 'The research was conducted within Mukono District, Central Uganda. This case study was chosen for its geographical diversity, featuring rapidly urbanising centres alongside poorly mapped rural sub-counties such as Nama and isolated island communities in Koome on Lake Victoria. Mukono exemplifies the referral gap in which high maternal populations face significant transit hurdles in reaching Mukono General Hospital, and its varied terrain provides a rigorous environment in which to test the accuracy and reliability of GPS and GIS technologies in low-resource, high-stakes settings.' },
  { t: 'h3', n: '1.5.3', x: 'Time Scope' },
  { t: 'p', x: 'The research was conducted over a period of ten weeks, structured into three technical phases. Weeks one to three covered research and requirements, comprising the literature review, the gathering of functional requirements from stakeholders in Mukono, and the finalisation of the system architecture. Weeks four to seven covered system development, focusing on geospatial database design, interface implementation and the integration of the GPS and mapping modules. Weeks eight to ten covered validation and documentation, dedicated to system testing, user validation within Mukono District and the completion of the final project submission.' },

  { t: 'h2', n: '1.6', x: 'Significance of the Study' },
  { t: 'p', x: 'The urgency of this study rests on the observation that maternal mortality in Uganda is not merely a medical failure but a logistical and informational one. While medical protocols for treating complications exist, the inability to locate and reach a mother in distress remains a critical bottleneck. This research moves maternal health from a reactive, paper-based model toward a proactive, spatially aware one.' },
  { t: 'p', x: 'Current maternal health interventions in Uganda rely largely on mHealth platforms built around one-way communication such as SMS reminders for antenatal visits. A significant technical gap remains: these systems are blind to a mother’s physical location during a crisis. Most existing studies address the clinical causes of death while overlooking the geospatial informatics required to solve the second delay (Faujdar & Kumar, 2020). No integrated platform in Uganda’s public hospitals currently links a mother’s real-time GPS coordinates to a centralised hospital dashboard for immediate dispatch.' },
  { t: 'p', x: 'The implementation of this system offers direct improvements to the maternal healthcare process. Precision emergency response replaces vague verbal directions with exact coordinates, minimising the time ambulances and Village Health Teams spend searching for a patient’s home. Intelligent referral mapping identifies the nearest facility with available beds and the correct capability, preventing the referral loop in which mothers are moved between full hospitals. Aggregated location data allows the district and the Ministry of Health to identify mortality hotspots and to place new clinics and ambulances where they are most needed.' },
  { t: 'p', x: 'Academically, the study contributes a framework for applying Geographic Information Systems to maternal health in resource-constrained environments; it explores the synchronisation of spatial data over intermittent and low-bandwidth networks, providing a model for transmitting complex location data where connectivity is poor; and it advances the study of Health Information Systems by shifting the focus from static data storage toward real-time, event-driven architecture.' },
  { t: 'p', x: 'The work serves as a pioneer for spatial health informatics in East Africa. By integrating GPS tracking into public hospital workflows, it provides a scalable template adaptable to other emergencies such as accident response or epidemic tracking, and directly supports the Uganda National Development Plan (National Planning Authority, 2020) and Sustainable Development Goal 3.' },

  { t: 'h2', n: '1.7', x: 'Chapter Summary' },
  { t: 'p', x: 'This chapter established the foundational framework for the research by identifying the need for a spatial intervention in Uganda’s maternal healthcare. The problem statement set out the consequences of delayed emergency response and the inefficiency of current paper-based and non-localised systems. The objectives were defined around the design, development and testing of a GPS tracking capability and a centralised maternal database, and the scope and significance established the technical feasibility and the socio-economic impact of the system in alignment with the National Development Plan and Sustainable Development Goal 3. The chapter sets the stage for the review of existing literature that follows.' },
];

// ---------------------------------------------------------------- chapter two

const CH2 = [
  { t: 'h2', n: '2.1', x: 'Introduction' },
  { t: 'p', x: 'This chapter presents a critical review of literature related to the design and development of a GPS-based maternal emergency response and monitoring system, with specific focus on Mukono District, Uganda. The review examines theoretical and empirical studies in maternal health informatics, situates maternal mortality within both global and national contexts, and analyses the role of geospatial technologies in emergency obstetric care.' },
  { t: 'p', x: 'Particular emphasis is placed on the interaction between geography, infrastructure and health system responsiveness in Mukono District. The district’s rural sub-counties, island communities and referral pathways to Mukono General Hospital are examined as key determinants of emergency response efficiency. The chapter concludes by synthesising the literature to identify the gaps that justify the development of a real-time GPS-enabled maternal emergency system.' },

  { t: 'h2', n: '2.2', x: 'Conceptual Framework: Maternal Health Informatics and the Three Delays Model' },
  { t: 'h3', n: '2.2.1', x: 'Evolution of Health Information Systems in Maternal Care' },
  { t: 'p', x: 'Health Information Systems have evolved from static administrative tools into dynamic platforms that support real-time decision-making. Early systems focused primarily on patient registration and aggregate reporting, limiting their utility in emergency scenarios. In Uganda, the Health Management Information System reflects this limitation, as it largely supports retrospective data analysis rather than real-time intervention.' },
  { t: 'p', x: 'The emergence of mobile health technologies has significantly improved communication in maternal healthcare. Initiatives such as UNICEF’s mTrac have enhanced antenatal care attendance and drug monitoring through SMS-based platforms. However, these systems remain fundamentally location-blind, lacking the ability to provide spatial intelligence during emergencies.' },
  { t: 'p', x: 'Recent studies highlight that while mHealth improves information dissemination, it does not address the geospatial coordination that is critical in emergency response. In Mukono District, Village Health Teams rely heavily on mobile phones, yet the absence of location-aware technologies limits their effectiveness in guiding emergency responders. This indicates a clear technological gap: the transition from communication-based systems to location-aware, real-time emergency systems remains largely unaddressed.' },
  { t: 'h3', n: '2.2.2', x: 'The Three Delays Model' },
  { t: 'p', x: 'The Three Delays Model provides the foundational framework for understanding maternal mortality (Thaddeus & Maine, 1994). It identifies three critical barriers: the delay in deciding to seek care, the delay in reaching a health facility, and the delay in receiving adequate care once the facility is reached.' },
  { t: 'p', x: 'While all three delays are significant, this study focuses on the second, which is heavily influenced by geographical and infrastructural factors. In the context of Mukono District, the second delay is compounded by what this study conceptualises as spatial invisibility — the inability of healthcare providers to locate patients accurately during emergencies. This transforms distance from a physical barrier into an information failure.' },
  { t: 'p', x: 'Empirical evidence from Uganda shows that delays in reaching facilities are a major contributor to maternal mortality, particularly in rural and peri-urban settings. In Mukono, poorly mapped settlements such as Nama and isolated island communities such as Koome intensify this challenge. Addressing the second delay therefore requires not only transport solutions but geospatial intelligence.' },

  { t: 'h2', n: '2.3', x: 'Maternal Health Context in Mukono District' },
  { t: 'h3', n: '2.3.1', x: 'Geographical and Demographic Characteristics' },
  { t: 'p', x: 'Mukono District is located in Central Uganda and exhibits significant geographical diversity, including urban centres, rural settlements and island communities on Lake Victoria. This diversity creates uneven access to healthcare services. With an estimated population of approximately 700,000, the district has a high proportion of women of reproductive age, increasing demand for maternal health services.' },
  { t: 'p', x: 'Geographical constraints, particularly in island communities, introduce systemic delays in accessing care. Transport limitations, long distances and unreliable communication networks collectively increase the risk of maternal complications and mortality.' },
  { t: 'h3', n: '2.3.2', x: 'Health Facilities and the Referral System' },
  { t: 'p', x: 'Mukono General Hospital serves as the primary referral facility for comprehensive emergency obstetric and newborn care. Lower-level facilities provide basic services but often lack critical resources such as surgical capacity and blood transfusion services.' },
  { t: 'p', x: 'The referral system is largely manual and fragmented, relying on telephone communication and informal directions, which produces inefficiency during emergencies. Studies indicate that ambulance drivers may spend up to sixty minutes locating patients because directions are unclear. This delay highlights a key weakness: the absence of structured, location-based referral.' },
  { t: 'h3', n: '2.3.3', x: 'Village Health Teams and Their Role' },
  { t: 'p', x: 'Village Health Teams play a crucial role in bridging communities and the formal healthcare system. They facilitate referrals, monitor pregnancies and provide health education. Despite their importance, they face significant operational challenges, including a lack of digital tools and limited logistical support, and their reliance on verbal communication further contributes to spatial inefficiency. Integrating Village Health Teams into a GPS-enabled system would significantly enhance their ability to coordinate emergency responses.' },

  { t: 'h2', n: '2.4', x: 'Review of GPS and GIS Applications in Maternal Health' },
  { t: 'h3', n: '2.4.1', x: 'Global Evidence on Geospatial Technologies in Emergency Care' },
  { t: 'p', x: 'Geospatial technologies such as GIS and GPS have transformed emergency response systems globally, enabling real-time tracking, route optimisation and spatial analysis of healthcare access. In high-income countries, GPS-enabled ambulance systems have significantly reduced response times, and GIS has been used to identify underserved populations and optimise the allocation of healthcare resources. These applications demonstrate that location intelligence is a critical component of effective healthcare delivery.' },
  { t: 'h3', n: '2.4.2', x: 'GPS-Enabled Maternal Health Initiatives in Low-Resource Settings' },
  { t: 'p', x: 'In sub-Saharan Africa, several pilot projects have explored GPS-based maternal health solutions. In Tanzania, GPS integration reduced response times by approximately eighteen minutes. In Nigeria, the MNETI initiative achieved a significant reduction in transport time. In Kenya, GPS systems improved referral coordination despite infrastructural challenges. These studies demonstrate the feasibility and effectiveness of GPS technologies even in low-resource environments; however, most remain pilot-based and lack long-term scalability.' },
  { t: 'h3', n: '2.4.3', x: 'Challenges of GPS Integration in Rural Uganda' },
  { t: 'p', x: 'Despite its potential, GPS implementation in Mukono faces several constraints: limited network coverage, especially in island areas; low smartphone penetration; data privacy and security concerns; and dependence on donor-funded pilot projects. These challenges establish the need for a context-aware system design incorporating offline functionality, low-bandwidth optimisation and a sustainable deployment model — requirements that directly shaped the architecture adopted in this study.' },

  { t: 'h2', n: '2.5', x: 'Existing Maternal Health Information Systems in Uganda and Mukono' },
  { t: 'h3', n: '2.5.1', x: 'National Systems' },
  { t: 'p', x: 'Uganda’s Health Management Information System and electronic logistics management systems support health data management and supply logistics. However, they are not designed for real-time emergency coordination and cannot act on a patient’s position.' },
  { t: 'h3', n: '2.5.2', x: 'District-Level Practices' },
  { t: 'p', x: 'At district level, communication is largely informal, relying on telephone calls and consumer messaging platforms. These methods lack structure, data integration and spatial capability. No system currently in use in Mukono District supports real-time patient tracking, automated ambulance dispatch or geospatial decision-making.' },
  { t: 'h3', n: '2.5.3', x: 'Role of NGOs and the Private Sector' },
  { t: 'p', x: 'Non-governmental organisations support maternal health through transport schemes and awareness programmes. These initiatives are, however, fragmented and are not integrated into a unified system. A centralised GPS-based platform could enhance coordination and improve efficiency across stakeholders.' },

  { t: 'h2', n: '2.6', x: 'Spatial Invisibility in Mukono: A Critical Gap' },
  { t: 'p', x: 'Spatial invisibility emerges as the central challenge in maternal healthcare delivery in Mukono District. It refers to the inability of healthcare providers to identify and navigate to a patient’s location accurately. It is driven by the lack of a formal addressing system, poorly mapped rural areas, the geographical isolation of island communities and the absence of real-time location tracking.' },
  { t: 'p', x: 'Studies show that significant time is lost locating patients before transport even begins. In emergency conditions such as postpartum haemorrhage, where the therapeutic window may be measured in hours, these delays are frequently fatal. Spatial invisibility therefore represents a critical intersection between geography, technology and healthcare failure.' },

  { t: 'h2', n: '2.7', x: 'Synthesis and Research Gap' },
  { t: 'p', x: 'The reviewed literature reveals several consistent findings: the second delay is a major contributor to maternal mortality in Uganda; existing mHealth systems lack geospatial capability; GPS technologies are effective but underused in low-resource settings; and Mukono District presents geographical challenges that make it a demanding test case.' },
  { t: 'p', x: 'Despite these findings, no integrated, GPS-based maternal emergency response system tailored to Mukono District exists. This study addressed that gap by developing a system that integrates a mobile interface with a web dashboard, enables real-time location tracking, supports coordinated emergency response and is optimised for intermittent connectivity.' },

  { t: 'h2', n: '2.8', x: 'Chapter Summary' },
  { t: 'p', x: 'This chapter reviewed literature on maternal health informatics, the Three Delays Model and geospatial technologies in healthcare, and highlighted the limitations of existing systems together with the particular challenges faced in Mukono District. The concept of spatial invisibility was identified as a key barrier to effective emergency response, and the absence of real-time, location-aware systems was established as a significant research and practical gap. The methodology adopted to address that gap is described in the chapter that follows.' },
];

module.exports = { ACRONYMS, TERMS, ABSTRACT, CH1, CH2 };
