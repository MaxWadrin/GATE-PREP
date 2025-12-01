/**
 * GATE War Room - Database Layer
 * Handles data persistence, migration, and schema management.
 * Mimics a document-store database using localStorage.
 */

const DB_KEY = 'GATE_DB_v2';

class SchemaManager {
    constructor() {
        this.data = this.load();
        this.ensureSchema();
    }

    load() {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) return this.getInitialSchema();
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error("DB Corrupt, resetting", e);
            return this.getInitialSchema();
        }
    }

    save() {
        localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    }

    getInitialSchema() {
        return {
            version: 2,
            settings: {
                shiftToday: "5am-1pm",
                weekOffDay: "Sunday",
                examDate: "2026-02-01",
                dailyCapacity: 6 // hours
            },
            topics: {}, // ID -> Topic Object
            logs: [] // Array of daily logs
        };
    }

    ensureSchema() {
        // Migration from v1 (loose localStorage keys) to v2 (Structured DB)
        if (!this.data.topics || Object.keys(this.data.topics).length === 0) {
            console.log("Migrating from v1 to v2...");
            this.migrateFromV1();
        }
    }

    migrateFromV1() {
        // 1. Parse Syllabus CSV to get all topics
        // We rely on GATE_SYLLABUS_CSV being available globally
        if (typeof GATE_SYLLABUS_CSV === 'undefined') {
            console.warn("Syllabus CSV not loaded, skipping migration.");
            return;
        }

        const rows = GATE_SYLLABUS_CSV.split('\n').slice(1);
        rows.forEach(row => {
            const parts = this.parseCSVRow(row);
            if (parts.length < 3) return;

            const [subject, chapter, topicName] = parts;
            const id = `${subject}_${topicName}`.replace(/\s+/g, '_'); // Simple ID generation

            // Check if we have old status
            const oldKey = `syl_${subject}_${topicName}`;
            const oldStatusVal = localStorage.getItem(oldKey);

            let status = 'not_started';
            if (oldStatusVal === '1') status = 'learning';
            if (oldStatusVal === '2') status = 'active_recall'; // Was T0 Pending
            if (oldStatusVal === '3') status = 'srs_active';
            if (oldStatusVal === '4') status = 'completed';

            this.data.topics[id] = {
                id: id,
                subject: subject,
                chapter: chapter,
                name: topicName,
                status: status,
                difficulty: 'Medium', // Default
                tags: [],
                createdAt: Date.now(),
                learningHistory: {
                    mentalCount: 0,
                    verbalCount: 0,
                    writtenCount: 0
                },
                srs: {
                    lastReview: null,
                    nextReview: null,
                    interval: 0,
                    easeFactor: 2.5,
                    history: []
                }
            };
        });

        this.save();
        console.log(`Migration Complete. Imported ${Object.keys(this.data.topics).length} topics.`);
    }

    parseCSVRow(row) {
        // Handle quoted strings
        const parts = [];
        let current = '';
        let inQuote = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                parts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current.trim());
        return parts;
    }

    // --- Accessors ---

    getAllTopics() {
        return Object.values(this.data.topics);
    }

    getTopic(id) {
        return this.data.topics[id];
    }

    updateTopic(id, updates) {
        if (!this.data.topics[id]) return;
        this.data.topics[id] = { ...this.data.topics[id], ...updates };
        this.save();
    }

    getSettings() {
        return this.data.settings;
    }

    updateSettings(updates) {
        this.data.settings = { ...this.data.settings, ...updates };
        this.save();
    }
}

// Initialize Global DB Instance
const DB = new SchemaManager();
window.DB = DB; // Expose to window
