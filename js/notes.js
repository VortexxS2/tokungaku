/**
 * Tokungaku - Notes Management
 * 
 * This module handles the creation, editing, and management of musical notes.
 */

TokungakuApp.notes = {
    // Note DOM container
    container: null,
    
    // Counter for unique note IDs
    nextNoteId: 1,
    
    // Dragging state
    dragState: {
        isDragging: false,
        isResizing: false,
        noteId: null,
        startX: 0,
        startY: 0,
        originalCol: 0,
        originalRow: 0,
        originalLength: 0
    },
    
    /**
     * Initialize the notes system
     */
    init: function() {
        this.container = document.getElementById('notes-layer');
        
        // Set up event listeners for note manipulation
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Button event listeners
        document.getElementById('add-note-btn').addEventListener('click', this.addNoteAtCenter.bind(this));
        document.getElementById('delete-note-btn').addEventListener('click', this.deleteSelectedNote.bind(this));
        document.getElementById('increase-length-btn').addEventListener('click', this.increaseSelectedNoteLength.bind(this));
        document.getElementById('decrease-length-btn').addEventListener('click', this.decreaseSelectedNoteLength.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },
    
    /**
     * Create a new note
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @param {number} length - Note length in grid cells
     * @returns {Object} The created note object
     */
    createNote: function(row, col, length = 1) {
        const noteId = `note-${this.nextNoteId++}`;
        const note = {
            id: noteId,
            row: row,
            col: col,
            length: length
        };
        
        TokungakuApp.state.notes.push(note);
        TokungakuApp.state.modified = true;
        this.renderNote(note);
        
        return note;
    },
    
    /**
     * Render a single note on the grid
     * @param {Object} note - Note object to render
     */
    renderNote: function(note) {
        // Check if note already exists in DOM
        let noteElement = document.getElementById(note.id);
        const isNewElement = !noteElement;
        
        if (isNewElement) {
            noteElement = document.createElement('div');
            noteElement.id = note.id;
            noteElement.className = 'note';
            noteElement.setAttribute('data-note-id', note.id);
            
            // Create resize handle
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'note-resize-handle';
            resizeHandle.setAttribute('data-resize-handle', note.id);
            noteElement.appendChild(resizeHandle);
            
            this.container.appendChild(noteElement);
        }
        
        // Calculate position and dimensions
        const position = TokungakuApp.grid.getPositionFromCell(note.row, note.col);
        noteElement.style.left = `${position.x}px`;
        noteElement.style.top = `${position.y}px`;
        noteElement.style.width = `${TokungakuApp.grid.cellWidth * note.length}px`;
        noteElement.style.height = `${TokungakuApp.grid.cellHeight}px`;
        
        // Apply selection state
        if (TokungakuApp.state.selectedNoteId === note.id) {
            noteElement.classList.add('selected');
        } else {
            noteElement.classList.remove('selected');
        }
    },
    
    /**
     * Render all notes on the grid
     */
    renderAll: function() {
        // Clear all existing note elements
        this.container.innerHTML = '';
        
        // Render each note
        TokungakuApp.state.notes.forEach(note => this.renderNote(note));
    },
    
    /**
     * Select a note by ID
     * @param {string} noteId - ID of the note to select
     */
    selectNote: function(noteId) {
        // Deselect previously selected note
        if (TokungakuApp.state.selectedNoteId) {
            const prevSelected = document.getElementById(TokungakuApp.state.selectedNoteId);
            if (prevSelected) {
                prevSelected.classList.remove('selected');
            }
        }
        
        // Update selection state
        TokungakuApp.state.selectedNoteId = noteId;
        
        // Apply selection to the note element
        if (noteId) {
            const noteElement = document.getElementById(noteId);
            if (noteElement) {
                noteElement.classList.add('selected');
            }
            
            // Enable note control buttons
            document.getElementById('delete-note-btn').disabled = false;
            document.getElementById('increase-length-btn').disabled = false;
            document.getElementById('decrease-length-btn').disabled = false;
        } else {
            // Disable note control buttons
            document.getElementById('delete-note-btn').disabled = true;
            document.getElementById('increase-length-btn').disabled = true;
            document.getElementById('decrease-length-btn').disabled = true;
        }
    },
    
    /**
     * Find a note by ID
     * @param {string} noteId - ID of the note to find
     * @returns {Object|null} The note object or null if not found
     */
    findNoteById: function(noteId) {
        return TokungakuApp.state.notes.find(note => note.id === noteId);
    },
    
    /**
     * Find a note at specified grid coordinates
     * @param {number} row - Grid row
     * @param {number} col - Grid column
     * @returns {Object|null} The note object or null if not found
     */
    findNoteAtCell: function(row, col) {
        return TokungakuApp.state.notes.find(note => 
            note.row === row && col >= note.col && col < note.col + note.length
        );
    },
    
    /**
     * Add a note at the center of the grid
     */
    addNoteAtCenter: function() {
        const centerRow = Math.floor(TokungakuApp.config.rows / 2);
        const centerCol = Math.floor(TokungakuApp.config.columns / 4);
        
        // Check if a note is already selected
        if (TokungakuApp.state.selectedNoteId) {
            const selectedNote = this.findNoteById(TokungakuApp.state.selectedNoteId);
            if (selectedNote) {
                // Try to place the new note next to the selected one
                const newCol = selectedNote.col + selectedNote.length;
                if (newCol < TokungakuApp.config.columns) {
                    const newNote = this.createNote(selectedNote.row, newCol, 1);
                    this.selectNote(newNote.id);
                    return;
                }
            }
        }
        
        // Create a new note at the center of the grid
        const newNote = this.createNote(centerRow, centerCol, 1);
        this.selectNote(newNote.id);
    },
    
    /**
     * Delete the currently selected note
     */
    deleteSelectedNote: function() {
        if (!TokungakuApp.state.selectedNoteId) return;
        
        // Find note index
        const noteIndex = TokungakuApp.state.notes.findIndex(
            note => note.id === TokungakuApp.state.selectedNoteId
        );
        
        if (noteIndex !== -1) {
            // Remove note from state
            TokungakuApp.state.notes.splice(noteIndex, 1);
            
            // Remove note element from DOM
            const noteElement = document.getElementById(TokungakuApp.state.selectedNoteId);
            if (noteElement) {
                noteElement.remove();
            }
            
            // Clear selection
            this.selectNote(null);
            TokungakuApp.state.modified = true;
        }
    },
    
    /**
     * Increase the length of the selected note
     */
    increaseSelectedNoteLength: function() {
        if (!TokungakuApp.state.selectedNoteId) return;
        
        const note = this.findNoteById(TokungakuApp.state.selectedNoteId);
        if (note) {
            // Check if the note can be extended
            if (note.col + note.length < TokungakuApp.config.columns) {
                note.length += 1;
                this.renderNote(note);
                TokungakuApp.state.modified = true;
            }
        }
    },
    
    /**
     * Decrease the length of the selected note
     */
    decreaseSelectedNoteLength: function() {
        if (!TokungakuApp.state.selectedNoteId) return;
        
        const note = this.findNoteById(TokungakuApp.state.selectedNoteId);
        if (note && note.length > 1) {
            note.length -= 1;
            this.renderNote(note);
            TokungakuApp.state.modified = true;
        }
    },
    
    /**
     * Move the selected note
     * @param {number} rowDelta - Number of rows to move (positive = down)
     * @param {number} colDelta - Number of columns to move (positive = right)
     */
    moveSelectedNote: function(rowDelta, colDelta) {
        if (!TokungakuApp.state.selectedNoteId) return;
        
        const note = this.findNoteById(TokungakuApp.state.selectedNoteId);
        if (note) {
            // Calculate new position
            const newRow = note.row + rowDelta;
            const newCol = note.col + colDelta;
            
            // Check boundaries
            if (newRow >= 0 && newRow < TokungakuApp.config.rows &&
                newCol >= 0 && newCol + note.length <= TokungakuApp.config.columns) {
                note.row = newRow;
                note.col = newCol;
                this.renderNote(note);
                TokungakuApp.state.modified = true;
            }
        }
    },
    
    /**
     * Handle mouse down event on notes layer
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseDown: function(e) {
        // Check if clicking on a resize handle
        if (e.target.classList.contains('note-resize-handle')) {
            const noteId = e.target.getAttribute('data-resize-handle');
            const note = this.findNoteById(noteId);
            
            if (note) {
                // Initialize resize operation
                this.dragState.isResizing = true;
                this.dragState.noteId = noteId;
                this.dragState.startX = e.clientX;
                this.dragState.originalLength = note.length;
                
                // Select the note
                this.selectNote(noteId);
                e.stopPropagation();
            }
            return;
        }
        
        // Check if clicking on a note
        if (e.target.classList.contains('note')) {
            const noteId = e.target.getAttribute('data-note-id');
            const note = this.findNoteById(noteId);
            
            if (note) {
                // Initialize drag operation
                this.dragState.isDragging = true;
                this.dragState.noteId = noteId;
                this.dragState.startX = e.clientX;
                this.dragState.startY = e.clientY;
                this.dragState.originalCol = note.col;
                this.dragState.originalRow = note.row;
                
                // Select the note
                this.selectNote(noteId);
                e.stopPropagation();
            }
            return;
        }
        
        // Clicking on the grid - add a new note at click position
        const rect = this.container.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const cell = TokungakuApp.grid.getCellAtPosition(e.clientX, e.clientY);
        
        // Check if there's already a note at this position
        const existingNote = this.findNoteAtCell(cell.row, cell.col);
        if (existingNote) {
            // Select the existing note
            this.selectNote(existingNote.id);
        } else {
            // Create a new note
            const newNote = this.createNote(cell.row, cell.col, 1);
            this.selectNote(newNote.id);
        }
    },
    
    /**
     * Handle mouse move event for dragging notes
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove: function(e) {
        if (this.dragState.isDragging && this.dragState.noteId) {
            const note = this.findNoteById(this.dragState.noteId);
            if (!note) return;
            
            // Calculate drag distance in grid cells
            const deltaX = e.clientX - this.dragState.startX;
            const deltaY = e.clientY - this.dragState.startY;
            
            const colDelta = Math.round(deltaX / TokungakuApp.grid.cellWidth);
            const rowDelta = Math.round(deltaY / TokungakuApp.grid.cellHeight);
            
            // Calculate new position
            const newCol = this.dragState.originalCol + colDelta;
            const newRow = this.dragState.originalRow + rowDelta;
            
            // Check boundaries
            if (newRow >= 0 && newRow < TokungakuApp.config.rows &&
                newCol >= 0 && newCol + note.length <= TokungakuApp.config.columns) {
                note.row = newRow;
                note.col = newCol;
                this.renderNote(note);
                TokungakuApp.state.modified = true;
            }
        } else if (this.dragState.isResizing && this.dragState.noteId) {
            const note = this.findNoteById(this.dragState.noteId);
            if (!note) return;
            
            // Calculate resize amount in grid cells
            const deltaX = e.clientX - this.dragState.startX;
            const lengthDelta = Math.round(deltaX / TokungakuApp.grid.cellWidth);
            
            // Calculate new length
            const newLength = Math.max(1, this.dragState.originalLength + lengthDelta);
            
            // Check boundaries
            if (note.col + newLength <= TokungakuApp.config.columns) {
                note.length = newLength;
                this.renderNote(note);
                TokungakuApp.state.modified = true;
            }
        }
    },
    
    /**
     * Handle mouse up event to end drag/resize operations
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseUp: function(e) {
        // Reset drag state
        this.dragState.isDragging = false;
        this.dragState.isResizing = false;
        this.dragState.noteId = null;
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
        
        switch (e.key.toLowerCase()) {
            case 'a': // Add note
                this.addNoteAtCenter();
                e.preventDefault();
                break;
            
            case 'd': // Delete note
                this.deleteSelectedNote();
                e.preventDefault();
                break;
            
            case 'w': // Increase note length
                this.increaseSelectedNoteLength();
                e.preventDefault();
                break;
            
            case 's': // Decrease note length
                this.decreaseSelectedNoteLength();
                e.preventDefault();
                break;
            
            case 'arrowup': // Move note up
                this.moveSelectedNote(-1, 0);
                e.preventDefault();
                break;
            
            case 'arrowdown': // Move note down
                this.moveSelectedNote(1, 0);
                e.preventDefault();
                break;
            
            case 'arrowleft': // Move note left
                this.moveSelectedNote(0, -1);
                e.preventDefault();
                break;
            
            case 'arrowright': // Move note right
                this.moveSelectedNote(0, 1);
                e.preventDefault();
                break;
        }
    }
};