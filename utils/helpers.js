/**
 * Helper Functions
 * Common utility functions used across the application
 */

/**
 * Toggle a CSS class on an element
 * @param {HTMLElement} elem - The element to toggle class on
 * @param {string} className - The class name to toggle (default: 'active')
 */
export const elementToggleFunc = function (elem, className = "active") {
  elem.classList.toggle(className);
};

/**
 * Scroll to top of page smoothly
 */
export const scrollToTop = function () {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
