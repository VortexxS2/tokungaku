/**
 * Tokungaku - Audio Engine
 * 
 * This module handles audio playback and MIDI export functionality.
 */

TokungakuApp.audio = {
    // Audio context
    context: null,
    
    // Oscillator nodes for each note
    oscillators: {},
    
    // Playback state
    playbackState: {
        isPlaying: false,
        currentStep: 0,
        intervalId: null,
        startTime: 0
    },
    
    /**
     * Initialize the audio engine
     */
    init: function() {
        // Set up Web Audio API
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
        } catch (e) {
            console.error('Web Audio API is not supported in this browser', e);
            alert('Your browser does not support Web Audio API, which is required for playback.');
        }
        
        // Set up event listeners
        document.getElementById('play-btn').addEventListener('click', this.startPlayback.bind(this));
        document.getElementById('stop-btn').addEventListener('click', this.stopPlayback.bind(this));
        document.getElementById('bpm').addEventListener('change', this.updateBPM.bind(this));
        document.getElementById('export-midi-btn').addEventListener('click', this.exportMIDI.bind(this));
        
        // Keyboard shortcut for play/stop
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },
    
    /**
     * Start playback of the current sequence
     */
    startPlayback: function() {
        if (this.playbackState.isPlaying) {
            return; // Already playing
        }
        
        // Create audio context if needed
        if (!this.context) {
            try {
                this.context = new AudioContext();
            } catch (e) {
                console.error('Failed to create audio context', e);
                return;
            }
        }
        
        // Resume audio context if suspended
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        
        // Set playback state
        this.playbackState.isPlaying = true;
        this.playbackState.currentStep = 0;
        this.playbackState.startTime = this.context.currentTime;
        
        // Calculate step duration in seconds
        const bpm = document.getElementById('bpm').value;
        const stepsPerBeat = 4; // Assuming 16th notes
        const stepDuration = 60 / (bpm * stepsPerBeat);
        
        // Start playback loop
        this.playbackState.intervalId = setInterval(() => {
            this.playStep(this.playbackState.currentStep);
            
            // Advance to next step
            this.playbackState.currentStep = (this.playbackState.currentStep + 1) % TokungakuApp.config.columns;
            
            // If we've played a full cycle, optionally stop
            if (this.playbackState.currentStep === 0 && false) { // Set to true for one-shot playback
                this.stopPlayback();
            }
        }, stepDuration * 1000);
        
        // Update UI
        document.getElementById('play-btn').disabled = true;
        document.getElementById('stop-btn').disabled = false;
    },
    
    /**
     * Stop playback of the current sequence
     */
    stopPlayback: function() {
        if (!this.playbackState.isPlaying) {
            return; // Not playing
        }
        
        // Clear playback interval
        if (this.playbackState.intervalId) {
            clearInterval(this.playbackState.intervalId);
            this.playbackState.intervalId = null;
        }
        
        // Stop all playing notes
        this.stopAllNotes();
        
        // Reset playback state
        this.playbackState.isPlaying = false;
        this.playbackState.currentStep = 0;
        
        // Update UI
        document.getElementById('play-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;
    },
    
    /**
     * Update BPM value
     * @param {Event} e - Change event
     */
    updateBPM: function(e) {
        let bpm = parseInt(e.target.value);
        
        // Validate BPM (40-300)
        if (isNaN(bpm) || bpm < 40) {
            bpm = 40;
            e.target.value = 40;
        } else if (bpm > 300) {
            bpm = 300;
            e.target.value = 300;
        }
        
        TokungakuApp.config.bpm = bpm;
        TokungakuApp.state.modified = true;
        
        // Restart playback if currently playing
        if (this.playbackState.isPlaying) {
            this.stopPlayback();
            this.startPlayback();
        }
    },
    
    /**
     * Play notes at current step
     * @param {number} step - Current step to play
     */
    playStep: function(step) {
        // Find all notes at current step
        const notesToPlay = TokungakuApp.state.notes.filter(note => 
            step >= note.col && step < note.col + note.length
        );
        
        // Play each note
        notesToPlay.forEach(note => {
            const frequency = this.getMIDIFrequency(note.row);
            
            // Check if note is already playing
            if (this.oscillators[note.id]) {
                // Note is already playing, just continue
                return;
            }
            
            // Create oscillator
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            // Start oscillator
            oscillator.start();
            this.oscillators[note.id] = { oscillator, gainNode };
            
            // Check if note ends at next step
            const noteEndStep = note.col + note.length - 1;
            if (noteEndStep === step) {
                // Schedule note end
                gainNode.gain.setValueAtTime(0.5, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
                setTimeout(() => {
                    this.stopNote(note.id);
                }, 100);
            }
        });
        
        // Stop notes that are no longer playing
        Object.keys(this.oscillators).forEach(noteId => {
            const note = TokungakuApp.notes.findNoteById(noteId);
            if (!note || step < note.col || step >= note.col + note.length) {
                this.stopNote(noteId);
            }
        });
    },
    
    /**
     * Stop a specific note
     * @param {string} noteId - ID of note to stop
     */
    stopNote: function(noteId) {
        if (this.oscillators[noteId]) {
            this.oscillators[noteId].oscillator.stop();
            this.oscillators[noteId].oscillator.disconnect();
            this.oscillators[noteId].gainNode.disconnect();
            delete this.oscillators[noteId];
        }
    },
    
    /**
     * Stop all playing notes
     */
    stopAllNotes: function() {
        Object.keys(this.oscillators).forEach(noteId => {
            this.stopNote(noteId);
        });
    },
    
    /**
     * Convert grid row to MIDI note frequency
     * @param {number} row - Grid row (0-35)
     * @returns {number} Frequency in Hz
     */
    getMIDIFrequency: function(row) {
        // Convert grid row to MIDI note number (C3 = 60)
        // Reverse the row (0 = highest note, 35 = lowest note)
        const reversedRow = TokungakuApp.config.rows - 1 - row;
        
        // C3 (MIDI 60) is row 24 (in our 36-row grid, from bottom)
        const midiNote = 60 + (reversedRow - 24);
        
        // Convert MIDI note to frequency: F = 440 * 2^((n-69)/12)
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    },
    
    /**
     * Export sequence to MIDI file
     */
    exportMIDI: function() {
        // Check if there are any notes
        if (TokungakuApp.state.notes.length === 0) {
            alert('No notes to export. Add some notes first!');
            return;
        }
        
        // Create MIDI file data
        try {
            // For simplicity, we'll create a data URL with a JSON representation
            // In a real implementation, this would use a library like midi.js
            
            // Create a JSON representation of the notes
            const midiData = {
                bpm: TokungakuApp.config.bpm,
                timeSignature: document.getElementById('time-signature').value,
                notes: TokungakuApp.state.notes.map(note => {
                    // Reverse the row (0 = highest note, 35 = lowest note)
                    const reversedRow = TokungakuApp.config.rows - 1 - note.row;
                    
                    // C3 (MIDI 60) is row 24 (in our 36-row grid, from bottom)
                    const midiNote = 60 + (reversedRow - 24);
                    
                    return {
                        note: midiNote,
                        start: note.col,
                        duration: note.length
                    };
                })
            };
            
            // Convert to data URL
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(midiData, null, 2));
            
            // Create download link
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "tokungaku_sequence.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            alert('MIDI sequence exported successfully (as JSON format).\n\nNote: In a real implementation, this would generate a proper MIDI file using a library like midi.js.');
        } catch (e) {
            console.error('Error exporting MIDI:', e);
            alert('Error exporting MIDI file: ' + e.message);
        }
    },
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown: function(e) {
        // Only handle shortcuts if not in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Handle play/stop with spacebar
        if (e.key === ' ' || e.code === 'Space') {
            if (this.playbackState.isPlaying) {
                this.stopPlayback();
            } else {
                this.startPlayback();
            }
            e.preventDefault();
        }
    }
};