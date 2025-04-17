/**
 * Tokungaku - Main Application Logic
 * 
 * This file handles the initialization and coordination of all application components.
 */

// Create global application object first to ensure it's available to all modules
window.TokungakuApp = {};

// Global application state
TokungakuApp = {
    config: {
        editorWidth: 960,
        rows: 36, // 3 octaves
        columns: 32, // default 4/4 time signature with 32 steps
        maxColumns: 64,
        bpm: 120,
        gridColor: 'rgba(255, 255, 255, 0.2)',
        gridLineColor: 'rgba(255, 255, 255, 0.4)'
    },
    state: {
        currentImage: null,
        notes: [],
        playing: false,
        selectedNoteId: null,
        modified: false
    },
    // Will be populated by other modules
    ui: {},
    grid: {},
    notes: {},
    audio: {},
    storage: {}
};

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Tokungaku...');
    
    // Initialize all modules
    TokungakuApp.storage.init();
    TokungakuApp.grid.init();
    TokungakuApp.notes.init();
    TokungakuApp.audio.init();
    TokungakuApp.ui.init();
    
    // Load any saved project if available
    const savedProject = TokungakuApp.storage.loadLastSession();
    if (savedProject) {
        console.log('Loading saved project...');
        TokungakuApp.ui.loadProject(savedProject);
    }
    
    console.log('Tokungaku initialized successfully');
});

// Handle window unload to save work
window.addEventListener('beforeunload', (e) => {
    if (TokungakuApp.state.modified) {
        // Save current state automatically
        TokungakuApp.storage.saveSession();
        
        // Optionally, show a confirmation dialog
        const confirmationMessage = 'You have unsaved changes. Are you sure you want to leave?';
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    }
});