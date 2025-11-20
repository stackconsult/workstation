/**
 * Form Filling with LLM Integration
 * Intelligent form field detection and completion
 */

export class FormFillingAgent {
  constructor() {
    this.formDetectionStrategies = {
      text: ['input[type="text"]', 'input:not([type])', 'textarea'],
      email: ['input[type="email"]', 'input[name*="email"]', 'input[id*="email"]'],
      password: ['input[type="password"]', 'input[name*="password"]', 'input[id*="pass"]'],
      tel: ['input[type="tel"]', 'input[name*="phone"]', 'input[name*="tel"]'],
      number: ['input[type="number"]', 'input[name*="number"]', 'input[name*="amount"]'],
      date: ['input[type="date"]', 'input[name*="date"]', 'input[name*="birth"]'],
      checkbox: ['input[type="checkbox"]'],
      radio: ['input[type="radio"]'],
      select: ['select'],
      file: ['input[type="file"]']
    };
  }

  /**
   * Detect all forms on the page
   * @returns {Array} Array of form information
   */
  detectForms() {
    const forms = [];
    const formElements = document.querySelectorAll('form');

    formElements.forEach((form, index) => {
      const formInfo = {
        index,
        element: form,
        action: form.action,
        method: form.method,
        id: form.id,
        name: form.name,
        fields: this.analyzeFormFields(form)
      };

      forms.push(formInfo);
    });

    // Also detect fieldsets and form-like structures without <form> tags
    const formLikeStructures = this.detectFormLikeStructures();
    forms.push(...formLikeStructures);

    return forms;
  }

  /**
   * Analyze form fields
   * @param {HTMLElement} form - Form element
   * @returns {Array} Array of field information
   */
  analyzeFormFields(form) {
    const fields = [];
    
    // Find all input fields
    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach((input, index) => {
      const fieldInfo = {
        index,
        element: input,
        type: input.type || input.tagName.toLowerCase(),
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        label: this.findLabel(input),
        required: input.required,
        value: input.value,
        options: input.tagName === 'SELECT' ? this.getSelectOptions(input) : null,
        ariaLabel: input.getAttribute('aria-label'),
        ariaDescribedBy: input.getAttribute('aria-describedby'),
        autocomplete: input.getAttribute('autocomplete'),
        pattern: input.pattern,
        minLength: input.minLength,
        maxLength: input.maxLength,
        min: input.min,
        max: input.max
      };

      // Infer field purpose from various attributes
      fieldInfo.inferredPurpose = this.inferFieldPurpose(fieldInfo);

      fields.push(fieldInfo);
    });

    return fields;
  }

