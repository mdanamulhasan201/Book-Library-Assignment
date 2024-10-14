// Get book ID from URL
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get("id");

function fetchBookDetails(bookId) {
  const loadingSpinner = document.getElementById("loading-spinner");
  const bookDetailsContainer = document.getElementById("book-details");

  // Show the loading spinner
  loadingSpinner.classList.remove("hidden");
  bookDetailsContainer.innerHTML = ""; // Clear any previous content

  fetch(`https://gutendex.com/books/${bookId}`)
    .then((response) => response.json())
    .then((book) => {
      displayBookDetails(book);
    })
    .catch((error) => {
      console.error("Error fetching book details:", error);
      bookDetailsContainer.innerHTML = "<p class='text-red-500'>Error loading book details.</p>";
    })
    .finally(() => {
      // Hide the loading spinner once the data is fetched or an error occurs
      loadingSpinner.classList.add("hidden");
    });
}

// Display book details on the page
function displayBookDetails(book) {
  const bookDetailsContainer = document.getElementById("book-details");

  let genre;
  if (book.subjects && book.subjects.length > 0) {
    genre = book.subjects[0];
  } else if (book.bookshelves && book.bookshelves.length > 0) {
    genre = book.bookshelves[0];
  } else {
    genre = "Unknown";
  }

  bookDetailsContainer.innerHTML = `
    <img src="${book.formats["image/jpeg"] || "default_cover.jpg"}" alt="${book.title}" class="w-96 mx-auto mb-4"/>
    <h1 class="text-lg font-bold mb-2">${book.title}</h1>
    <p class="text-gray-600 mb-2">Author: ${book.authors.length ? book.authors[0].name : "Unknown"}</p>
    <p class="text-gray-600 mb-2">Genre: ${genre}</p>
    <p class="text-gray-600 mb-2">ID: ${book.id}</p>
    <p class="text-gray-600 mb-2">Download Links:</p>
    <ul class="list-disc list-inside">
      ${Object.keys(book.formats).map(format => `<li><a href="${book.formats[format]}" target="_blank" class="text-blue-500 hover:underline">${format}</a></li>`).join('')}
    </ul>
    <a href="wishlist.html" class="btn-back text-blue-500 hover:underline mt-4 block">Back to Wishlist</a>
  `;
}

// On DOMContentLoaded, fetch book details
document.addEventListener("DOMContentLoaded", () => {
  fetchBookDetails(bookId);
});
