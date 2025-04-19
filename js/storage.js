/**
 * Tokungaku - Storage Management
 * 
 * This module handles file-based import/export of the application state.
 */

TokungakuApp.storage = {
    // Maximum image size in bytes (10MB)
    MAX_IMAGE_SIZE: 10 * 1024 * 1024,
    
    /**
     * Initialize storage system
     */
    init: function() {
        // Set up event listeners for export/import operations
        document.getElementById('save-project-btn').addEventListener('click', this.exportProject.bind(this));
        document.getElementById('load-project-btn').addEventListener('click', this.importProject.bind(this));
        
        // Create a hidden file input for project import
        this.createImportInput();
    },
    
    /**
     * Create hidden file input for project import
     */
    createImportInput: function() {
        // Create file input if it doesn't exist
        if (!document.getElementById('project-import')) {
            const input = document.createElement('input');
            input.type = 'file';
            input.id = 'project-import';
            input.accept = '.json';
            input.style.display = 'none';
            input.addEventListener('change', this.handleProjectFileSelect.bind(this));
            document.body.appendChild(input);
        }
    },
    
    /**
     * Export current project to JSON file
     */
    exportProject: function() {
        // Prompt user for project name
        const projectName = prompt('Enter a name for your project:', 'My Tokungaku Project');
        if (!projectName) return; // User cancelled
        
        // Create a serializable representation of the state
        const projectData = {
            name: projectName,
            config: {
                columns: TokungakuApp.config.columns,
                bpm: TokungakuApp.config.bpm,
                gridColor: TokungakuApp.config.gridColor,
                gridLineColor: TokungakuApp.config.gridLineColor,
                instrument: document.getElementById('instrument-select').value
            },
            notes: TokungakuApp.state.notes,
            image: TokungakuApp.state.currentImage,
            savedAt: new Date().toISOString()
        };
        
        try {
            // Convert to JSON string
            const jsonData = JSON.stringify(projectData, null, 2);
            
            // Create a blob with the JSON data
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            // Create a URL for the blob
            const url = URL.createObjectURL(blob);
            
            // Create a download link
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
            
            // Append to document, click, and remove
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Release the URL object
            URL.revokeObjectURL(url);
            
            console.log('Project exported successfully');
        } catch (e) {
            console.error('Failed to export project:', e);
            alert('Failed to export project: ' + e.message);
        }
    },
    
    /**
     * Import project from JSON file
     */
    importProject: function() {
        // Trigger the hidden file input
        const input = document.getElementById('project-import');
        if (input) {
            input.click();
        } else {
            this.createImportInput();
            document.getElementById('project-import').click();
        }
    },
    
    /**
     * Handle file selection for project import
     * @param {Event} e - Change event
     */
    handleProjectFileSelect: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            alert('Please select a JSON file.');
            e.target.value = ''; // Reset input
            return;
        }
        
        // Check if there are unsaved changes
        if (TokungakuApp.state.modified) {
            const confirmImport = confirm('You have unsaved changes. Are you sure you want to import a new project?');
            if (!confirmImport) {
                e.target.value = ''; // Reset input
                return;
            }
        }
        
        // Read file
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const projectData = JSON.parse(event.target.result);
                
                // Validate project data
                if (!projectData || !projectData.config || !Array.isArray(projectData.notes)) {
                    throw new Error('Invalid project file format.');
                }
                
                // Check image size if present
                if (projectData.image) {
                    const estimatedSize = this.estimateBase64Size(projectData.image);
                    if (estimatedSize > this.MAX_IMAGE_SIZE) {
                        const confirmLargeImage = confirm(
                            'The image in this project is quite large (approximately ' + 
                            Math.round(estimatedSize / (1024 * 1024)) + 
                            ' MB). This may cause performance issues. Continue anyway?'
                        );
                        
                        if (!confirmLargeImage) {
                            e.target.value = ''; // Reset input
                            return;
                        }
                    }
                }
                
                // Load the project
                TokungakuApp.ui.loadProject(projectData);
                
                alert(`Project "${projectData.name}" loaded successfully.`);
            } catch (err) {
                console.error('Failed to parse project file:', err);
                alert('Failed to load project: ' + err.message);
            }
            
            e.target.value = ''; // Reset input for future imports
        };
        
        reader.onerror = () => {
            alert('Error reading file.');
            e.target.value = ''; // Reset input
        };
        
        reader.readAsText(file);
    },
    
    /**
     * Estimate the size of a base64 encoded string in bytes
     * @param {string} base64String - Base64 encoded string
     * @returns {number} Estimated size in bytes
     */
    estimateBase64Size: function(base64String) {
        // Remove metadata part if present (e.g., "data:image/png;base64,")
        const base64Data = base64String.split(',')[1] || base64String;
        
        // Calculate size: base64 represents 6 bits in 8 bits (4 chars = 3 bytes)
        // Add padding to handle strings that aren't multiples of 4
        const paddedLength = base64Data.length + (4 - (base64Data.length % 4)) % 4;
        
        // Calculate size in bytes
        return Math.floor((paddedLength / 4) * 3);
    }
};