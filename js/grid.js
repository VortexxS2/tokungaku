/**
 * Tokungaku - Grid Management
 * 
 * This module handles the creation and management of the piano-roll grid.
 */

TokungakuApp.grid = {
    // Grid DOM element
    element: null,
    
    // Grid dimensions and properties
    cellWidth: 0,
    cellHeight: 0,
    
    /**
     * Initialize the grid system
     */
    init: function() {
        this.element = document.getElementById('grid-overlay');
        this.calculateDimensions();
        this.render();
        
        // Listen for changes in grid configuration
        document.getElementById('time-signature').addEventListener('change', this.handleTimeSignatureChange.bind(this));
        document.getElementById('steps').addEventListener('change', this.handleStepsChange.bind(this));
        
        // Resize listener
        window.addEventListener('resize', this.handleResize.bind(this));
    },
    
    /**
     * Calculate grid cell dimensions based on editor size and grid configuration
     */
    calculateDimensions: function() {
        const editorWidth = TokungakuApp.config.editorWidth;
        const imageContainer = document.getElementById('image-container');
        const editorHeight = imageContainer.offsetHeight || 480; // Default height if no image
        
        this.cellWidth = editorWidth / TokungakuApp.config.columns;
        this.cellHeight = editorHeight / TokungakuApp.config.rows;
        
        // Adjust notes-layer and grid-overlay dimensions
        document.getElementById('notes-layer').style.height = `${editorHeight}px`;
        this.element.style.height = `${editorHeight}px`;
    },
    
    /**
     * Check if a row is a semitone (black key)
     * @param {number} row - Grid row
     * @returns {boolean} True if row is a semitone
     */
    isSemitone: function(row) {
        // Convert to piano key from bottom to top (0 = lowest)
        const keyIndex = TokungakuApp.config.rows - 1 - row;
        // Get the key within the octave (0-11)
        const keyInOctave = keyIndex % 12;
        // Semitones are at positions 1, 3, 6, 8, 10 (corresponding to C#, D#, F#, G#, A#)
        return [1, 3, 6, 8, 10].includes(keyInOctave);
    },
    
    /**
     * Render the grid based on current configuration
     */
    render: function() {
        // Clear existing grid
        this.element.innerHTML = '';
        
        const rows = TokungakuApp.config.rows;
        const columns = TokungakuApp.config.columns;
        
        // Create grid cells
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                
                // Set different background for semitones (black keys) and whole tones (white keys)
                if (this.isSemitone(row)) {
                    cell.classList.add('semitone');
                } else {
                    cell.classList.add('wholetone');
                }
                
                cell.style.width = `${this.cellWidth}px`;
                cell.style.height = `${this.cellHeight}px`;
                cell.style.left = `${col * this.cellWidth}px`;
                cell.style.top = `${row * this.cellHeight}px`;
                
                // Add emphasis on beat divisions (every 4 steps by default)
                if (col % 4 === 0) {
                    cell.style.borderLeftWidth = '2px';
                    cell.style.borderLeftColor = 'rgba(255, 255, 255, 0.6)';
                }
                
                // Add emphasis for octave markers (every 12 rows)
                if (row % 12 === 0) {
                    cell.style.borderTopWidth = '2px';
                    cell.style.borderTopColor = 'rgba(255, 255, 255, 0.6)';
                }
                
                this.element.appendChild(cell);
            }
        }
        
        // Update the editor-area height
        document.getElementById('editor-area').style.height = `${rows * this.cellHeight}px`;
    },
    
    /**
     * Get the grid cell coordinates at a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object} Cell coordinates {row, col}
     */
    getCellAtPosition: function(x, y) {
        const rect = this.element.getBoundingClientRect();
        const relX = x - rect.left;
        const relY = y - rect.top;
        
        // Calculate grid coordinates
        const col = Math.floor(relX / this.cellWidth);
        const row = Math.floor(relY / this.cellHeight);
        
        // Ensure coordinates are within grid bounds
        return {
            row: Math.max(0, Math.min(row, TokungakuApp.config.rows - 1)),
            col: Math.max(0, Math.min(col, TokungakuApp.config.columns - 1))
        };
    },
    
    /**
     * Calculate pixel position from grid coordinates
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @returns {Object} Pixel coordinates {x, y}
     */
    getPositionFromCell: function(row, col) {
        return {
            x: col * this.cellWidth,
            y: row * this.cellHeight
        };
    },
    
    /**
     * Handle time signature change
     * @param {Event} e - Change event
     */
    handleTimeSignatureChange: function(e) {
        const timeSignature = parseInt(e.target.value);
        // Update steps according to time signature
        const stepsInput = document.getElementById('steps');
        const recommendedSteps = timeSignature * 8; // 8 measures
        stepsInput.value = recommendedSteps;
        
        // Update columns
        TokungakuApp.config.columns = recommendedSteps;
        this.calculateDimensions();
        this.render();
        
        // Also update notes display
        TokungakuApp.notes.renderAll();
        TokungakuApp.state.modified = true;
    },
    
    /**
     * Handle steps change
     * @param {Event} e - Change event
     */
    handleStepsChange: function(e) {
        const steps = parseInt(e.target.value);
        
        // Validate steps (min 4, max 64)
        if (steps < 4) {
            e.target.value = 4;
            TokungakuApp.config.columns = 4;
        } else if (steps > TokungakuApp.config.maxColumns) {
            e.target.value = TokungakuApp.config.maxColumns;
            TokungakuApp.config.columns = TokungakuApp.config.maxColumns;
        } else {
            TokungakuApp.config.columns = steps;
        }
        
        this.calculateDimensions();
        this.render();
        
        // Also update notes display
        TokungakuApp.notes.renderAll();
        TokungakuApp.state.modified = true;
    },
    
    /**
     * Handle window resize
     */
    handleResize: function() {
        this.calculateDimensions();
        this.render();
        TokungakuApp.notes.renderAll();
        
        // Reinitialize playback cursor after resize
        if (TokungakuApp.audio && typeof TokungakuApp.audio.initPlaybackCursor === 'function') {
            TokungakuApp.audio.initPlaybackCursor();
            
            // If playback is active, update cursor position
            if (TokungakuApp.audio.playbackState.isPlaying) {
                TokungakuApp.audio.updatePlaybackCursor(TokungakuApp.audio.playbackState.currentStep);
            }
        }
    }
};