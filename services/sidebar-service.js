/**
 * Sidebar Service
 * Handles sidebar toggle functionality
 */

import { elementToggleFunc } from "../utils/helpers.js";

export class SidebarService {
  constructor() {
    this.sidebar = document.querySelector("[data-sidebar]");
    this.sidebarBtn = document.querySelector("[data-sidebar-btn]");
    this.init();
  }

  init() {
    if (this.sidebarBtn && this.sidebar) {
      this.sidebarBtn.addEventListener("click", () => {
        elementToggleFunc(this.sidebar);
      });
    }
  }
}
