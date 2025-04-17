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
        
        // Initialize grid appearance controls
        this.initGridAppearance();

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

            // Update instrument
            if (projectData.config.instrument) {
                const instrumentSelect = document.getElementById('instrument-select');
                instrumentSelect.value = projectData.config.instrument;
                
                // Also update the actual instrument in the audio engine
                if (TokungakuApp.audio && typeof TokungakuApp.audio.selectInstrument === 'function') {
                    TokungakuApp.audio.selectInstrument(projectData.config.instrument);
                }
            }
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

        // Load grid appearance settings
        if (projectData.config && projectData.config.gridColor) {
            document.documentElement.style.setProperty('--grid-color', projectData.config.gridColor);
            document.documentElement.style.setProperty('--grid-line-color', projectData.config.gridLineColor);
            
            // Update the color picker and opacity slider
            const rgb = projectData.config.gridColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
            if (rgb) {
                const hexColor = rgbToHex(parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3]));
                const opacity = Math.round(parseFloat(rgb[4]) * 100);
                
                document.getElementById('grid-color').value = hexColor;
                document.getElementById('grid-opacity').value = opacity;
                document.getElementById('opacity-value').textContent = `${opacity}%`;
            }
        }
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
    },

    /**
     * Initialize grid appearance controls
     */
    initGridAppearance: function() {
        const colorPicker = document.getElementById('grid-color');
        const opacitySlider = document.getElementById('grid-opacity');
        const opacityValue = document.getElementById('opacity-value');
        
        // Set initial values
        const initialColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-color');
        
        // Extract opacity from rgba value or use default
        let opacity = 20;
        if (initialColor.includes('rgba')) {
            const match = initialColor.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
            if (match && match[1]) {
                opacity = Math.round(parseFloat(match[1]) * 100);
            }
        }
        
        // Initialize opacity slider
        opacitySlider.value = opacity;
        opacityValue.textContent = `${opacity}%`;
        
        // Extract color from rgba and convert to hex
        if (initialColor.includes('rgb')) {
            const rgbaMatch = initialColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/);
            if (rgbaMatch) {
                const r = parseInt(rgbaMatch[1]);
                const g = parseInt(rgbaMatch[2]);
                const b = parseInt(rgbaMatch[3]);
                const hexColor = rgbToHex(r, g, b);
                colorPicker.value = hexColor;
            }
        }
        
        // Set up event listeners
        colorPicker.addEventListener('input', this.updateGridColor.bind(this));
        opacitySlider.addEventListener('input', this.updateGridOpacity.bind(this));
    },

    /**
     * Update grid color based on color picker
     * @param {Event} e - Input event
     */
    updateGridColor: function(e) {
        const colorHex = e.target.value;
        const opacity = document.getElementById('grid-opacity').value / 100;
        
        // Convert hex to rgb
        const rgb = hexToRgb(colorHex);
        const rgbaColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        const rgbaLineColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(opacity + 0.2, 1)})`;
        
        // Update CSS variables
        document.documentElement.style.setProperty('--grid-color', rgbaColor);
        document.documentElement.style.setProperty('--grid-line-color', rgbaLineColor);
        
        // Store in app config
        TokungakuApp.config.gridColor = rgbaColor;
        TokungakuApp.config.gridLineColor = rgbaLineColor;
        TokungakuApp.state.modified = true;
    },

    /**
     * Update grid opacity based on slider
     * @param {Event} e - Input event
     */
    updateGridOpacity: function(e) {
        const opacity = e.target.value / 100;
        const colorHex = document.getElementById('grid-color').value;
        const rgb = hexToRgb(colorHex);
        
        // Update opacity value display
        document.getElementById('opacity-value').textContent = `${e.target.value}%`;
        
        // Create new rgba strings
        const rgbaColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        const rgbaLineColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(opacity + 0.2, 1)})`;
        
        // Update CSS variables
        document.documentElement.style.setProperty('--grid-color', rgbaColor);
        document.documentElement.style.setProperty('--grid-line-color', rgbaLineColor);
        
        // Store in app config
        TokungakuApp.config.gridColor = rgbaColor;
        TokungakuApp.config.gridLineColor = rgbaLineColor;
        TokungakuApp.state.modified = true;
    },
};

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Parse hex values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    
    return { r, g, b };
}

// Helper function to convert RGB to hex
function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}