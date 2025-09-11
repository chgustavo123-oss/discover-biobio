# Discover Bio Bío

Discover Bio Bío is a student project developed at DUOC UC, School of Tourism, with contributions from the English Programme. It aims to showcase the cultural and natural richness of the Bío Bío Region through a responsive, accessible, and modern website.

## 🌟 Key Features

*   **Dynamic Destination Catalog:** Destinations are loaded asynchronously from a `JSON` file, allowing for easy updates and management.
*   **Advanced Filtering:** Users can filter destinations by main categories (Nature, Heritage, Culture, etc.) and specific subcategories (Parks, Museums, Beaches, etc.).
*   **Live Search:** A real-time search bar in the header allows users to quickly find destinations by name, description, or tags.
*   **Interactive Detail View:** Clicking on a destination card opens a detailed view with a banner image, extended description, address, Google Maps link, and other relevant information.
*   **Switchable Color Themes:** A CSS-only theme switcher (using `:has()`) allows users to personalize the site's color palette without reloading the page.
*   **Responsive Design:** The layout is fully responsive and optimized for a seamless experience on mobile, tablet, and desktop devices.
*   **Modern Animations:** The site includes a splash screen, subtle reveal-on-scroll animations, and a multi-layered parallax effect on the promotional banner to create a dynamic user experience.
*   **Accessibility Focused:** Implemented with ARIA attributes, semantic HTML, and keyboard navigation in mind to ensure a good experience for all users.

## 🛠️ Tech Stack

This is a pure front-end project built with web standards:

*   **HTML5:** Semantic and well-structured markup.
*   **CSS3:** Modern styling using CSS Variables for theming, Flexbox, Grid, and the `:has()` pseudo-class for advanced state management.
*   **JavaScript (ES6+):** Vanilla JavaScript is used for all dynamic functionality, organized into modules (IIFEs). Key features include:
    *   Asynchronous data fetching with `fetch()` and `async/await`.
    *   DOM manipulation for rendering content.
    *   Event handling and delegation.
    *   `IntersectionObserver` for efficient scroll-based animations.

## 📂 Project Structure

```
/
├── assets/
│   ├── css/
│   │   └── style.css         # Main stylesheet
│   ├── data/
│   │   └── destinations.json # Destination data
│   ├── img/
│   │   ├── ...               # Images for destinations, icons, etc.
│   └── js/
│       └── script.js         # All JavaScript logic
├── index.html                # Main page
├── readme.html               # Project notes page
└── README.md                 # This file
```

## 🚀 How to Run

As this is a static website, you can simply open the `index.html` file in your web browser.

For the best experience and to avoid potential CORS issues when fetching the `destinations.json` file, it's recommended to run it using a local server. A simple way to do this is with the Live Server extension for VS Code.

## ✨ Credits

*   Developed by students and faculty of **DUOC UC – Tourism & Hospitality**.
*   Special thanks to the **English Programme**.

