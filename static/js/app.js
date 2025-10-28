// app.js - Main application JavaScript with Dark Mode

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
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  // ==================== Dark/Light Mode Toggle ====================
  
  // Check for saved theme preference or default to 'light'
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  // Theme toggle click handler
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      let theme = document.documentElement.getAttribute('data-theme');
      let newTheme = theme === 'dark' ? 'light' : 'dark';
      
      // Add animation class
      themeToggle.style.transform = 'translateY(-50%) rotate(360deg)';
      
      setTimeout(() => {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        themeToggle.style.transform = 'translateY(-50%) rotate(0deg)';
      }, 150);
    });
  }

  function updateThemeIcon(theme) {
    if (themeIcon) {
      if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun';
      } else {
        themeIcon.className = 'fas fa-moon';
      }
    }
  }

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
      
      // Add warning color if approaching limit
      if (chars > 9000) {
        inputStats.style.color = '#ef4444';
        inputStats.style.fontWeight = '700';
      } else if (chars > 7500) {
        inputStats.style.color = '#f59e0b';
        inputStats.style.fontWeight = '600';
      } else {
        inputStats.style.color = '';
        inputStats.style.fontWeight = '';
      }
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
        showNotification('Please enter some text to summarize.', 'error');
        return;
      }
      
      if (text.length > 10000) {
        e.preventDefault();
        showNotification('Text is too long. Maximum 10,000 characters allowed.', 'error');
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
      showNotification('Failed to copy text. Please copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
  }

  // ==================== Notification System ====================
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : 'success'} notification-toast`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
      ${message}
    `;
    
    // Add styles for toast notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      min-width: 300px;
      max-width: 500px;
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 4000);
  }

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // ==================== Initialize Bootstrap Tooltips ====================
  if (typeof $ !== 'undefined' && $.fn.tooltip) {
    $('[data-toggle="tooltip"]').tooltip();
  }

  // ==================== Auto-dismiss Alerts ====================
  const alerts = document.querySelectorAll('.alert:not(.notification-toast)');
  alerts.forEach(alert => {
    setTimeout(() => {
      if (typeof $ !== 'undefined') {
        $(alert).fadeOut();
      } else {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
      }
    }, 5000);
  });

  // ==================== Character Counter with Warning ====================
  if (userTextArea) {
    const maxChars = 10000;
    
    userTextArea.addEventListener('input', function() {
      const currentLength = this.value.length;
      const remaining = maxChars - currentLength;
      
      // Update border color based on remaining characters
      if (remaining < 500 && remaining > 0) {
        this.style.borderColor = '#f59e0b';
      } else if (remaining <= 0) {
        this.style.borderColor = '#ef4444';
      } else {
        this.style.borderColor = '';
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
    
    // Ctrl/Cmd + D to toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      themeToggle.click();
    }
  });

  // ==================== Add Entrance Animations ====================
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.card, .controls-card, .features-section');
    
    elements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const elementBottom = element.getBoundingClientRect().bottom;
      
      // Check if element is in viewport
      if (elementTop < window.innerHeight && elementBottom > 0) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }
    });
  };

  // Initial check
  animateOnScroll();
  
  // Check on scroll
  window.addEventListener('scroll', animateOnScroll);

  // ==================== Theme Transition Effect ====================
  // Add smooth transition when changing themes
  document.documentElement.style.transition = 'background 0.5s ease, color 0.3s ease';

  console.log('✨ AI Summarizer loaded successfully!');
  console.log('💡 Keyboard shortcuts:');
  console.log('   • Ctrl/Cmd + Enter: Submit form');
  console.log('   • Ctrl/Cmd + K: Focus text area');
  console.log('   • Ctrl/Cmd + D: Toggle dark mode');
});