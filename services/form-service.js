/**
 * Form Service
 * Handles form validation and submission
 */

export class FormService {
  constructor() {
    this.form = document.querySelector("[data-form]");
    this.formInputs = document.querySelectorAll("[data-form-input]");
    this.formBtn = document.querySelector("[data-form-btn]");
    this.init();
  }

  init() {
    if (this.formInputs.length > 0 && this.formBtn) {
      this.addInputEvents();
    }
  }

  addInputEvents() {
    this.formInputs.forEach((input) => {
      input.addEventListener("input", () => {
        this.validateForm();
      });
    });
  }

  validateForm() {
    if (this.form && this.form.checkValidity()) {
      this.formBtn.removeAttribute("disabled");
    } else {
      this.formBtn.setAttribute("disabled", "");
    }
  }
}
