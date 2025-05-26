// Citation Quote Modal System for Hollywood Regionalism

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Create modal structure
    const modalHTML = `
        <div id="quote-modal" class="quote-modal" aria-hidden="true" role="dialog" aria-labelledby="quote-modal-title">
            <div class="quote-modal-content">
                <button class="quote-modal-close" aria-label="Close quote modal">&times;</button>
                <h3 id="quote-modal-title" class="quote-modal-title">Source Quote</h3>
                <blockquote class="quote-modal-quote"></blockquote>
                <div class="quote-modal-citation"></div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal elements
    const modal = document.getElementById('quote-modal');
    const modalQuote = modal.querySelector('.quote-modal-quote');
    const modalCitation = modal.querySelector('.quote-modal-citation');
    const modalClose = modal.querySelector('.quote-modal-close');
    
    // Bibliography data will be embedded by the template
    const bibliography = window.BIBLIOGRAPHY_DATA || {};
    
    // Function to format citation
    function formatCitation(citation) {
        let formatted = '';
        
        if (citation.author) {
            formatted += citation.author + ', ';
        }
        
        if (citation.title) {
            formatted += '"' + citation.title + '," ';
        }
        
        formatted += '<em>' + citation.source + '</em>';
        
        if (citation.volume) {
            formatted += ', ' + citation.volume;
        }
        
        if (citation.number) {
            formatted += ', no. ' + citation.number;
        }
        
        if (citation.publisher) {
            formatted += ' (' + citation.location + ': ' + citation.publisher + ', ' + citation.year + ')';
        } else if (citation.date) {
            formatted += ' (' + citation.date + ')';
        }
        
        if (citation.page) {
            formatted += ', ' + citation.page;
        }
        
        formatted += '.';
        
        return formatted;
    }
    
    // Function to open modal
    function openModal(citationId) {
        const citation = bibliography[citationId];
        
        if (!citation || !citation.quote) {
            console.error('Citation or quote not found:', citationId);
            return;
        }
        
        // Set content
        modalQuote.textContent = citation.quote;
        modalCitation.innerHTML = formatCitation(citation);
        
        // Show modal
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus on close button for accessibility
        modalClose.focus();
        
        // Trap focus within modal
        document.addEventListener('keydown', trapFocus);
    }
    
    // Function to close modal
    function closeModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        
        // Remove focus trap
        document.removeEventListener('keydown', trapFocus);
        
        // Return focus to the button that opened the modal
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }
    
    // Track last focused element
    let lastFocusedElement;
    
    // Focus trap for accessibility
    function trapFocus(e) {
        if (e.key === 'Escape') {
            closeModal();
            return;
        }
        
        if (e.key !== 'Tab') return;
        
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
    
    // Add click handlers to all quote buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-quote-btn')) {
            e.preventDefault();
            lastFocusedElement = e.target;
            const citationId = e.target.getAttribute('data-citation-id');
            openModal(citationId);
        }
    });
    
    // Close modal handlers
    modalClose.addEventListener('click', closeModal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close on Escape key (handled in trapFocus)
});