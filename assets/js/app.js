/**
 * Application Bootstrap
 * Initializes all services and starts the application
 */

import { SidebarService } from "../../services/sidebar-service.js";
import { ModalService } from "../../services/modal-service.js";
import { FilterService } from "../../services/filter-service.js";
import { FormService } from "../../services/form-service.js";
import { NavigationService } from "../../services/navigation-service.js";
import { AnimationService } from "../../services/animation-service.js";

class Application {
  constructor() {
    this.initServices();
  }

  initServices() {
    // Initialize all services
    new SidebarService();
    new ModalService();
    new FilterService();
    new FormService();
    new NavigationService();
    new AnimationService();
  }
}

// Start the application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new Application();
});
