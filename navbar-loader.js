// Function to load the navbar from navbar.html
function loadNavbar() {
    fetch("navbar.html")
      .then((response) => response.text())
      .then((html) => {
        document.getElementById("navbar-container").innerHTML = html;
      })
      .catch((error) => {
        console.error("Error loading navbar:", error);
      });
  }
  
  // Call the function when the DOM is fully loaded
  document.addEventListener("DOMContentLoaded", loadNavbar);
  