/**
 * Tokungaku - UI Management
 * 
 * This module handles user interface interactions and image management.
 */

TokungakuApp.ui = {
    // DOM elements
    imageContainer: null,
    uploadInput: null,
    
    /**
     * Initialize the UI system
     */
    init: function() {
        this.imageContainer = document.getElementById('image-container');
        this.uploadInput = document.getElementById('image-upload');
        
        // Set up event listeners
        document.getElementById('upload-image-btn').addEventListener('click', this.triggerImageUpload.bind(this));
        document.getElementById('remove-image-btn').addEventListener('click', this.removeImage.bind(this));
        this.uploadInput.addEventListener('change', this.handleImageUpload.bind(this));
        
        // Window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    },
    
    /**
     * Trigger the file input dialog for image upload
     */
    triggerImageUpload: function() {
        this.uploadInput.click();
    },
    
    /**
     * Handle image upload from file input
     * @param {Event} e - Change event
     */
    handleImageUpload: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.match('image.*')) {
            alert('Please select an image file.');
            return;
        }
        
        // Create file reader
        const reader = new FileReader();
        
        reader.onload = (event) => {
            // Create image element
            const img = document.createElement('img');
            img.src = event.target.result;
            
            // Wait for image to load to get dimensions
            img.onload = () => {
                // Clear existing image
                this.imageContainer.innerHTML = '';
                this.imageContainer.appendChild(img);
                
                // Store image data in application state
                TokungakuApp.state.currentImage = event.target.result;
                TokungakuApp.state.modified = true;
                
                // Update grid dimensions based on image height
                this.updateGridDimensions();
                
                // Enable remove button
                document.getElementById('remove-image-btn').disabled = false;
            };
        };
        
        // Read file as data URL
        reader.readAsDataURL(file);
    },
    
    /**
     * Remove the current image
     */
    removeImage: function() {
        // Clear image container
        this.imageContainer.innerHTML = '';
        
        // Reset application state
        TokungakuApp.state.currentImage = null;
        TokungakuApp.state.modified = true;
        
        // Disable remove button
        document.getElementById('remove-image-btn').disabled = true;
        
        // Reset grid dimensions
        this.updateGridDimensions();
    },
    
    /**
     * Update grid dimensions based on image size
     */
    updateGridDimensions: function() {
        // Calculate grid height based on image
        let editorHeight = 480; // Default height if no image
        
        if (this.imageContainer.firstChild) {
            const img = this.imageContainer.firstChild;
            const aspectRatio = img.naturalHeight / img.naturalWidth;
            editorHeight = TokungakuApp.config.editorWidth * aspectRatio;
        }
        
        // Set editor height
        document.getElementById('editor-area').style.height = `${editorHeight}px`;
        
        // Update grid
        TokungakuApp.grid.calculateDimensions();
        TokungakuApp.grid.render();
        
        // Update notes
        TokungakuApp.notes.renderAll();
    },
    
    /**
     * Handle window resize event
     */
    handleResize: function() {
        this.updateGridDimensions();
    },
    
    /**
     * Load a project from saved data
     * @param {Object} projectData - Project data to load
     */
    loadProject: function(projectData) {
        if (!projectData) return;
        
        // Update configuration
        if (projectData.config) {
            // Update columns
            TokungakuApp.config.columns = projectData.config.columns || 32;
            document.getElementById('steps').value = TokungakuApp.config.columns;
            
            // Update BPM
            TokungakuApp.config.bpm = projectData.config.bpm || 120;
            document.getElementById('bpm').value = TokungakuApp.config.bpm;
        }
        
        // Load notes
        TokungakuApp.state.notes = [];
        if (Array.isArray(projectData.notes)) {
            // Find the highest note ID to set nextNoteId correctly
            let maxId = 0;
            projectData.notes.forEach(note => {
                const idMatch = note.id.match(/note-(\d+)/);
                if (idMatch && parseInt(idMatch[1]) > maxId) {
                    maxId = parseInt(idMatch[1]);
                }
                
                TokungakuApp.state.notes.push(note);
            });
            
            // Set next note ID
            TokungakuApp.notes.nextNoteId = maxId + 1;
        }
        
        // Load image
        if (projectData.image) {
            this.loadImage(projectData.image);
        } else {
            this.removeImage();
        }
        
        // Clear selected note
        TokungakuApp.notes.selectNote(null);
        
        // Update grid
        TokungakuApp.grid.calculateDimensions();
        TokungakuApp.grid.render();
        
        // Render notes
        TokungakuApp.notes.renderAll();
        
        // Mark as unmodified
        TokungakuApp.state.modified = false;
    },
    
    /**
     * Load an image from a data URL
     * @param {string} dataUrl - Image data URL
     */
    loadImage: function(dataUrl) {
        // Create image element
        const img = document.createElement('img');
        img.src = dataUrl;
        
        // Wait for image to load to get dimensions
        img.onload = () => {
            // Clear existing image
            this.imageContainer.innerHTML = '';
            this.imageContainer.appendChild(img);
            
            // Store image data in application state
            TokungakuApp.state.currentImage = dataUrl;
            
            // Update grid dimensions based on image height
            this.updateGridDimensions();
            
            // Enable remove button
            document.getElementById('remove-image-btn').disabled = false;
        };
    }
};