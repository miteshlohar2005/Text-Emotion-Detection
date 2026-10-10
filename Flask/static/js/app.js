/**
 * EmotionAI — Application Workspace Controller
 * Handles user interactions, form validation, AJAX predictions, result rendering,
 * sample presets, accessibility modals, and sync with the neural visualization.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('prediction-form');
    const textarea = document.getElementById('textfield');
    const predictBtn = document.getElementById('predict-button');
    const clearBtn = document.getElementById('clear-button');
    const charCounter = document.getElementById('char-count');
    const wordCounter = document.getElementById('word-count');
    const errorBanner = document.getElementById('error-banner');
    const resultsContainer = document.getElementById('results-container');
    const emptyState = document.getElementById('empty-state');
    const sampleChips = document.querySelectorAll('.sample-chip');

    // Modals
    const modalButtons = document.querySelectorAll('[data-modal-target]');
    const modals = document.querySelectorAll('.ai-modal');
    const modalCloses = document.querySelectorAll('.modal-close, .modal-backdrop');

    // Initialize Canvas Visualization
    let viz = null;
    if (typeof window.EmotionVisualization === 'function') {
      viz = new window.EmotionVisualization('neural-canvas', 'visualization-panel');
      window.activeViz = viz;

      // Check if server already passed a result (on standard form POST fallback)
      const initialResultElem = document.getElementById('initial-result-data');
      if (initialResultElem) {
        try {
          const initData = JSON.parse(initialResultElem.textContent);
          if (initData && initData.label) {
            viz.setActiveEmotion(initData.label, initData.confidence);
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    }

    // 1. Text Counter Management
    const updateCounters = () => {
      if (!textarea) return;
      const text = textarea.value;
      const length = text.length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;

      if (charCounter) charCounter.textContent = `${length} / 500`;
      if (wordCounter) wordCounter.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;

      if (length > 500) {
        charCounter.classList.add('limit-exceeded');
      } else {
        charCounter.classList.remove('limit-exceeded');
      }
    };

    if (textarea) {
      textarea.addEventListener('input', updateCounters);
      updateCounters();

      // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to submit
      textarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          form.requestSubmit();
        }
      });
    }

    // 2. Sample Chips Preset Handler
    sampleChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-sample') || '';
        if (textarea) {
          textarea.value = text;
          updateCounters();
          textarea.focus();
          hideError();
        }
      });
    });

    // Handle canvas node click event
    window.addEventListener('emotionNodeSelected', (e) => {
      const emotion = e.detail ? e.detail.emotion : null;
      const sampleMap = {
        joy: 'I was just promoted and I am overwhelmed with joy and pride!',
        sadness: 'I feel deeply heartbroken and miss everyone I love so much.',
        anger: 'This is completely unacceptable and I am infuriated by this betrayal.',
        love: 'I truly adore spending every quiet moment with you, my darling.',
        fear: 'I woke up in pitch black darkness trembling with cold dread and panic.'
      };
      if (emotion && sampleMap[emotion] && textarea) {
        textarea.value = sampleMap[emotion];
        updateCounters();
        textarea.focus();
        hideError();
      }
    });

    // 3. Clear Button: Resets input and returns results to empty state
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (textarea) {
          textarea.value = '';
          updateCounters();
          textarea.focus();
        }
        hideError();
        resetToEmptyState();
        if (viz) viz.setActiveEmotion(null, null);
      });
    }

    // 4. Form Submission & AJAX Prediction Flow
    if (form) {
      form.addEventListener('submit', async (e) => {
        const text = textarea ? textarea.value.trim() : '';

        // Validation: Empty text
        if (!text) {
          e.preventDefault();
          showError('Please enter some text before analyzing emotion.');
          if (textarea) textarea.focus();
          return;
        }

        // If fetch is available, perform async analysis for seamless real-time response
        if (window.fetch) {
          e.preventDefault();
          hideError();
          setLoadingState(true);

          try {
            const response = await fetch(form.action || '/predict', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
              },
              body: JSON.stringify({ textfield: text })
            });

            const data = await response.json();

            if (!response.ok || data.status === 'error') {
              throw new Error(data.error || 'The model was unable to analyze this text.');
            }

            // Render prediction result dynamically without page reload or scrolling
            renderResults(data.result);

            // Synchronize with canvas visualization
            if (viz && data.result) {
              viz.setActiveEmotion(data.result.raw_label || data.result.label, data.result.confidence);
            }
          } catch (err) {
            showError(err.message || 'Network or inference error occurred. Please try again.');
          } finally {
            setLoadingState(false);
          }
        } else {
          // Standard form submission fallback
          setLoadingState(true);
        }
      });
    }

    // 5. Results Renderer
    function renderResults(result) {
      if (!result || !resultsContainer) return;

      const primaryEmotion = result.label || 'Unknown';
      const confidence = typeof result.confidence === 'number' ? result.confidence.toFixed(2) : '--';
      const scores = result.scores || [];

      // Build compact rows for all 5 emotions
      let barsHtml = '';
      scores.forEach((s) => {
        const isWinner = s.emotion.toLowerCase() === primaryEmotion.toLowerCase();
        const scoreVal = typeof s.score === 'number' ? s.score : 0;
        const formattedVal = scoreVal.toFixed(2);

        barsHtml += `
          <div class="emotion-metric-row ${isWinner ? 'metric-winner' : ''}" role="listitem">
            <div class="metric-meta">
              <span class="metric-name">
                ${isWinner ? '<span class="winner-indicator" aria-hidden="true">&#9658;</span> ' : ''}${escapeHtml(s.emotion)}
              </span>
              <span class="metric-percent">${formattedVal}%</span>
            </div>
            <div class="progress-track" role="progressbar" aria-valuenow="${formattedVal}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(s.emotion)} score">
              <div class="progress-bar-fill" style="width: ${Math.min(scoreVal, 100)}%;"></div>
            </div>
          </div>
        `;
      });

      const resultHtml = `
        <div class="results-card reveal-animation" id="active-results" aria-live="polite">
          <div class="card-eyebrow-row">
            <span class="technical-label">INFERENCE RESULT // 5-CLASS PROBABILITY DISTRIBUTION</span>
            <span class="status-indicator-badge">EVALUATED</span>
          </div>

          <div class="primary-prediction-block">
            <div class="prediction-header">
              <span class="primary-emotion-label">${escapeHtml(primaryEmotion)}</span>
              <div class="confidence-tag">
                <span class="tag-title">ACTIVATION CONFIDENCE</span>
                <span class="tag-value">${confidence}%</span>
              </div>
            </div>
            <p class="scientific-disclaimer">
              Calculated via normalized softmax activation distribution outputted by the LSTM recurrent layer.
            </p>
          </div>

          <div class="probability-distribution-grid" role="list" aria-label="Class probability distribution">
            ${barsHtml}
          </div>

          <div class="technical-footnote">
            <span>SEQUENCE PADDING: 35 TOKENS</span>
            <span>VOCABULARY FILTER: WORDNET LEMMATIZER</span>
          </div>
        </div>
      `;

      if (emptyState) emptyState.style.display = 'none';
      resultsContainer.innerHTML = resultHtml;
      resultsContainer.hidden = false;

      // Animate progress bars smoothly after injection
      requestAnimationFrame(() => {
        const fills = resultsContainer.querySelectorAll('.progress-bar-fill');
        fills.forEach((fill) => {
          const targetWidth = fill.style.width;
          fill.style.width = '0%';
          setTimeout(() => {
            fill.style.width = targetWidth;
          }, 40);
        });
      });
    }

    function resetToEmptyState() {
      if (resultsContainer) {
        resultsContainer.innerHTML = '';
        resultsContainer.hidden = true;
      }
      if (emptyState) {
        emptyState.style.display = 'flex';
      }
    }

    // 6. Loading State Controller
    function setLoadingState(isLoading) {
      if (!predictBtn) return;
      const btnText = predictBtn.querySelector('.btn-text');
      const btnSpinner = predictBtn.querySelector('.btn-spinner');

      if (isLoading) {
        predictBtn.disabled = true;
        predictBtn.classList.add('loading');
        if (btnText) btnText.textContent = 'Evaluating...';
        if (btnSpinner) btnSpinner.hidden = false;
        if (textarea) textarea.classList.add('scanning-active');
      } else {
        predictBtn.disabled = false;
        predictBtn.classList.remove('loading');
        if (btnText) btnText.textContent = 'Analyze Emotion';
        if (btnSpinner) btnSpinner.hidden = true;
        if (textarea) textarea.classList.remove('scanning-active');
      }
    }

    // 7. Error Banner Controller (does not scroll window)
    function showError(message) {
      if (!errorBanner) return;
      errorBanner.textContent = message;
      errorBanner.hidden = false;
    }

    function hideError() {
      if (!errorBanner) return;
      errorBanner.textContent = '';
      errorBanner.hidden = true;
    }

    // 8. Modals Handler (Overview, How It Works, Model Specs)
    modalButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-modal-target');
        const modal = document.getElementById(targetId);
        if (modal) {
          openModal(modal);
        }
      });
    });

    modalCloses.forEach((closeElem) => {
      closeElem.addEventListener('click', () => {
        const modal = closeElem.closest('.ai-modal');
        if (modal) closeModal(modal);
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modals.forEach((modal) => {
          if (!modal.hidden) closeModal(modal);
        });
      }
    });

    function openModal(modal) {
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      const focusable = modal.querySelector('button, [tabindex="0"]');
      if (focusable) focusable.focus();
    }

    function closeModal(modal) {
      modal.hidden = true;
      document.body.style.overflow = '';
    }

    // Utility: HTML Escaping
    function escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  });
})();