  /**
   * Find label for an input
   * @param {HTMLElement} input - Input element
   * @returns {string|null} Label text
   */
  findLabel(input) {
    // Try explicit label with for attribute
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        return label.textContent.trim();
      }
    }

    // Try parent label
    const parentLabel = input.closest('label');
    if (parentLabel) {
      return parentLabel.textContent.trim();
    }

    // Try preceding label
    let prev = input.previousElementSibling;
    while (prev) {
      if (prev.tagName === 'LABEL') {
        return prev.textContent.trim();
      }
      prev = prev.previousElementSibling;
    }

    // Try aria-label
    const ariaLabel = input.getAttribute('aria-label');
    if (ariaLabel) {
      return ariaLabel;
    }

    // Try aria-labelledby
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) {
        return labelElement.textContent.trim();
      }
    }

    return null;
  }

  /**
   * Get options for select element
   * @param {HTMLElement} select - Select element
   * @returns {Array} Array of options
   */
  getSelectOptions(select) {
    const options = [];
    const optionElements = select.querySelectorAll('option');

    optionElements.forEach(option => {
      options.push({
        value: option.value,
        text: option.textContent.trim(),
        selected: option.selected
      });
    });

    return options;
  }

  /**
   * Infer field purpose from attributes
   * @param {Object} fieldInfo - Field information
   * @returns {string} Inferred purpose
   */
  inferFieldPurpose(fieldInfo) {
    const { type, name, id, placeholder, label, autocomplete } = fieldInfo;

    // Check autocomplete attribute first (most reliable)
    if (autocomplete) {
      return autocomplete;
    }

    // Common patterns for different field types
    const patterns = {
      email: /email/i,
      password: /pass(word)?/i,
      firstName: /first.?name|fname|given.?name/i,
      lastName: /last.?name|lname|surname|family.?name/i,
      fullName: /full.?name|name/i,
      phone: /phone|tel(ephone)?|mobile|cell/i,
      address: /address|street/i,
      city: /city|town/i,
      state: /state|province|region/i,
      zip: /zip|postal.?code|postcode/i,
      country: /country|nation/i,
      company: /company|organization|employer/i,
      jobTitle: /job.?title|position|role/i,
      website: /website|url|homepage/i,
      birthday: /birth|bday|dob/i,
      age: /age/i,
      gender: /gender|sex/i,
      creditCard: /card.?number|cc.?number|credit.?card/i,
      cvv: /cvv|cvc|security.?code/i,
      expiryDate: /expir|exp.?date/i,
      username: /user.?name|login/i,
      message: /message|comment|note/i,
      search: /search|query/i
    };

    // Check all attributes against patterns
    const checkString = `${name} ${id} ${placeholder} ${label}`.toLowerCase();

    for (const [purpose, pattern] of Object.entries(patterns)) {
      if (pattern.test(checkString)) {
        return purpose;
      }
    }

    // Fallback to type
    return type;
  }

  /**
   * Detect form-like structures without <form> tags
   * @returns {Array} Array of form-like structures
   */
  detectFormLikeStructures() {
    const structures = [];
    
    // Find groups of inputs not within forms
    const allInputs = document.querySelectorAll('input, textarea, select');
    const inputsNotInForms = Array.from(allInputs).filter(input => !input.closest('form'));

    if (inputsNotInForms.length > 0) {
      // Group by common parent
      const parentGroups = new Map();

      inputsNotInForms.forEach(input => {
        const parent = input.closest('div, section, article') || document.body;
        if (!parentGroups.has(parent)) {
          parentGroups.set(parent, []);
        }
        parentGroups.get(parent).push(input);
      });

      // Convert groups to form structures
      parentGroups.forEach((inputs, parent) => {
        if (inputs.length >= 2) { // At least 2 inputs to be considered a form
          structures.push({
            index: structures.length,
            element: parent,
            action: null,
            method: null,
            id: parent.id || null,
            name: null,
            fields: inputs.map((input, index) => ({
              index,
              element: input,
              type: input.type || input.tagName.toLowerCase(),
              name: input.name,
              id: input.id,
              placeholder: input.placeholder,
              label: this.findLabel(input),
              required: input.required,
              value: input.value,
              inferredPurpose: this.inferFieldPurpose({
                type: input.type,
                name: input.name,
                id: input.id,
                placeholder: input.placeholder,
                label: this.findLabel(input)
              })
            })),
            isFormLike: true
          });
        }
      });
    }

    return structures;
  }

  /**
   * Fill form with provided data
   * @param {Object} formInfo - Form information
   * @param {Object} data - Data to fill
   * @param {Object} options - Fill options
   * @returns {Promise<Object>} Fill result
   */
  async fillForm(formInfo, data, options = {}) {
    const {
      simulate = true, // Simulate human typing
      delay = 50, // Delay between keystrokes
      triggerEvents = true // Trigger input events
    } = options;

    const results = {
      success: true,
      fieldsFilld: 0,
      fieldsFailed: 0,
      errors: []
    };

    for (const field of formInfo.fields) {
      try {
        const value = this.getValueForField(field, data);
        
        if (value !== null && value !== undefined) {
          await this.fillField(field.element, value, { simulate, delay, triggerEvents });
          results.fieldsFilled++;
        }
      } catch (error) {
        results.fieldsFailed++;
        results.errors.push({
          field: field.name || field.id,
          error: error.message
        });
      }
    }

    results.success = results.fieldsFailed === 0;
    return results;
  }

  /**
   * Get value for field from data
   * @param {Object} field - Field information
   * @param {Object} data - Form data
   * @returns {*} Value to fill
   */
  getValueForField(field, data) {
    const { name, id, inferredPurpose } = field;

    // Try exact name match
    if (name && data[name] !== undefined) {
      return data[name];
    }

    // Try exact id match
    if (id && data[id] !== undefined) {
      return data[id];
    }

    // Try inferred purpose
    if (inferredPurpose && data[inferredPurpose] !== undefined) {
      return data[inferredPurpose];
    }

    // Try label match
    if (field.label && data[field.label] !== undefined) {
      return data[field.label];
    }

    return null;
  }

  /**
   * Fill individual field
   * @param {HTMLElement} element - Form element
   * @param {*} value - Value to fill
   * @param {Object} options - Fill options
   * @returns {Promise<void>}
   */
  async fillField(element, value, options = {}) {
    const { simulate, delay, triggerEvents } = options;

    if (!element) {
      throw new Error('Element not found');
    }

    // Ensure element is visible and enabled
    if (!this.isElementInteractable(element)) {
      throw new Error('Element is not interactable');
    }

    const tagName = element.tagName.toLowerCase();
    const type = element.type?.toLowerCase();

    if (tagName === 'select') {
      await this.fillSelect(element, value, triggerEvents);
    } else if (type === 'checkbox') {
      await this.fillCheckbox(element, value, triggerEvents);
    } else if (type === 'radio') {
      await this.fillRadio(element, value, triggerEvents);
    } else if (type === 'file') {
      // File inputs require special handling (not implemented here)
      console.warn('File input filling not implemented');
    } else {
      // Text inputs, textarea, etc.
      await this.fillTextInput(element, value, simulate, delay, triggerEvents);
    }
  }

  /**
   * Fill text input with optional human simulation
   * @param {HTMLElement} element - Input element
   * @param {string} value - Value to fill
   * @param {boolean} simulate - Simulate human typing
   * @param {number} delay - Delay between keystrokes
   * @param {boolean} triggerEvents - Trigger input events
   */
  async fillTextInput(element, value, simulate, delay, triggerEvents) {
    element.focus();

    if (simulate) {
      // Simulate human typing
      element.value = '';
      for (const char of value.toString()) {
        element.value += char;
        
        if (triggerEvents) {
          element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
          element.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
        }

        await this.sleep(delay);
      }
    } else {
      element.value = value.toString();
      
      if (triggerEvents) {
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    element.blur();
  }

  /**
   * Fill select dropdown
   * @param {HTMLElement} element - Select element
   * @param {*} value - Value to select
   * @param {boolean} triggerEvents - Trigger change events
   */
  async fillSelect(element, value, triggerEvents) {
    element.value = value.toString();

    if (triggerEvents) {
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /**
   * Fill checkbox
   * @param {HTMLElement} element - Checkbox element
   * @param {boolean} value - Checked state
   * @param {boolean} triggerEvents - Trigger change events
   */
  async fillCheckbox(element, value, triggerEvents) {
    const shouldBeChecked = Boolean(value);

    if (element.checked !== shouldBeChecked) {
      element.checked = shouldBeChecked;

      if (triggerEvents) {
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('click', { bubbles: true }));
      }
    }
  }

  /**
   * Fill radio button
   * @param {HTMLElement} element - Radio element
   * @param {*} value - Value to select
   * @param {boolean} triggerEvents - Trigger change events
   */
  async fillRadio(element, value, triggerEvents) {
    if (element.value === value.toString()) {
      element.checked = true;

      if (triggerEvents) {
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('click', { bubbles: true }));
      }
    }
  }

  /**
   * Check if element is interactable
   * @param {HTMLElement} element - Element to check
   * @returns {boolean}
   */
  isElementInteractable(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility === 'visible' &&
      style.display !== 'none' &&
      !element.disabled &&
      !element.readOnly
    );
  }

  /**
   * Generate form summary for LLM
   * @param {Object} formInfo - Form information
   * @returns {string} Form summary
   */
  generateFormSummaryForLLM(formInfo) {
    const summary = {
      action: formInfo.action,
      method: formInfo.method,
      fields: formInfo.fields.map(field => ({
        label: field.label,
        type: field.type,
        name: field.name,
        id: field.id,
        placeholder: field.placeholder,
        purpose: field.inferredPurpose,
        required: field.required,
        currentValue: field.value,
        options: field.options
      }))
    };

    return JSON.stringify(summary, null, 2);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
