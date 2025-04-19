/**
 * Tokungaku - Tooltip System
 * 
 * This module provides custom tooltips for UI elements.
 */

TokungakuApp.tooltip = {
    tooltipElement: null,
    
    /**
     * Initialize the tooltip system
     */
    init: function() {
        // Create tooltip element
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'tooltip';
        this.tooltipElement.style.display = 'none';
        document.body.appendChild(this.tooltipElement);
        
        // Find all elements with a title attribute
        const elementsWithTooltip = document.querySelectorAll('[title]:not([data-tooltip-disabled])');
        
        // Set up tooltips for each element
        elementsWithTooltip.forEach(element => {
            const tooltipText = element.getAttribute('title');
            
            // Remove the default title to prevent default browser tooltip
            element.removeAttribute('title');
            
            // Store tooltip text in a custom attribute
            element.setAttribute('data-tooltip', tooltipText);
            
            // Add event listeners
            element.addEventListener('mouseenter', this.showTooltip.bind(this));
            element.addEventListener('mouseleave', this.hideTooltip.bind(this));
            element.addEventListener('mousemove', this.moveTooltip.bind(this));
            element.addEventListener('focus', this.showTooltip.bind(this));
            element.addEventListener('blur', this.hideTooltip.bind(this));
        });
        
        // Create a mutation observer to handle dynamically added elements
        this.setupMutationObserver();
    },
    
    /**
     * Set up a mutation observer to handle dynamically added elements
     */
    setupMutationObserver: function() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.hasAttribute('title') && !node.hasAttribute('data-tooltip-disabled')) {
                            const tooltipText = node.getAttribute('title');
                            node.removeAttribute('title');
                            node.setAttribute('data-tooltip', tooltipText);
                            
                            node.addEventListener('mouseenter', this.showTooltip.bind(this));
                            node.addEventListener('mouseleave', this.hideTooltip.bind(this));
                            node.addEventListener('mousemove', this.moveTooltip.bind(this));
                            node.addEventListener('focus', this.showTooltip.bind(this));
                            node.addEventListener('blur', this.hideTooltip.bind(this));
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },
    
    /**
     * Show tooltip when hovering over an element
     * @param {Event} e - Mouse event
     */
    showTooltip: function(e) {
        const element = e.target.closest('[data-tooltip]');
        if (!element) return;
        
        const tooltipText = element.getAttribute('data-tooltip');
        if (!tooltipText) return;
        
        // Set tooltip text
        this.tooltipElement.textContent = tooltipText;
        
        // Show tooltip
        this.tooltipElement.style.display = 'block';
        
        // Position tooltip
        this.positionTooltip(e);
    },
    
    /**
     * Hide tooltip when leaving an element
     */
    hideTooltip: function() {
        this.tooltipElement.style.display = 'none';
    },
    
    /**
     * Move tooltip with the mouse
     * @param {Event} e - Mouse event
     */
    moveTooltip: function(e) {
        this.positionTooltip(e);
    },
    
    /**
     * Position tooltip relative to mouse or element
     * @param {Event} e - Mouse event
     */
    positionTooltip: function(e) {
        const offset = 15; // Offset from cursor
        
        // Get tooltip dimensions
        const tooltipWidth = this.tooltipElement.offsetWidth;
        const tooltipHeight = this.tooltipElement.offsetHeight;
        
        // Calculate position
        let x = e.clientX + offset;
        let y = e.clientY + offset;
        
        // Adjust if tooltip would go off screen
        const rightEdge = window.innerWidth - tooltipWidth - 5;
        const bottomEdge = window.innerHeight - tooltipHeight - 5;
        
        if (x > rightEdge) {
            x = rightEdge;
        }
        
        if (y > bottomEdge) {
            y = e.clientY - tooltipHeight - offset;
        }
        
        // Set position
        this.tooltipElement.style.left = `${x}px`;
        this.tooltipElement.style.top = `${y}px`;
    }
};