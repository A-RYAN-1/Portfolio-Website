/**
 * Navigation Service
 * Handles page navigation and routing
 */

import { scrollToTop } from "../utils/helpers.js";

export class NavigationService {
  constructor() {
    this.navigationLinks = document.querySelectorAll("[data-nav-link]");
    this.pages = document.querySelectorAll("[data-page]");
    this.init();
  }

  init() {
    if (this.navigationLinks.length > 0 && this.pages.length > 0) {
      this.addNavigationEvents();
    }
  }

  addNavigationEvents() {
    this.navigationLinks.forEach((navLink) => {
      navLink.addEventListener("click", () => {
        const targetPage = navLink.innerHTML.toLowerCase();
        this.navigateToPage(targetPage, navLink);
      });
    });
  }

  navigateToPage(targetPage, activeLink) {
    this.pages.forEach((page, index) => {
      if (targetPage === page.dataset.page) {
        page.classList.add("active");
        this.navigationLinks[index].classList.add("active");
        scrollToTop();
      } else {
        page.classList.remove("active");
        this.navigationLinks[index].classList.remove("active");
      }
    });
  }
}
