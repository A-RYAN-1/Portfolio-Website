# Portfolio Website

A production-ready portfolio website with modular architecture and proper separation of concerns.

## 📁 Project Structure

```
Portfolio-Website/
├── config/                 # Configuration layer - all data
│   ├── personal-info.js   # User profile details and bio
│   ├── contacts.js        # Email, phone, location, social links
│   ├── education.js       # Academic history with achievements
│   ├── experience.js      # Work experience with achievements
│   ├── skills.js          # Technical skills with proficiency
│   ├── projects.js        # Project data and metadata
│   ├── services.js        # Service offerings
│   └── testimonials.js    # Client testimonials
├── services/             # Service layer - JavaScript modules
│   ├── sidebar-service.js     # Sidebar toggle functionality
│   ├── modal-service.js       # Testimonial modal logic
│   ├── filter-service.js      # Project filtering logic
│   ├── form-service.js        # Form validation
│   ├── navigation-service.js  # Page navigation logic
│   └── animation-service.js   # Skill bars, scroll animations
├── utils/                # Utils layer - utility functions
│   └── helpers.js        # Element toggle, common functions
├── assets/
│   ├── css/
│   ├── images/
│   └── js/
│       └── app.js        # Application bootstrap
└── index.html            # Main entry point
```

## 🚀 How to Deploy on GitHub Pages

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin feature/complete-refactoring
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Choose branch: `feature/complete-refactoring` (or `main` after merging)
5. Choose folder: `/ (root)`
6. Click **Save**

### Step 3: Wait for Deployment

- GitHub will deploy your site in 1-2 minutes
- Access your site at: `https://your-username.github.io/Portfolio-Website/`

### Alternative: Using gh-pages CLI

```bash
# Install gh-pages (if not installed)
npm install -g gh-pages

# Deploy to GitHub Pages
gh-pages -d .
```

## 📝 Editing Content

### Personal Info
Edit `config/personal-info.js`:
```javascript
export const PERSONAL_INFO = {
  name: "Your Name",
  title: "Your Title",
  bio: ["Your bio paragraphs..."],
};
```

### Projects
Edit `config/projects.js`:
```javascript
{
  title: "Project Name",
  category: "web development",
  techStack: "React, Node.js",
  image: "./assets/images/project.png",
  link: "https://github.com/username/repo"
}
```

### Skills
Edit `config/skills.js`:
```javascript
{
  category: "Languages",
  technologies: "JavaScript, Python, Go",
  proficiency: 80
}
```

### Experience
Edit `config/experience.js`:
```javascript
{
  title: "Job Title at Company",
  period: "Jan 2020 - Present",
  location: "City",
  achievements: ["Achievement 1", "Achievement 2"]
}
```

## 🏃 Local Development

```bash
# Start local server
npx http-server

# Open http://localhost:8080
```

## 👤 Author

**Aryan Deshmukh**
- LinkedIn: https://www.linkedin.com/in/aryan-deshmukh-793840259/
- GitHub: https://github.com/A-RYAN-1
