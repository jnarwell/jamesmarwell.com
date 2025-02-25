// bio.js - Handles bio page functionality and communication with main page

document.addEventListener('DOMContentLoaded', () => {
    initBioPage();
});

function initBioPage() {
    // Check if this is a frame or direct page load
    const isDirectLoad = window.self === window.top;
    
    // Set up close button behavior
    const closeButton = document.getElementById('bio-close-button');
    closeButton.addEventListener('click', handleClose);
    
    // Add click outside to close functionality
    const bioContainer = document.getElementById('bio-container');
    const bioContent = document.getElementById('bio-content');
    
    if (bioContainer) {
        bioContainer.addEventListener('mousedown', (event) => {
            // Only close if clicked directly on the container background
            if (event.target === bioContainer) {
                handleClose();
            }
        });
    }
    
    // Listen for progress updates from main page
    window.addEventListener('message', (event) => {
        const data = event.data;
        
        if (data.type === 'loadingProgress') {
            updateLoadingProgress(data.percent);
        }
    });
    
    // Check if user is returning and auto-close if models are loaded
    if (hasVisitedBefore() && isDirectLoad) {
        // Add a parameter to URL to indicate we should skip bio
        window.location.href = '/index.html?skipBio=true';
    }
}

// Centralized close handling
function handleClose() {
    console.log('Close triggered');
    const isDirectLoad = window.self === window.top;
    
    if (isDirectLoad) {
        // If opened directly, navigate to main page
        window.location.href = '/index.html';
    } else {
        // If in iframe, tell parent to close
        window.parent.postMessage({ type: 'closeBio' }, '*');
    }
    
    // Mark as visited so bio won't show next time
    markAsVisited();
}

function updateLoadingProgress(percent) {
    const progressBar = document.getElementById('loading-progress-bar');
    const percentageText = document.getElementById('loading-percentage');
    
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
    
    if (percentageText) {
        percentageText.textContent = `${Math.round(percent)}%`;
    }
}

function markAsVisited() {
    try {
        localStorage.setItem('hasVisitedBefore', 'true');
    } catch (e) {
        // Handle localStorage error silently
        console.warn('Could not save visit status to localStorage');
    }
}

function hasVisitedBefore() {
    try {
        return localStorage.getItem('hasVisitedBefore') === 'true';
    } catch (e) {
        // In case localStorage is disabled
        return false;
    }
}