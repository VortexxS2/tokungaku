/**
 * Tokungaku - Enhanced Audio Engine with Tone.js
 * 
 * This updated module adds MIDI instrument selection capabilities using Tone.js
 */

// First, add the Tone.js CDN script to your index.html before your other scripts:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>

TokungakuApp.audio = {
    // Audio context and Tone.js instruments
    context: null,
    currentInstrument: null,
    instruments: {},
    
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
            
            // Initialize Tone.js
            Tone.setContext(this.context);
            
            // Create instruments
            this.initializeInstruments();
            
            // Select default instrument
            this.selectInstrument('piano');

            // Initialize playback cursor
            this.initPlaybackCursor();
        } catch (e) {
            console.error('Web Audio API is not supported in this browser', e);
            alert('Your browser does not support Web Audio API, which is required for playback.');
        }
        
        // Set up event listeners
        document.getElementById('play-btn').addEventListener('click', this.startPlayback.bind(this));
        document.getElementById('stop-btn').addEventListener('click', this.stopPlayback.bind(this));
        document.getElementById('bpm').addEventListener('change', this.updateBPM.bind(this));
        document.getElementById('export-midi-btn').addEventListener('click', this.exportMIDI.bind(this));
        document.getElementById('instrument-select').addEventListener('change', this.handleInstrumentChange.bind(this));
        
        // Keyboard shortcut for play/stop
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },
    
    /**
     * Initialize available instruments using Tone.js
     */
    initializeInstruments: function() {
        // Create different instrument types
        this.instruments = {
            piano: new Tone.Sampler({
                urls: {
                    A1: "A1.mp3",
                    A2: "A2.mp3",
                    A3: "A3.mp3",
                    A4: "A4.mp3",
                    A5: "A5.mp3"
                },
                baseUrl: "https://tonejs.github.io/audio/salamander/",
                onload: () => console.log("Piano samples loaded")
            }).toDestination(),
            
            synth: new Tone.PolySynth(Tone.Synth).toDestination(),
            
            bass: new Tone.MonoSynth({
                oscillator: {
                    type: "sawtooth"
                },
                envelope: {
                    attack: 0.005,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 0.2
                },
                filterEnvelope: {
                    attack: 0,
                    decay: 0.1,
                    sustain: 0.2,
                    release: 0.1,
                    baseFrequency: 200,
                    octaves: 2
                }
            }).toDestination(),
            
            guitar: new Tone.PolySynth(Tone.MonoSynth, {
                polyphony: 6,
                voice: {
                    oscillator: {
                        type: "sawtooth"
                    }
                },
                envelope: {
                    attack: 0,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 0.6
                },
                filterEnvelope: {
                    attack: 0,
                    decay: 0.1,
                    sustain: 0.8,
                    release: 0.1,
                    baseFrequency: 800,
                    octaves: 2
                }
            }).toDestination(),
            
            violin: new Tone.FMSynth({
                harmonicity: 3.01,
                modulationIndex: 14,
                oscillator: {
                    type: "triangle"
                },
                envelope: {
                    attack: 0.2,
                    decay: 0.3,
                    sustain: 0.4,
                    release: 1.2
                },
                modulation: {
                    type: "square"
                },
                modulationEnvelope: {
                    attack: 0.01,
                    decay: 0.5,
                    sustain: 0.2,
                    release: 0.1
                }
            }).toDestination(),
            
            flute: new Tone.MonoSynth({
                oscillator: {
                    type: "sine"
                },
                envelope: {
                    attack: 0.1,
                    decay: 0.1,
                    sustain: 0.8,
                    release: 0.4
                }
            }).toDestination(),
            
            drums: new Tone.MembraneSynth().toDestination(),
            
            xylophone: new Tone.MetalSynth({
                frequency: 200,
                envelope: {
                    attack: 0.001,
                    decay: 0.4,
                    release: 0.2
                },
                harmonicity: 5.1,
                modulationIndex: 32,
                resonance: 4000,
                octaves: 1.5
            }).toDestination()
        };
    },
    
    /**
     * Select the current instrument
     * @param {string} instrumentName - Name of the instrument to select
     */
    selectInstrument: function(instrumentName) {
        const instrument = this.instruments[instrumentName];
        
        if (instrument) {
            this.currentInstrument = instrument;
            console.log(`Selected instrument: ${instrumentName}`);
        } else {
            console.error(`Instrument "${instrumentName}" not found`);
        }
    },

    // Initialize playback cursor (add to the init method after other initialization)
    initPlaybackCursor: function() {
        console.log('Initializing playback cursor');
        
        // Remove existing cursor if present
        const existingCursor = document.getElementById('playback-cursor');
        if (existingCursor) {
            existingCursor.remove();
        }
        
        // Create new cursor element
        const cursor = document.createElement('div');
        cursor.id = 'playback-cursor';
        cursor.className = 'playback-cursor';
        cursor.style.display = 'none';
        
        // Add to notes layer (better visibility)
        const notesLayer = document.getElementById('notes-layer');
        if (notesLayer) {
            notesLayer.appendChild(cursor);
            console.log('Cursor added to notes layer');
        } else {
            console.error('Notes layer not found!');
            
            // Fallback to grid overlay
            const gridOverlay = document.getElementById('grid-overlay');
            if (gridOverlay) {
                gridOverlay.appendChild(cursor);
                console.log('Cursor added to grid overlay');
            } else {
                console.error('Grid overlay not found!');
                
                // Last resort - add to editor area
                const editorArea = document.getElementById('editor-area');
                if (editorArea) {
                    editorArea.appendChild(cursor);
                    console.log('Cursor added to editor area');
                } else {
                    console.error('Editor area not found!');
                }
            }
        }
    },

    // Update cursor position (add this to audio.js)
    updatePlaybackCursor: function(step) {
        // Use let instead of const for the cursor variable
        let cursor = document.getElementById('playback-cursor');
        
        // If cursor doesn't exist, recreate it
        if (!cursor) {
            console.log('Playback cursor not found, recreating...');
            this.initPlaybackCursor();
            cursor = document.getElementById('playback-cursor'); // Reassign after recreation
        }
        
        if (!cursor) {
            console.error('Failed to create playback cursor!');
            return;
        }
        
        if (step !== undefined && this.playbackState.isPlaying) {
            // Position the cursor at the current step
            const columnWidth = TokungakuApp.grid.cellWidth;
            const xPosition = step * columnWidth;
            
            console.log(`Updating cursor position: step ${step}, position ${xPosition}px`);
            
            cursor.style.display = 'block';
            cursor.style.left = xPosition + 'px';
        } else {
            // Hide cursor when not playing
            console.log('Hiding cursor');
            cursor.style.display = 'none';
        }
    },
    
    /**
     * Handle instrument selection change
     * @param {Event} e - Change event
     */
    handleInstrumentChange: function(e) {
        this.selectInstrument(e.target.value);
        TokungakuApp.state.modified = true;
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
                Tone.setContext(this.context);
            } catch (e) {
                console.error('Failed to create audio context', e);
                return;
            }
        }
        
        // Resume audio context if suspended
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        
        // Start Tone Transport
        Tone.Transport.start();
        
        // Set playback state
        this.playbackState.isPlaying = true;
        this.playbackState.currentStep = 0;
        this.playbackState.startTime = this.context.currentTime;
        // Show playback cursor
        this.updatePlaybackCursor(0);
        
        // Calculate step duration in seconds
        const bpm = document.getElementById('bpm').value;
        Tone.Transport.bpm.value = bpm;
        
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
        
        // Stop Tone Transport
        Tone.Transport.stop();
        
        // Stop all playing notes
        this.stopAllNotes();
        
        // Reset playback state
        this.playbackState.isPlaying = false;
        this.playbackState.currentStep = 0;
        // Hide playback cursor
        this.updatePlaybackCursor();
        
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
        Tone.Transport.bpm.value = bpm;
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

        // Update cursor position
        this.updatePlaybackCursor(step);
        
        // Play each note with a tiny time offset to prevent overlap
        notesToPlay.forEach((note, index) => {
            // Only trigger note on the first step it appears
            if (step === note.col) {
                const midiNote = this.gridRowToMIDINote(note.row);
                const noteName = this.midiNoteToNoteName(midiNote);
                
                // Duration based on note length
                const duration = note.length * 0.25; // in seconds, assuming 16th notes
                
                // Add a tiny offset for each note to prevent exact simultaneous triggers
                const timeOffset = index * 0.01;
                
                // Play with Tone.js
                if (this.currentInstrument) {
                    // Different play methods depending on instrument type
                    try {
                        if (this.currentInstrument instanceof Tone.Sampler) {
                            this.currentInstrument.triggerAttackRelease(noteName, duration, Tone.now() + timeOffset);
                        } else {
                            // For all other instrument types
                            this.currentInstrument.triggerAttackRelease(noteName, duration, Tone.now() + timeOffset);
                        }
                    } catch (e) {
                        console.error(`Error playing note ${noteName}:`, e);
                    }
                }
            }
        });
    },
    
    /**
     * Stop a specific note (for backwards compatibility)
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
        // Stop any oscillators (legacy method)
        Object.keys(this.oscillators).forEach(noteId => {
            this.stopNote(noteId);
        });
        
        // Release all Tone.js instruments
        Object.values(this.instruments).forEach(instrument => {
            if (typeof instrument.releaseAll === 'function') {
                instrument.releaseAll();
            }
        });
    },
    
    /**
     * Convert grid row to MIDI note number
     * @param {number} row - Grid row (0-35)
     * @returns {number} MIDI note number
     */
    gridRowToMIDINote: function(row) {
        // Convert grid row to MIDI note number (C3 = 60)
        // Reverse the row (0 = highest note, 35 = lowest note)
        const reversedRow = TokungakuApp.config.rows - 1 - row;
        
        // C3 (MIDI 60) is row 24 (in our 36-row grid, from bottom)
        return 60 + (reversedRow - 24);
    },
    
    /**
     * Convert MIDI note to frequency
     * @param {number} midiNote - MIDI note number
     * @returns {number} Frequency in Hz
     */
    getMIDIFrequency: function(midiNote) {
        // Convert MIDI note to frequency: F = 440 * 2^((n-69)/12)
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    },
    
    /**
     * Convert MIDI note to note name (e.g. C4, F#3)
     * @param {number} midiNote - MIDI note number
     * @returns {string} Note name
     */
    midiNoteToNoteName: function(midiNote) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteIndex = midiNote % 12;
        
        return noteNames[noteIndex] + octave;
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
        
        // Check if midi-writer-js is available
        if (typeof MidiWriter === 'undefined') {
            alert('MIDI export library not loaded. Make sure midi-writer-js is included in your project.');
            return;
        }
        
        try {
            // Create a new track
            const track = new MidiWriter.Track();
            
            // Set tempo
            track.setTempo(TokungakuApp.config.bpm);
            
            // Get time signature
            const timeSignatureValue = parseInt(document.getElementById('time-signature').value);
            
            // Set time signature (numerator, denominator)
            // For 4/4, 3/4, etc. the denominator is 4
            // For 6/8, the denominator is 8
            let denominator = 4;
            if (timeSignatureValue === 6) {
                denominator = 8;
            }
            
            track.setTimeSignature(timeSignatureValue, denominator);
            
            // Set instrument (MIDI program change)
            // Map our instrument names to General MIDI program numbers
            const instrumentMap = {
                piano: 0,      // Acoustic Grand Piano
                synth: 80,     // Synth Lead
                bass: 32,      // Acoustic Bass
                guitar: 27,    // Electric Guitar (clean)
                violin: 40,    // Violin
                flute: 73,     // Flute
                drums: 118,    // Synth Drum
                xylophone: 13  // Marimba
            };
            
            // Get selected instrument
            const selectedInstrument = document.getElementById('instrument-select').value;
            
            // Set program change (instrument)
            const programNumber = instrumentMap[selectedInstrument] || 0;
            track.addEvent(new MidiWriter.ProgramChangeEvent({instrument: programNumber}));
            
            // Calculate ticks per step (using 128 ticks per quarter note as standard)
            const TICKS_PER_QUARTER = 128;
            const STEPS_PER_MEASURE = TokungakuApp.config.columns / (timeSignatureValue === 6 ? 2 : 4);
            const TICKS_PER_STEP = TICKS_PER_QUARTER / (STEPS_PER_MEASURE / timeSignatureValue);
            
            // Process notes
            TokungakuApp.state.notes.forEach(note => {
                // Convert grid row to MIDI note number
                const midiNote = this.gridRowToMIDINote(note.row);
                
                // Calculate start position and duration in ticks
                const startTick = Math.round(note.col * TICKS_PER_STEP);
                const durationTicks = Math.round(note.length * TICKS_PER_STEP);
                
                // Create note event
                const noteEvent = new MidiWriter.NoteEvent({
                    pitch: [midiNote],
                    duration: 'T' + durationTicks,
                    startTick: startTick,
                    velocity: 100
                });
                
                // Add note to track
                track.addEvent(noteEvent);
            });
            
            // Create writer and generate MIDI file
            const writer = new MidiWriter.Writer([track]);
            
            // Generate filename based on current date/time
            const now = new Date();
            const filename = 'tokungaku_' + 
                now.getFullYear() + 
                ('0' + (now.getMonth() + 1)).slice(-2) + 
                ('0' + now.getDate()).slice(-2) + 
                '_' + 
                ('0' + now.getHours()).slice(-2) + 
                ('0' + now.getMinutes()).slice(-2) + 
                '.mid';
            
            // Create download link with data URI
            const dataUri = writer.dataUri();
            const downloadLink = document.createElement('a');
            downloadLink.href = dataUri;
            downloadLink.download = filename;
            
            // Append to document, click and remove
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            console.log('MIDI file exported successfully');
        } catch (e) {
            console.error('Error exporting MIDI:', e);
            alert('Error exporting MIDI file: ' + e.message);
        }
    },

    /**
     * Helper method to convert grid row to MIDI note
     * (This should already exist in your code, but ensuring it's here for completeness)
     */
    gridRowToMIDINote: function(row) {
        // Convert grid row to MIDI note number (C3 = 60)
        // Reverse the row (0 = highest note, 35 = lowest note)
        const reversedRow = TokungakuApp.config.rows - 1 - row;
        
        // C3 (MIDI 60) is row 24 (in our 36-row grid, from bottom)
        return 60 + (reversedRow - 24);
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

window.addEventListener('DOMContentLoaded', function() {
    if (TokungakuApp.audio && typeof TokungakuApp.audio.initPlaybackCursor === 'function') {
        // Slight delay to ensure all elements are loaded
        setTimeout(function() {
            TokungakuApp.audio.initPlaybackCursor();
        }, 500);
    }
});