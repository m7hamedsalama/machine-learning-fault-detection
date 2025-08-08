/**
 * Data AI Classifier - Main JavaScript
 * Handles form input, prediction, and UI interactions
 */

document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const submitBtn = document.getElementById("submit-btn");
  const resultsSection = document.getElementById("results-section");
  const placeholderSection = document.getElementById("placeholder-section");
  const errorSection = document.getElementById("error-section");
  const errorMessage = document.getElementById("error-message");
  const errorDismiss = document.getElementById("error-dismiss");
  const predictionLabel = document.getElementById("prediction-label");
  const confidenceBar = document.getElementById("confidence-bar");
  const confidenceValue = document.getElementById("confidence-value");
  const allCategories = document.getElementById("all-categories");
  const categoryIcon = document.getElementById("category-icon");
  const loadingOverlay = document.getElementById("loading-overlay");
  const parameterForm = document.getElementById("parameter-form");

  // Handle form submission and prediction
  submitBtn.addEventListener("click", function (e) {
    e.preventDefault();

    // Show loading overlay
    loadingOverlay.classList.remove("d-none");

    // Hide any previous results or errors
    resultsSection.classList.add("d-none");
    placeholderSection.classList.add("d-none");
    errorSection.classList.add("d-none");

    // Collect form data
    const formData = new FormData(parameterForm);
    const data = {
      air_temp: parseFloat(formData.get("air_temp")),
      process_temp: parseFloat(formData.get("process_temp")),
      rot_speed: parseFloat(formData.get("rot_speed")),
      torque: parseFloat(formData.get("torque")),
      tool_wear: parseFloat(formData.get("tool_wear")),
      type: formData.get("type"),
    };

    // Basic validation
    for (const [key, value] of Object.entries(data)) {
      if (key !== "type" && (isNaN(value) || value === "")) {
        loadingOverlay.classList.add("d-none");
        showError(
          `Please enter a valid numerical value for ${key.replace("_", " ")}`
        );
        return;
      }
    }

    // Send data to server
    fetch("/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        loadingOverlay.classList.add("d-none");

        if (data.error) {
          showError(data.error);
          return;
        }

        // Display results
        displayResults(data);
      })
      .catch((error) => {
        loadingOverlay.classList.add("d-none");
        showError(`Error: ${error.message}`);
      });
  });

  // Display prediction results
  function displayResults(data) {
    // Show results section
    resultsSection.classList.remove("d-none");
    placeholderSection.classList.add("d-none");
    errorSection.classList.add("d-none");

    // Update prediction label with animation
    predictionLabel.textContent = capitalizeFirst(data.prediction);
    predictionLabel.style.animation = "none";
    setTimeout(() => {
      predictionLabel.style.animation = "fadeIn 0.8s ease";
    }, 10);

    // Update confidence bar
    const confidencePercent = Math.round(data.confidence * 100);
    confidenceBar.style.width = `${confidencePercent}%`;
    confidenceValue.textContent = `${confidencePercent}%`;

    // Change color based on confidence
    if (confidencePercent >= 120) {
      confidenceBar.style.backgroundColor = "var(--success-color)";
      // Trigger confetti for high confidence
      launchConfetti();
    } else if (confidencePercent >= 50) {
      confidenceBar.style.backgroundColor = "var(--primary-color)";
    } else {
      confidenceBar.style.backgroundColor = "var(--warning-color)";
    }

    // Set appropriate icon for prediction (modify based on your categories)
    setCategoryIcon(data.prediction);

    // Display all confidence scores if available
    if (data.all_confidences) {
      displayAllConfidences(data.all_confidences, data.prediction);
    }

    // Show a small badge if we're in demo mode
    if (data.demo_mode) {
      // Check if demo badge already exists
      if (!document.getElementById("demo-badge")) {
        const demoBadge = document.createElement("div");
        demoBadge.id = "demo-badge";
        demoBadge.className = "demo-badge";
        demoBadge.innerHTML = "Demo Mode";

        // Add a tooltip explaining what demo mode is
        demoBadge.title =
          "Currently using random predictions for demonstration purposes";

        // Add it to the results section
        document.querySelector(".result-header").appendChild(demoBadge);

        // Add some CSS for the demo badge
        const style = document.createElement("style");
        style.textContent = `
          .demo-badge {
            background-color: var(--secondary-color);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 500;
            position: absolute;
            top: 0;
            right: 0;
            opacity: 0.8;
            cursor: help;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }

  // Set category icon based on prediction (modify based on your prediction categories)
  function setCategoryIcon(category) {
    // Reset classes
    categoryIcon.className = "";

    // Set appropriate icon for each category (example - update as needed)
    switch (category.toLowerCase()) {
      case "normal":
        categoryIcon.className = "fas fa-check-circle";
        break;
      case "failure":
        categoryIcon.className = "fas fa-exclamation-triangle";
        break;
      default:
        categoryIcon.className = "fas fa-question-circle";
    }
  }

  // Display all confidence scores
  function displayAllConfidences(confidences, topCategory) {
    // Clear previous results
    allCategories.innerHTML = "";

    // Sort categories by confidence score
    const sortedCategories = Object.entries(confidences).sort(
      (a, b) => b[1] - a[1]
    );

    // Create bar for each category
    sortedCategories.forEach(([category, confidence], index) => {
      const confidencePercent = Math.round(confidence * 100);
      const isHighest = category.toLowerCase() === topCategory.toLowerCase();

      const categoryBar = document.createElement("div");
      categoryBar.className = "category-bar";
      categoryBar.style.animationDelay = `${0.1 * (index + 1)}s`;

      categoryBar.innerHTML = `
        <div class="category-label">
          <span class="name">${capitalizeFirst(category)}</span>
          <span class="value">${confidencePercent}%</span>
        </div>
        <div class="category-progress">
          <div class="category-progress-bar ${isHighest ? "highest" : ""}" 
               style="width: 0%"></div>
        </div>
      `;

      allCategories.appendChild(categoryBar);

      // Animate progress bar after a small delay
      setTimeout(() => {
        const progressBar = categoryBar.querySelector(".category-progress-bar");
        progressBar.style.width = `${confidencePercent}%`;
      }, 100);
    });
  }

  // Show error message
  function showError(message) {
    resultsSection.classList.add("d-none");
    placeholderSection.classList.add("d-none");
    errorSection.classList.remove("d-none");

    errorMessage.textContent = message;
  }

  // Dismiss error
  errorDismiss.addEventListener("click", function () {
    errorSection.classList.add("d-none");
    placeholderSection.classList.remove("d-none");
  });

  // Helper function to capitalize first letter
  function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Launch confetti for successful high-confidence prediction
  function launchConfetti() {
    if (typeof confetti !== "undefined") {
      confetti.start();

      // Stop after a shorter time (1.5 seconds)
      setTimeout(() => {
        confetti.stop();

        // Clear any remaining confetti particles after they've fallen
        setTimeout(() => {
          confetti.clear();
        }, 1000);
      }, 600);
    }
  }
});
