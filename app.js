let allBooks = [];
let filteredBooks = [];
let currentPage = 1;
const booksPerPage = 10; 
let totalBooks = 0; 
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

// On DOM load, fetch the books
document.addEventListener("DOMContentLoaded", () => {
  fetchBooks();
});

// Fetch books from the API
function fetchBooks(page = 1) {
    // Show the loading spinner
    document.getElementById("loading-spinner").classList.remove("hidden");
  
    fetch(`https://gutendex.com/books?page=${page}`)
      .then((response) => response.json())
      .then((data) => {
        allBooks = data.results;
        totalBooks = data.count;
        filteredBooks = allBooks;
        displayBooks(filteredBooks);
        createPagination(Math.ceil(totalBooks / booksPerPage), currentPage);
        populateGenres();
      })
      .catch((error) => console.error("Error fetching books:", error))
      .finally(() => {
        // Hide the loading spinner once the books are loaded
        document.getElementById("loading-spinner").classList.add("hidden");
      });
  }
  

// Display books on the page
function displayBooks(books) {
  const bookContainer = document.getElementById("book-list");
  bookContainer.innerHTML = ""; // Clear previous books

  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;

  const paginatedBooks = books.slice(startIndex, endIndex);
  // Check if there are no books to display after filtering
  if (paginatedBooks.length === 0) {
    bookContainer.innerHTML = `
      <div class="col-span-full text-center text-gray-500">
       “No books found”
      </div>`;
    return;
  }
  paginatedBooks.forEach((book) => {
    const bookItem = document.createElement("div");
    bookItem.classList.add("book-item");
    const isWishlisted = wishlist.some((b) => b.id === book.id);

    // Extract genre from subjects or bookshelves
    let genre;
    if (book.subjects && book.subjects.length > 0) {
      genre = book.subjects[0]; 
    } else if (book.bookshelves && book.bookshelves.length > 0) {
      genre = book.bookshelves[0]; 
    } else {
      genre = "Unknown";
    }

    bookItem.innerHTML = `
      <img src="${book.formats["image/jpeg"] || "default_cover.jpg"}" alt="${book.title}" class="book-cover mb-4"/>
      <h3 class="text-md text-center font-bold mb-1 mt-2">${book.title}</h3>
      <p class="text-gray-600 text-center mb-1">Author: ${book.authors.length ? book.authors[0].name : "Unknown"}</p>
      <p class="text-gray-600 text-center mb-1">Genre: ${genre}</p>
      <div class="flex justify-between items-center">
        <p class="text-gray-600 mb-1 book-card-id ">ID: ${book.id}</p>
        <button class="wishlist-btn ${isWishlisted ? "active" : ""}" data-id="${book.id}" onclick="toggleWishlist(${book.id})">
          <i class="${isWishlisted ? "fas fa-heart" : "far fa-heart"}"></i>
        </button>
      </div>
    `;

    bookContainer.appendChild(bookItem);
  });
}

// Create pagination
function createPagination(totalPages, currentPage) {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  // Create previous button
  const prevButton = document.createElement("button");
  prevButton.innerHTML = "Previous";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => goToPage(currentPage - 1));
  paginationContainer.appendChild(prevButton);

  // Create page buttons
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      const pageButton = document.createElement("button");
      pageButton.textContent = i;
      if (i === currentPage) {
        pageButton.classList.add("active");
      }
      pageButton.addEventListener("click", () => goToPage(i));
      paginationContainer.appendChild(pageButton);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      const dots = document.createElement("button");
      dots.textContent = "...";
      dots.disabled = true;
      paginationContainer.appendChild(dots);
    }
  }

  // Create next button
  const nextButton = document.createElement("button");
  nextButton.innerHTML = "Next";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => goToPage(currentPage + 1));
  paginationContainer.appendChild(nextButton);
}

// Go to a specific page
function goToPage(page) {
  if (page < 1 || page > Math.ceil(totalBooks / booksPerPage)) return; 
  currentPage = page;
  fetchBooks(currentPage); 
}

// Populate genres in the dropdown (static genres as API doesn't provide dynamic genres)
function populateGenres() {
  const genreFilter = document.getElementById("genre-filter");
  const genres = ["Fiction", "Non-fiction", "Mystery", "Adventure"]; 
  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });
}

// Filter books by title
function filterBooks() {
  const searchQuery = document.getElementById("search-bar").value.toLowerCase();
  filteredBooks = allBooks.filter((book) =>
    book.title.toLowerCase().includes(searchQuery)
  );
  currentPage = 1;
  displayBooks(filteredBooks);
  createPagination(Math.ceil(filteredBooks.length / booksPerPage), currentPage); 
}

// Filter by genre
function filterByGenre() {
  const selectedGenre = document.getElementById("genre-filter").value;
  filteredBooks = selectedGenre
    ? allBooks.filter(
        (book) => book.subjects && book.subjects.includes(selectedGenre)
      )
    : allBooks;
  currentPage = 1;
  displayBooks(filteredBooks);
  createPagination(Math.ceil(filteredBooks.length / booksPerPage), currentPage);
}

// Show toast notification
function showToast(message, type) {
  const toast = document.createElement("div");
  toast.className = `flex items-center p-4 mb-4 text-sm text-white bg-${type} rounded-lg shadow-md`;
  toast.innerHTML = `
    <span class="mr-2">${message}</span>
    <button class="text-white hover:bg-opacity-70" onclick="this.parentElement.remove();">
      <i class="fas fa-times"></i>
    </button>
  `;
  document.getElementById("toast-container").appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Toggle wishlist
function toggleWishlist(bookId) {
  const book = allBooks.find((b) => b.id === bookId);
  if (!book) return;

  const isBookInWishlist = wishlist.some((b) => b.id === bookId);
  if (isBookInWishlist) {
    // Remove from wishlist
    wishlist = wishlist.filter((b) => b.id !== bookId);
    showToast(`Removed "${book.title}" from your wishlist!`, "red-600"); 
  } else {
    // Add to wishlist
    wishlist.push(book);
    showToast(`Added "${book.title}" to your wishlist!`, "green-600"); 
  }
  
  // Update localStorage
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  displayBooks(filteredBooks);
}

