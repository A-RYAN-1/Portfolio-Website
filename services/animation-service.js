/**
 * Animation Service
 * Handles skill progress bar animations and scroll effects
 */

export class AnimationService {
  constructor() {
    this.skillsSection = document.querySelector(".skill");
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
    };
    this.scrollThreshold = 300;
    this.init();
  }

  init() {
    if (this.skillsSection) {
      this.initSkillAnimation();
    }
    this.initBackToTopButton();
    this.initProjectHoverEffects();
  }

  initSkillAnimation() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const skillFills = entry.target.querySelectorAll(".skill-progress-fill");
          skillFills.forEach((fill) => {
            const width = fill.getAttribute("data-width");
            fill.style.width = width + "%";
          });
          observer.unobserve(entry.target);
        }
      });
    }, this.observerOptions);

    observer.observe(this.skillsSection);
  }

  initBackToTopButton() {
    const backToTopBtn = document.createElement("button");
    backToTopBtn.className = "back-to-top";
    backToTopBtn.innerHTML = "↑";
    backToTopBtn.title = "Back to top";
    document.body.appendChild(backToTopBtn);

    window.addEventListener("scroll", () => {
      if (window.pageYOffset > this.scrollThreshold) {
        backToTopBtn.classList.add("show");
      } else {
        backToTopBtn.classList.remove("show");
      }
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  initProjectHoverEffects() {
    const projectItems = document.querySelectorAll(".project-item");
    projectItems.forEach((item) => {
      item.addEventListener("mouseenter", function () {
        this.style.transform = "scale(1.02)";
      });
      item.addEventListener("mouseleave", function () {
        this.style.transform = "scale(1)";
      });
    });
  }
}
