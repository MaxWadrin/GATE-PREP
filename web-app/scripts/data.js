const GATE_DATA = {
    examDate: "2026-02-03",
    srsConfig: {
        baseInterval: 1,
        minEase: 1.3,
        defaultEase: 2.5,
        retentionThreshold: 0.8,
        intervals: [0.5, 1, 3, 7, 21, 45], // T0 (0.5d) -> T1 (1d) -> ...
        t0Interval: 0.5 // 12 hours approx
    },
    shiftPatterns: {
        "5am-1pm": {
            label: "Early Shift (5 AM - 1 PM)",
            windows: [
                { time: "4:00 PM - 7:00 PM", focus: "High", duration: 3 },
                { time: "8:00 PM - 11:00 PM", focus: "Medium", duration: 3 }
            ],
            slots: [
                { name: "Deep Work Session 1", duration: "1.5 hr", type: "primary", priority: "new" },
                { name: "Deep Work Session 2", duration: "1.5 hr", type: "primary", priority: "new" },
                { name: "Practice Block", duration: "1 hr", type: "secondary", priority: "srs" },
                { name: "T0 Consolidation (Recall)", duration: "1 hr", type: "consolidation", priority: "t0" },
                { name: "Final SRS Sweep", duration: "1 hr", type: "secondary", priority: "srs" }
            ]
        },
        "11am-7pm": {
            label: "Mid Shift (11 AM - 7 PM)",
            windows: [
                { time: "6:00 AM - 9:00 AM", focus: "High", duration: 3 },
                { time: "10:00 PM - 12:30 AM", focus: "Medium", duration: 2.5 }
            ],
            slots: [
                { name: "Morning Deep Work", duration: "2 hrs", type: "primary", priority: "new" },
                { name: "Morning Practice", duration: "1 hr", type: "secondary", priority: "srs" },
                { name: "Night T0 Recall", duration: "1 hr", type: "consolidation", priority: "t0" },
                { name: "Night SRS & PYQ", duration: "1.5 hr", type: "secondary", priority: "srs" }
            ]
        },
        "1pm-9pm": {
            label: "Late Shift (1 PM - 9 PM)",
            windows: [
                { time: "7:00 AM - 11:00 AM", focus: "High", duration: 4 },
                { time: "12:00 AM - 1:00 AM", focus: "Low", duration: 1 }
            ],
            slots: [
                { name: "Morning Deep Work 1", duration: "2 hrs", type: "primary", priority: "new" },
                { name: "Morning Deep Work 2", duration: "1.5 hr", type: "primary", priority: "new" },
                { name: "Pre-Shift T0 Check", duration: "30 min", type: "consolidation", priority: "t0" },
                { name: "Night Decompression SRS", duration: "1 hr", type: "secondary", priority: "srs" }
            ]
        },
        "4pm-12am": {
            label: "Night Shift (4 PM - 12 AM)",
            windows: [
                { time: "8:00 AM - 2:00 PM", focus: "High", duration: 6 }
            ],
            slots: [
                { name: "Morning Deep Work 1", duration: "2 hrs", type: "primary", priority: "new" },
                { name: "Morning Deep Work 2", duration: "2 hrs", type: "primary", priority: "new" },
                { name: "Mid-Day Practice", duration: "1 hr", type: "secondary", priority: "srs" },
                { name: "Pre-Shift T0 Recall", duration: "1 hr", type: "consolidation", priority: "t0" }
            ]
        }
    },
    schedule: [
        // PHASE 1: CONCEPT BUILD (Nov 30 - Dec 31)
        {
            id: "week-1",
            title: "WEEK 1 (Nov 30 - Dec 7)",
            phase: "Phase 1: Concept Build",
            focus: "Maths & Signals",
            tasks: [
                {
                    id: "w1-m1", title: "Linear Algebra", type: "concept",
                    subtasks: ["Vector Space & Basis", "Linear Dependence", "Matrix Algebra", "Eigenvalues & Eigenvectors", "Rank & System of Equations"]
                },
                {
                    id: "w1-m2", title: "Calculus", type: "concept",
                    subtasks: ["Mean Value Theorems", "Definite Integrals", "Partial Derivatives", "Maxima & Minima", "Multiple Integrals", "Vector Calculus (Gradient, Div, Curl)"]
                },
                {
                    id: "w1-m3", title: "Differential Equations", type: "concept",
                    subtasks: ["First Order DE", "Higher Order Linear DE", "Cauchy & Euler Equations", "Partial Differential Equations"]
                },
                {
                    id: "w1-s1", title: "Fourier Series", type: "concept",
                    subtasks: ["Trigonometric Fourier Series", "Exponential Fourier Series", "Properties & Symmetry"]
                },
                {
                    id: "w1-s2", title: "Fourier Transform", type: "concept",
                    subtasks: ["CTFT Definition", "Properties of CTFT", "Standard Signals Transform", "Parseval's Theorem"]
                },
                { id: "w1-pyq", title: "Week 1 PYQs", type: "pyq", subtasks: ["Maths PYQs (50)", "Signals PYQs (50)"] }
            ]
        },
        {
            id: "week-2",
            title: "WEEK 2 (Dec 8 - Dec 14)",
            phase: "Phase 1: Concept Build",
            focus: "Networks & Signals Advanced",
            tasks: [
                {
                    id: "w2-n1", title: "Network Theorems", type: "concept",
                    subtasks: ["KCL/KVL & Mesh/Node", "Thevenin & Norton", "Superposition", "Maximum Power Transfer"]
                },
                {
                    id: "w2-n2", title: "Transient Analysis", type: "concept",
                    subtasks: ["First Order RC/RL Circuits", "Second Order RLC Circuits", "Initial Conditions", "Laplace Approach"]
                },
                {
                    id: "w2-s1", title: "LTI Systems", type: "concept",
                    subtasks: ["Impulse Response", "Convolution Integral", "Stability & Causality", "Frequency Response"]
                },
                {
                    id: "w2-s2", title: "Laplace & Z-Transform", type: "concept",
                    subtasks: ["Laplace ROC & Properties", "Inverse Laplace", "Z-Transform ROC", "Inverse Z-Transform"]
                },
                { id: "w2-pyq", title: "Week 2 PYQs", type: "pyq", subtasks: ["Networks PYQs (50)", "Signals Adv PYQs (50)"] }
            ]
        },
        {
            id: "week-3",
            title: "WEEK 3 (Dec 15 - Dec 21)",
            phase: "Phase 1: Concept Build",
            focus: "EDC & Analog",
            tasks: [
                {
                    id: "w3-e1", title: "Semiconductor Physics", type: "concept",
                    subtasks: ["Energy Bands", "Carrier Concentration", "Drift & Diffusion", "Continuity Equation"]
                },
                {
                    id: "w3-e2", title: "PN Junction & BJT", type: "concept",
                    subtasks: ["PN Junction Physics", "Zener Diode", "BJT Modes & Operation", "MOSFET Physics"]
                },
                {
                    id: "w3-a1", title: "Diode Circuits", type: "concept",
                    subtasks: ["Clippers & Clampers", "Rectifiers", "Voltage Regulators"]
                },
                {
                    id: "w3-a2", title: "Op-Amps & Amplifiers", type: "concept",
                    subtasks: ["Ideal Op-Amp", "Inverting/Non-Inverting", "BJT Biasing", "Small Signal Analysis"]
                },
                { id: "w3-pyq", title: "Week 3 PYQs", type: "pyq", subtasks: ["EDC PYQs (50)", "Analog PYQs (50)"] }
            ]
        },
        {
            id: "week-4",
            title: "WEEK 4 (Dec 22 - Dec 31)",
            phase: "Phase 1: Concept Build",
            focus: "Digital, Control, Comms",
            tasks: [
                {
                    id: "w4-d1", title: "Digital Circuits", type: "concept",
                    subtasks: ["Boolean Algebra", "K-Maps", "Logic Gates", "Combinational Circuits", "Sequential Circuits"]
                },
                {
                    id: "w4-c1", title: "Control Systems Basics", type: "concept",
                    subtasks: ["Block Diagrams", "Signal Flow Graphs", "Time Response Analysis", "Routh Hurwitz Stability"]
                },
                {
                    id: "w4-cm1", title: "Communication Basics", type: "concept",
                    subtasks: ["Amplitude Modulation", "Angle Modulation (FM/PM)", "Random Processes"]
                },
                { id: "w4-pyq", title: "Week 4 PYQs", type: "pyq", subtasks: ["Digital PYQs (30)", "Control PYQs (30)", "Comms PYQs (30)"] }
            ]
        },
        // PHASE 2: INTEGRATION (Jan 1 - Jan 21)
        {
            id: "week-5",
            title: "WEEK 5 (Jan 1 - Jan 7)",
            phase: "Phase 2: Integration",
            focus: "Subject PYQs (Math, Sig, Net, Dev)",
            tasks: [
                { id: "w5-p1", title: "Maths PYQ Cycle", type: "pyq_cycle", subtasks: ["Linear Algebra PYQs", "Calculus PYQs", "Diff Eq PYQs"] },
                { id: "w5-p2", title: "Signals PYQ Cycle", type: "pyq_cycle", subtasks: ["CT Signals PYQs", "DT Signals PYQs", "Systems PYQs"] },
                { id: "w5-p3", title: "Networks PYQ Cycle", type: "pyq_cycle", subtasks: ["Circuit Analysis PYQs", "Transient PYQs", "AC Analysis PYQs"] },
                { id: "w5-p4", title: "Devices PYQ Cycle", type: "pyq_cycle", subtasks: ["Semiconductor PYQs", "PN/BJT/MOS PYQs"] }
            ]
        },
        {
            id: "week-6",
            title: "WEEK 6 (Jan 8 - Jan 14)",
            phase: "Phase 2: Integration",
            focus: "Subject PYQs (Ana, Dig, Ctrl, Comm)",
            tasks: [
                { id: "w6-p1", title: "Analog PYQ Cycle", type: "pyq_cycle", subtasks: ["Diode Ckts PYQs", "Amplifiers PYQs", "Op-Amps PYQs"] },
                { id: "w6-p2", title: "Digital PYQ Cycle", type: "pyq_cycle", subtasks: ["Combinational PYQs", "Sequential PYQs", "Data Converters PYQs"] },
                { id: "w6-p3", title: "Control PYQ Cycle", type: "pyq_cycle", subtasks: ["Time Domain PYQs", "Frequency Domain PYQs", "State Space PYQs"] },
                { id: "w6-p4", title: "Comms PYQ Cycle", type: "pyq_cycle", subtasks: ["Analog Comm PYQs", "Digital Comm PYQs", "Info Theory PYQs"] }
            ]
        },
        {
            id: "week-7",
            title: "WEEK 7 (Jan 15 - Jan 21)",
            phase: "Phase 2: Integration",
            focus: "Subject Mocks (All 8)",
            tasks: [
                { id: "w7-m1", title: "Maths Mock", type: "mock", subtasks: ["Test", "Analysis", "Error Log"] },
                { id: "w7-m2", title: "Signals Mock", type: "mock", subtasks: ["Test", "Analysis", "Error Log"] },
                { id: "w7-m3", title: "Networks Mock", type: "mock", subtasks: ["Test", "Analysis", "Error Log"] },
                { id: "w7-m4", title: "Devices Mock", type: "mock", subtasks: ["Test", "Analysis", "Error Log"] },
                { id: "w7-m5", title: "Analog Mock", type: "mock", subtasks: ["Test", "Analysis", "Error Log"] },
                { id: "w7-m6", title: "Digital Mock", type: "mock", subtasks: ["Test", "Analysis", "Error Log"] },
                { id: "w7-m7", title: "Control Mock", type: "mock", subtasks: ["Test", "Analysis", "Error Log"] },
                { id: "w7-m8", title: "Comms Mock", type: "mock", subtasks: ["Test", "Analysis", "Error Log"] }
            ]
        },
        // PHASE 3: MOCK ORIENTED (Jan 22 - Feb 3)
        {
            id: "week-8",
            title: "WEEK 8 (Jan 22 - Jan 28)",
            phase: "Phase 3: Mock Oriented",
            focus: "3 Full Mocks + Error Log",
            tasks: [
                { id: "w8-flt1", title: "Full Length Test 1", type: "flt", subtasks: ["Attempt (3hrs)", "Analysis (3hrs)", "Fix Weak Areas"] },
                { id: "w8-flt2", title: "Full Length Test 2", type: "flt", subtasks: ["Attempt (3hrs)", "Analysis (3hrs)", "Fix Weak Areas"] },
                { id: "w8-flt3", title: "Full Length Test 3", type: "flt", subtasks: ["Attempt (3hrs)", "Analysis (3hrs)", "Fix Weak Areas"] },
                { id: "w8-err", title: "Error Log Repair", type: "revision", subtasks: ["Review All Errors", "Re-solve 50 Critical Errors"] }
            ]
        },
        {
            id: "week-9",
            title: "WEEK 9 (Jan 29 - Feb 3)",
            phase: "Phase 3: Mock Oriented",
            focus: "2 Full Mocks + Final Rev",
            tasks: [
                { id: "w9-flt1", title: "Full Length Test 4", type: "flt", subtasks: ["Attempt (3hrs)", "Analysis (3hrs)", "Fix Weak Areas"] },
                { id: "w9-flt2", title: "Full Length Test 5", type: "flt", subtasks: ["Attempt (3hrs)", "Analysis (3hrs)", "Fix Weak Areas"] },
                { id: "w9-rev", title: "Final Formula Revision", type: "revision", subtasks: ["Maths Formulas", "Electronics Formulas", "Systems Formulas"] }
            ]
        }
    ],
    revisionStrategies: {
        concept: {
            title: "Concept Learning",
            method: "Active Reading + Notes",
            tip: "Focus on understanding, not just memorizing.",
            frequency: [1, 7, 30]
        },
        notes: {
            title: "Handwritten Notes",
            method: "Active Reading + Mental Recall",
            tip: "Read -> Close -> Recall. No passive reading!",
            frequency: [1, 7, 30]
        },
        practice: {
            title: "Practice Book",
            method: "Mixed Practice + Self-Explanation",
            tip: "Solve 5-10 -> Explain steps -> Update formula sheet.",
            frequency: [3, 7]
        },
        pyq: {
            title: "PYQs",
            method: "Retrieval + Reconsolidation",
            tip: "Topic-wise first, then Mixed. Identify weak patterns.",
            frequency: [7, 14, 30]
        },
        pyq_cycle: {
            title: "PYQ Cycle",
            method: "Timed Sets",
            tip: "Solve in blocks of 30 mins. Track accuracy.",
            frequency: [7, 14]
        },
        mock: {
            title: "Subject Mock",
            method: "Test -> Error Log -> Reattempt",
            tip: "Only re-solve errors and weak topics.",
            frequency: [7]
        },
        flt: {
            title: "Full Length Test",
            method: "Deep Error Analysis",
            tip: "3-hour analysis. Re-attempt errors after 48 hrs.",
            frequency: [7]
        },
        revision: {
            title: "Revision",
            method: "Active Recall",
            tip: "Use flashcards or blank sheet method.",
            frequency: [7]
        }
    }
};
