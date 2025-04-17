/**
 * Tokungaku - Storage Management
 * 
 * This module handles local storage of the application state.
 */

TokungakuApp.storage = {
    // Storage keys
    STORAGE_KEY: 'tokungaku_app_state',
    
    /**
     * Initialize storage system
     */
    init: function() {
        // Check if local storage is available
        if (!this.isLocalStorageAvailable()) {
            console.warn('Local storage is not available. Your work will not be saved automatically.');
            return;
        }
        
        // Set up event listeners for save/load operations
        document.getElementById('save-project-btn').addEventListener('click', this.saveProject.bind(this));
        document.getElementById('load-project-btn').addEventListener('click', this.loadProject.bind(this));
    },
    
    /**
     * Check if local storage is available
     * @returns {boolean} True if local storage is available
     */
    isLocalStorageAvailable: function() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    /**
     * Save current application state to local storage
     */
    saveSession: function() {
        if (!this.isLocalStorageAvailable()) return;
        
        // Create a serializable representation of the state
        const appState = {
            config: {
                columns: TokungakuApp.config.columns,
                bpm: TokungakuApp.config.bpm,
                // Add these lines
                gridColor: TokungakuApp.config.gridColor,
                gridLineColor: TokungakuApp.config.gridLineColor,
                instrument: document.getElementById('instrument-select').value
            },
            notes: TokungakuApp.state.notes,
            image: TokungakuApp.state.currentImage,
            lastSaved: new Date().toISOString()
        };
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(appState));
            TokungakuApp.state.modified = false;
            console.log('Session saved successfully');
        } catch (e) {
            console.error('Failed to save session:', e);
        }
    },
    
    /**
     * Load application state from local storage
     * @returns {Object|null} The loaded state or null if not available
     */
    loadLastSession: function() {
        if (!this.isLocalStorageAvailable()) return null;
        
        try {
            const savedState = localStorage.getItem(this.STORAGE_KEY);
            if (!savedState) return null;
            
            return JSON.parse(savedState);
        } catch (e) {
            console.error('Failed to load session:', e);
            return null;
        }
    },
    
    /**
     * Save current project with a name
     */
    saveProject: function() {
        if (!this.isLocalStorageAvailable()) {
            alert('Local storage is not available. Cannot save project.');
            return;
        }
        
        // Prompt user for project name
        const projectName = prompt('Enter a name for your project:', 'My Tokungaku Project');
        if (!projectName) return; // User cancelled
        
        // Create a serializable representation of the state
        const projectData = {
            name: projectName,
            config: {
                columns: TokungakuApp.config.columns,
                bpm: TokungakuApp.config.bpm,
                // Add these lines
                gridColor: TokungakuApp.config.gridColor,
                gridLineColor: TokungakuApp.config.gridLineColor,
                instrument: document.getElementById('instrument-select').value
            },
            notes: TokungakuApp.state.notes,
            image: TokungakuApp.state.currentImage,
            savedAt: new Date().toISOString()
        };
        
        try {
            // Get existing projects
            let projects = JSON.parse(localStorage.getItem('tokungaku_projects') || '[]');
            
            // Check if a project with this name already exists
            const existingIndex = projects.findIndex(p => p.name === projectName);
            if (existingIndex >= 0) {
                const overwrite = confirm(`A project named "${projectName}" already exists. Overwrite it?`);
                if (overwrite) {
                    projects[existingIndex] = projectData;
                } else {
                    return; // User cancelled
                }
            } else {
                projects.push(projectData);
            }
            
            // Save projects
            localStorage.setItem('tokungaku_projects', JSON.stringify(projects));
            
            // Also save as current session
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projectData));
            
            TokungakuApp.state.modified = false;
            alert(`Project "${projectName}" saved successfully.`);
        } catch (e) {
            console.error('Failed to save project:', e);
            alert('Failed to save project: ' + e.message);
        }
    },
    
    /**
     * Load a saved project
     */
    loadProject: function() {
        if (!this.isLocalStorageAvailable()) {
            alert('Local storage is not available. Cannot load projects.');
            return;
        }
        
        try {
            // Get existing projects
            const projects = JSON.parse(localStorage.getItem('tokungaku_projects') || '[]');
            
            if (projects.length === 0) {
                alert('No saved projects found.');
                return;
            }
            
            // Create a selection list
            let options = '';
            projects.forEach((project, index) => {
                const date = new Date(project.savedAt).toLocaleString();
                options += `<option value="${index}">${project.name} (${date})</option>`;
            });
            
            // Create a temporary select dialog
            const selectDiv = document.createElement('div');
            selectDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
            selectDiv.innerHTML = `
                <div style="background:#fff;padding:20px;border-radius:5px;max-width:500px;width:90%;">
                    <h3>Load Project</h3>
                    <p>Select a project to load:</p>
                    <select id="project-select" style="width:100%;margin:10px 0;padding:5px;">
                        ${options}
                    </select>
                    <div style="display:flex;justify-content:space-between;margin-top:15px;">
                        <button id="cancel-load">Cancel</button>
                        <button id="confirm-load" style="background-color:var(--primary-color);color:#fff;">Load</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(selectDiv);
            
            // Handle cancel button
            document.getElementById('cancel-load').addEventListener('click', () => {
                document.body.removeChild(selectDiv);
            });
            
            // Handle load button
            document.getElementById('confirm-load').addEventListener('click', () => {
                const select = document.getElementById('project-select');
                const selectedIndex = parseInt(select.value);
                const projectData = projects[selectedIndex];
                
                // Load the project
                TokungakuApp.ui.loadProject(projectData);
                
                // Save as current session
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projectData));
                
                document.body.removeChild(selectDiv);
                alert(`Project "${projectData.name}" loaded successfully.`);
            });
        } catch (e) {
            console.error('Failed to load projects:', e);
            alert('Failed to load projects: ' + e.message);
        }
    },
    
    /**
     * Delete a saved project
     * @param {string} projectName - Name of the project to delete
     * @returns {boolean} True if project was deleted successfully
     */
    deleteProject: function(projectName) {
        if (!this.isLocalStorageAvailable()) return false;
        
        try {
            // Get existing projects
            let projects = JSON.parse(localStorage.getItem('tokungaku_projects') || '[]');
            
            // Find the project
            const projectIndex = projects.findIndex(p => p.name === projectName);
            if (projectIndex === -1) return false;
            
            // Remove the project
            projects.splice(projectIndex, 1);
            
            // Save updated projects list
            localStorage.setItem('tokungaku_projects', JSON.stringify(projects));
            
            return true;
        } catch (e) {
            console.error('Failed to delete project:', e);
            return false;
        }
    }
};