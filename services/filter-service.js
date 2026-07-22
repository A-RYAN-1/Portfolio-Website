/**
 * Filter Service
 * Handles project filtering functionality
 */

import { elementToggleFunc } from "../utils/helpers.js";

export class FilterService {
  constructor() {
    this.select = document.querySelector("[data-select]");
    this.selectItems = document.querySelectorAll("[data-select-item]");
    this.selectValue = document.querySelector("[data-selecct-value]");
    this.filterBtn = document.querySelectorAll("[data-filter-btn]");
    this.filterItems = document.querySelectorAll("[data-filter-item]");
    this.lastClickedBtn = this.filterBtn[0];
    this.init();
  }

  init() {
    if (this.select) {
      this.addSelectEvent();
    }
    if (this.selectItems.length > 0) {
      this.addSelectItemEvents();
    }
    if (this.filterBtn.length > 0) {
      this.addFilterBtnEvents();
    }
  }

  addSelectEvent() {
    this.select.addEventListener("click", () => {
      elementToggleFunc(this.select);
    });
  }

  addSelectItemEvents() {
    this.selectItems.forEach((item) => {
      item.addEventListener("click", () => {
        const selectedValue = item.innerText.toLowerCase();
        this.selectValue.innerText = item.innerText;
        elementToggleFunc(this.select);
        this.filterItems(selectedValue);
      });
    });
  }

  addFilterBtnEvents() {
    this.filterBtn.forEach((btn) => {
      btn.addEventListener("click", () => {
        const selectedValue = btn.innerText.toLowerCase();
        this.selectValue.innerText = btn.innerText;
        this.filterItems(selectedValue);

        this.lastClickedBtn.classList.remove("active");
        btn.classList.add("active");
        this.lastClickedBtn = btn;
      });
    });
  }

  filterItems(selectedValue) {
    this.filterItems.forEach((item) => {
      if (selectedValue === "all") {
        item.classList.add("active");
      } else if (selectedValue === item.dataset.category) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
}
