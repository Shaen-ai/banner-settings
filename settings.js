/**
 * Site Notice Banner - Settings Panel
 * Handles 4-tier plan configuration with feature gating
 * Plans: Free, Light, Business, Business Pro
 */

(function() {
    'use strict';

    // Plan tiers (must match widget.js)
    const PLANS = {
        FREE: 'free',
        LIGHT: 'light',
        BUSINESS: 'business',
        BUSINESS_PRO: 'business_pro'
    };

    // Plan display names
    const PLAN_NAMES = {
        [PLANS.FREE]: 'Free',
        [PLANS.LIGHT]: 'Light',
        [PLANS.BUSINESS]: 'Business',
        [PLANS.BUSINESS_PRO]: 'Business Pro'
    };

    // Feature availability by plan
    const FEATURES = {
        custom_colors: [PLANS.BUSINESS, PLANS.BUSINESS_PRO],
        position_control: [PLANS.BUSINESS, PLANS.BUSINESS_PRO],
        close_button: [PLANS.BUSINESS_PRO],
        auto_hide: [PLANS.BUSINESS_PRO]
    };

    // DOM Elements
    let elements = {};

    // Current settings state
    let currentSettings = {
        enabled: true,
        bannerText: 'Your important message appears here',
        backgroundColor: '#2563eb',
        textColor: '#ffffff',
        position: 'top',
        plan: PLANS.FREE,
        showCloseButton: false,
        autoHideSeconds: 0
    };

    /**
     * Initialize settings panel
     */
    function init() {
        cacheElements();
        setupEventListeners();
        loadSettings();
        updateFeatureAccess();
        updatePreview();
    }

    /**
     * Cache all DOM elements
     */
    function cacheElements() {
        elements = {
            // Plan display
            currentPlanName: document.getElementById('currentPlanName'),
            planSelector: document.getElementById('planSelector'),

            // Basic settings
            enabled: document.getElementById('enabled'),
            bannerText: document.getElementById('bannerText'),
            charCount: document.getElementById('charCount'),

            // Color settings (Business+)
            backgroundColor: document.getElementById('backgroundColor'),
            backgroundColorText: document.getElementById('backgroundColorText'),
            textColor: document.getElementById('textColor'),
            textColorText: document.getElementById('textColorText'),

            // Position (Business+)
            positionTop: document.querySelector('input[name="position"][value="top"]'),
            positionBottom: document.querySelector('input[name="position"][value="bottom"]'),

            // Business Pro features
            showCloseButton: document.getElementById('showCloseButton'),
            autoHideSeconds: document.getElementById('autoHideSeconds'),

            // Preview
            previewBanner: document.getElementById('preview-banner'),
            previewText: document.getElementById('preview-text'),
            previewCloseButton: document.getElementById('preview-close-button'),

            // Footer
            saveButton: document.getElementById('saveButton'),
            saveStatus: document.getElementById('saveStatus'),

            // Upgrade buttons
            upgradeButtons: document.querySelectorAll('.upgrade-button')
        };
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Plan selector (dev/testing)
        elements.planSelector.addEventListener('change', function() {
            currentSettings.plan = this.value;
            updatePlanDisplay();
            updateFeatureAccess();
            updatePreview();
        });

        // Enable/Disable toggle
        elements.enabled.addEventListener('change', function() {
            currentSettings.enabled = this.checked;
            updatePreview();
        });

        // Banner text
        elements.bannerText.addEventListener('input', function() {
            currentSettings.bannerText = this.value;
            updateCharCount();
            updatePreview();
        });

        // Background color
        elements.backgroundColor.addEventListener('input', function() {
            currentSettings.backgroundColor = this.value;
            elements.backgroundColorText.value = this.value;
            updatePreview();
        });

        elements.backgroundColorText.addEventListener('input', function() {
            if (isValidColor(this.value)) {
                currentSettings.backgroundColor = this.value;
                elements.backgroundColor.value = this.value;
                updatePreview();
            }
        });

        // Text color
        elements.textColor.addEventListener('input', function() {
            currentSettings.textColor = this.value;
            elements.textColorText.value = this.value;
            updatePreview();
        });

        elements.textColorText.addEventListener('input', function() {
            if (isValidColor(this.value)) {
                currentSettings.textColor = this.value;
                elements.textColor.value = this.value;
                updatePreview();
            }
        });

        // Position
        elements.positionTop.addEventListener('change', function() {
            if (this.checked) {
                currentSettings.position = 'top';
                updatePreview();
            }
        });

        elements.positionBottom.addEventListener('change', function() {
            if (this.checked) {
                currentSettings.position = 'bottom';
                updatePreview();
            }
        });

        // Close button toggle
        elements.showCloseButton.addEventListener('change', function() {
            currentSettings.showCloseButton = this.checked;
            updatePreview();
        });

        // Auto-hide seconds
        elements.autoHideSeconds.addEventListener('input', function() {
            currentSettings.autoHideSeconds = parseInt(this.value) || 0;
        });

        // Save button
        elements.saveButton.addEventListener('click', saveSettings);

        // Upgrade buttons
        elements.upgradeButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                handleUpgrade(this.getAttribute('data-plan'));
            });
        });
    }

    /**
     * Load settings from Wix
     */
    function loadSettings() {
        if (typeof window.Wix !== 'undefined') {
            window.Wix.Settings.getSiteSettings(function(settings) {
                if (settings) {
                    currentSettings = { ...currentSettings, ...settings };
                    applySettingsToUI();
                }
            });
        } else {
            console.warn('Wix SDK not detected. Using default settings.');
            applySettingsToUI();
        }
    }

    /**
     * Apply settings to UI elements
     */
    function applySettingsToUI() {
        elements.enabled.checked = currentSettings.enabled;
        elements.bannerText.value = currentSettings.bannerText;
        elements.backgroundColor.value = currentSettings.backgroundColor;
        elements.backgroundColorText.value = currentSettings.backgroundColor;
        elements.textColor.value = currentSettings.textColor;
        elements.textColorText.value = currentSettings.textColor;
        elements.showCloseButton.checked = currentSettings.showCloseButton;
        elements.autoHideSeconds.value = currentSettings.autoHideSeconds;
        elements.planSelector.value = currentSettings.plan;

        // Position
        if (currentSettings.position === 'top') {
            elements.positionTop.checked = true;
        } else {
            elements.positionBottom.checked = true;
        }

        updatePlanDisplay();
        updateCharCount();
        updateFeatureAccess();
        updatePreview();
    }

    /**
     * Update plan display
     */
    function updatePlanDisplay() {
        const planName = PLAN_NAMES[currentSettings.plan] || 'Unknown';
        elements.currentPlanName.textContent = planName;

        // Update current plan badge styling
        const badge = document.getElementById('currentPlanBadge');
        badge.className = 'current-plan-badge plan-' + currentSettings.plan;

        // Highlight current plan card
        document.querySelectorAll('.plan-card').forEach(function(card) {
            if (card.getAttribute('data-plan') === currentSettings.plan) {
                card.classList.add('current-plan');
            } else {
                card.classList.remove('current-plan');
            }
        });
    }

    /**
     * Update feature access based on current plan
     */
    function updateFeatureAccess() {
        const plan = currentSettings.plan;

        // Custom colors (Business & Business Pro)
        const hasCustomColors = FEATURES.custom_colors.includes(plan);
        elements.backgroundColor.disabled = !hasCustomColors;
        elements.backgroundColorText.disabled = !hasCustomColors;
        elements.textColor.disabled = !hasCustomColors;
        elements.textColorText.disabled = !hasCustomColors;
        toggleFeatureLock('custom_colors', hasCustomColors);

        // Position control (Business & Business Pro)
        const hasPositionControl = FEATURES.position_control.includes(plan);
        elements.positionTop.disabled = !hasPositionControl;
        elements.positionBottom.disabled = !hasPositionControl;
        toggleFeatureLock('position_control', hasPositionControl);

        // Close button (Business Pro only)
        const hasCloseButton = FEATURES.close_button.includes(plan);
        elements.showCloseButton.disabled = !hasCloseButton;
        toggleFeatureLock('close_button', hasCloseButton);

        // Auto-hide (Business Pro only)
        const hasAutoHide = FEATURES.auto_hide.includes(plan);
        elements.autoHideSeconds.disabled = !hasAutoHide;
        toggleFeatureLock('auto_hide', hasAutoHide);
    }

    /**
     * Toggle feature lock styling
     */
    function toggleFeatureLock(feature, isUnlocked) {
        const selectors = {
            custom_colors: '[data-required-plan="business"]',
            position_control: '[data-required-plan="business"]',
            close_button: '[data-required-plan="business_pro"]',
            auto_hide: '[data-required-plan="business_pro"]'
        };

        const selector = selectors[feature];
        if (!selector) return;

        const elements = document.querySelectorAll(selector);
        elements.forEach(function(element) {
            if (isUnlocked) {
                element.classList.remove('feature-locked');
                element.classList.add('feature-unlocked');
            } else {
                element.classList.add('feature-locked');
                element.classList.remove('feature-unlocked');
            }
        });
    }

    /**
     * Update character count
     */
    function updateCharCount() {
        const count = elements.bannerText.value.length;
        elements.charCount.textContent = count;

        if (count > 180) {
            elements.charCount.style.color = '#dc2626';
        } else if (count > 150) {
            elements.charCount.style.color = '#f59e0b';
        } else {
            elements.charCount.style.color = '#6b7280';
        }
    }

    /**
     * Update live preview
     */
    function updatePreview() {
        const banner = elements.previewBanner;
        const text = elements.previewText;
        const closeBtn = elements.previewCloseButton;

        // Update text
        text.textContent = currentSettings.bannerText || 'Your important message appears here';

        // Update colors (respect plan limitations)
        if (FEATURES.custom_colors.includes(currentSettings.plan)) {
            banner.style.backgroundColor = currentSettings.backgroundColor;
            banner.style.color = currentSettings.textColor;
        } else {
            // Default colors for Free and Light
            banner.style.backgroundColor = '#2563eb';
            banner.style.color = '#ffffff';
        }

        // Show/hide close button based on plan
        if (FEATURES.close_button.includes(currentSettings.plan) && currentSettings.showCloseButton) {
            closeBtn.style.display = 'flex';
        } else {
            closeBtn.style.display = 'none';
        }

        // Update opacity based on enabled state
        banner.style.opacity = currentSettings.enabled ? '1' : '0.5';
    }

    /**
     * Save settings
     */
    function saveSettings() {
        showSaveStatus('Saving...', 'loading');

        if (typeof window.Wix !== 'undefined') {
            window.Wix.Settings.setSiteSettings(currentSettings, function() {
                window.Wix.Settings.triggerSettingsUpdatedEvent(currentSettings);
                showSaveStatus('Settings saved successfully!', 'success');
            });
        } else {
            setTimeout(function() {
                showSaveStatus('Settings saved (standalone mode)', 'success');
                console.log('Settings saved:', currentSettings);
            }, 500);
        }
    }

    /**
     * Show save status message
     */
    function showSaveStatus(message, type) {
        elements.saveStatus.textContent = message;
        elements.saveStatus.className = 'save-status ' + type;

        setTimeout(function() {
            elements.saveStatus.textContent = '';
            elements.saveStatus.className = 'save-status';
        }, 3000);
    }

    /**
     * Handle upgrade button click
     */
    function handleUpgrade(targetPlan) {
        if (typeof window.Wix !== 'undefined') {
            // In production, open Wix billing page
            // window.Wix.Settings.openBillingPage(targetPlan);
            alert('Upgrade to ' + PLAN_NAMES[targetPlan] + '\n\nIn production, this opens Wix billing page.');
        } else {
            const messages = {
                [PLANS.LIGHT]: 'Upgrade to Light Plan\n\nPrice: $2-3/month\n\nFeatures:\n- Visible on live site\n- Default colors\n- Top position\n- No watermark',
                [PLANS.BUSINESS]: 'Upgrade to Business Plan\n\nPrice: $4-5/month\n\nFeatures:\n- Everything in Light\n- Custom colors\n- Top or bottom position',
                [PLANS.BUSINESS_PRO]: 'Upgrade to Business Pro\n\nPrice: $7-9/month\n\nFeatures:\n- Everything in Business\n- Close button\n- Auto-hide timer\n- Priority support'
            };
            alert(messages[targetPlan] || 'Upgrade available');
        }
    }

    /**
     * Validate hex color
     */
    function isValidColor(color) {
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return hexRegex.test(color);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose API for debugging
    window.NoticeBannerSettings = {
        getCurrentSettings: function() { return currentSettings; },
        setPlan: function(plan) {
            if (PLANS[plan.toUpperCase()]) {
                currentSettings.plan = PLANS[plan.toUpperCase()];
                elements.planSelector.value = currentSettings.plan;
                updatePlanDisplay();
                updateFeatureAccess();
                updatePreview();
            }
        },
        save: saveSettings,
        PLANS: PLANS
    };

})();
