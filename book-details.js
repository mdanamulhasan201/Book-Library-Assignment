// Get book ID from URL
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get("id");

function fetchBookDetails(bookId) {
  const loadingSpinner = document.getElementById("loading-spinner");
  const bookDetailsContainer = document.getElementById("book-details");
  loadingSpinner.classList.remove("hidden");
  bookDetailsContainer.innerHTML = ""; 

  fetch(`https://gutendex.com/books/${bookId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((book) => {
      displayBookDetails(book);
    })
    .catch((error) => {
      console.error("Error fetching book details:", error);
      bookDetailsContainer.innerHTML = "<p class='text-red-500'>Error loading book details.</p>";
    })
    .finally(() => {
      loadingSpinner.classList.add("hidden");
    });
}

function displayBookDetails(book) {
  const bookDetailsContainer = document.getElementById("book-details");

  let genre = "Unknown";
  if (book.subjects && book.subjects.length > 0) {
    genre = book.subjects[0]; 
  } else if (book.bookshelves && book.bookshelves.length > 0) {
    genre = book.bookshelves[0]; 
  }

  // Create HTML content for book details
  bookDetailsContainer.innerHTML = `
    <img src="${book.formats["image/jpeg"] || "default_cover.jpg"}" alt="${book.title}" class="w-96 mx-auto mb-4"/>
<h1 class="text-lg text-center font-bold mb-2">${book.title}</h1>
<p class="text-gray-600 text-center mb-2">Author: ${book.authors.length ? book.authors[0].name : "Unknown"}</p>
<p class="text-gray-600 text-center mb-2">Genre: ${genre}</p>
<p class="text-gray-600 text-center mb-2">ID: ${book.id}</p>
<p class="text-gray-600 text-center mb-2">Download Links:</p>
<ul class="flex flex-col items-center justify-center mb-4">
  ${Object.keys(book.formats).map(format => `<li class="mb-1"><a href="${book.formats[format]}" target="_blank" class="text-blue-500 hover:underline">${format}</a></li>`).join('')}
</ul>
<<a href="wishlist.html" class="btn-back flex justify-center items-center bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 mt-4 w-48 mx-auto">
  Back to Wishlist
</a>



  `;
}

// On DOMContentLoaded, fetch book details
document.addEventListener("DOMContentLoaded", () => {
  if (bookId) {
    fetchBookDetails(bookId);
  } else {
    document.getElementById("book-details").innerHTML = "<p class='text-red-500'>No book ID provided.</p>";
  }
});
