// app.js - Main application JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const lengthRange = document.getElementById('lengthRange');
  const lengthInput = document.getElementById('lengthInput');
  const lengthOptions = document.querySelectorAll('.length-option');
  const modeTabs = document.querySelectorAll('.mode-tab');
  const modeInput = document.getElementById('modeInput');
  const userTextArea = document.getElementById('user_text');
  const inputStats = document.getElementById('inputStats');
  const summarizeForm = document.getElementById('summarizeForm');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const copyBtn = document.getElementById('copyBtn');

  // ==================== Length Slider ====================
  function updateLengthUI(value) {
    lengthOptions.forEach(option => {
      option.classList.remove('active');
      if (option.getAttribute('data-value') === value) {
        option.classList.add('active');
      }
    });
  }

  if (lengthRange) {
    lengthRange.addEventListener('input', function(e) {
      const value = e.target.value;
      lengthInput.value = value;
      updateLengthUI(value);
    });

    // Initialize
    updateLengthUI(lengthRange.value);
  }

  // Click on length labels to update slider
  lengthOptions.forEach(option => {
    option.addEventListener('click', function() {
      const value = this.getAttribute('data-value');
      lengthRange.value = value;
      lengthInput.value = value;
      updateLengthUI(value);
    });
  });

  // ==================== Mode Tabs ====================
  modeTabs.forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active from all
      modeTabs.forEach(t => t.classList.remove('active'));
      
      // Add active to clicked
      this.classList.add('active');
      
      // Update hidden input
      const mode = this.getAttribute('data-mode');
      modeInput.value = mode;
    });
  });

  // ==================== Real-time Word Count ====================
  function updateWordCount() {
    const text = userTextArea.value.trim();
    
    // Count words (non-whitespace sequences)
    const words = text.length > 0 ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
    
    // Count characters
    const chars = text.length;
    
    // Update display
    if (inputStats) {
      inputStats.textContent = `${words} words • ${chars} characters`;
    }
  }

  if (userTextArea) {
    // Update on input
    userTextArea.addEventListener('input', updateWordCount);
    
    // Initial update if there's pre-filled text
    if (userTextArea.value.trim().length > 0) {
      updateWordCount();
    }
  }

  // ==================== Form Submission with Loading ====================
  if (summarizeForm) {
    summarizeForm.addEventListener('submit', function(e) {
      const text = userTextArea.value.trim();
      
      // Validation
      if (!text) {
        e.preventDefault();
        alert('Please enter some text to summarize.');
        return;
      }
      
      if (text.length > 10000) {
        e.preventDefault();
        alert('Text is too long. Maximum 10,000 characters allowed.');
        return;
      }
      
      // Show loading overlay
      if (loadingOverlay) {
        loadingOverlay.classList.add('active');
      }
      
      // Form will submit normally
    });
  }

  // ==================== Copy to Clipboard ====================
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      const summaryText = document.querySelector('.summary-output');
      
      if (summaryText) {
        const text = summaryText.textContent;
        
        // Modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
            .then(() => {
              showCopySuccess();
            })
            .catch(err => {
              console.error('Copy failed:', err);
              fallbackCopy(text);
            });
        } else {
          fallbackCopy(text);
        }
      }
    });
  }

  function showCopySuccess() {
    const icon = copyBtn.querySelector('i');
    const originalHTML = copyBtn.innerHTML;
    
    // Change button appearance
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    
    // Reset after 2 seconds
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = originalHTML;
    }, 2000);
  }

  function fallbackCopy(text) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      showCopySuccess();
    } catch (err) {
      alert('Failed to copy text. Please copy manually.');
    }
    
    document.body.removeChild(textArea);
  }

  // ==================== Initialize Bootstrap Tooltips ====================
  if (typeof $ !== 'undefined' && $.fn.tooltip) {
    $('[data-toggle="tooltip"]').tooltip();
  }

  // ==================== Auto-dismiss Alerts ====================
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      $(alert).fadeOut();
    }, 5000);
  });

  // ==================== Character Counter with Warning ====================
  if (userTextArea) {
    const maxChars = 10000;
    
    userTextArea.addEventListener('input', function() {
      const currentLength = this.value.length;
      const remaining = maxChars - currentLength;
      
      // You could add a character counter display here
      if (remaining < 500 && remaining > 0) {
        // Near limit - could add warning UI
        console.log(`${remaining} characters remaining`);
      } else if (remaining <= 0) {
        // At limit
        console.log('Character limit reached');
      }
    });
  }

  // ==================== Prevent Double Submission ====================
  let isSubmitting = false;
  
  if (summarizeForm) {
    summarizeForm.addEventListener('submit', function(e) {
      if (isSubmitting) {
        e.preventDefault();
        return false;
      }
      isSubmitting = true;
      
      // Re-enable after 3 seconds as fallback
      setTimeout(() => {
        isSubmitting = false;
      }, 3000);
    });
  }

  // ==================== Smooth Scroll to Output ====================
  // If summary exists on page load, scroll to it
  const summaryOutput = document.querySelector('.summary-output');
  if (summaryOutput && summaryOutput.textContent.trim().length > 0) {
    setTimeout(() => {
      summaryOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
  }

  // ==================== Keyboard Shortcuts ====================
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (document.activeElement === userTextArea) {
        e.preventDefault();
        summarizeForm.submit();
      }
    }
    
    // Ctrl/Cmd + K to focus text area
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      userTextArea.focus();
    }
  });

  console.log('✨ AI Summarizer loaded successfully!');
});