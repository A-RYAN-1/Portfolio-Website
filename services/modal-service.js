/**
 * Modal Service
 * Handles testimonial modal functionality
 */

import { elementToggleFunc } from "../utils/helpers.js";

export class ModalService {
  constructor() {
    this.testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
    this.modalContainer = document.querySelector("[data-modal-container]");
    this.modalCloseBtn = document.querySelector("[data-modal-close-btn]");
    this.overlay = document.querySelector("[data-overlay]");
    this.modalImg = document.querySelector("[data-modal-img]");
    this.modalTitle = document.querySelector("[data-modal-title]");
    this.modalText = document.querySelector("[data-modal-text]");
    this.init();
  }

  init() {
    if (this.testimonialsItem.length > 0 && this.modalContainer) {
      this.addTestimonialClickEvents();
      this.addCloseEvents();
    }
  }

  addTestimonialClickEvents() {
    this.testimonialsItem.forEach((item) => {
      item.addEventListener("click", () => {
        this.modalImg.src = item.querySelector("[data-testimonials-avatar]").src;
        this.modalImg.alt = item.querySelector("[data-testimonials-avatar]").alt;
        this.modalTitle.innerHTML = item.querySelector(
          "[data-testimonials-title]",
        ).innerHTML;
        this.modalText.innerHTML = item.querySelector(
          "[data-testimonials-text]",
        ).innerHTML;
        this.toggleModal();
      });
    });
  }

  addCloseEvents() {
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener("click", () => this.toggleModal());
    }
    if (this.overlay) {
      this.overlay.addEventListener("click", () => this.toggleModal());
    }
  }

  toggleModal() {
    elementToggleFunc(this.modalContainer);
    elementToggleFunc(this.overlay);
  }
}
