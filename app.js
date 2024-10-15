let allBooks = [];
let filteredBooks = [];
let currentPage = 1;
const booksPerPage = 10; 
let totalBooks = 0;
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
const apiBooksPerPage = 32; // API default books per page
let searchTimeout;

// On DOM load, fetch the books
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get('page')) || 1; 
  currentPage = page;

  fetchAllBooks();
});

// Function to fetch books from multiple pages of the API
function fetchAllBooks(page = 1) {
  document.getElementById("loading-spinner").classList.remove("hidden");

  // Set how many pages you want to fetch (based on totalBooks or just an assumption)
  const totalPagesToFetch = 5; 

  const fetchPromises = [];
  for (let i = 1; i <= totalPagesToFetch; i++) {
    fetchPromises.push(fetch(`https://gutendex.com/books?page=${i}`).then(response => response.json()));
  }

  Promise.all(fetchPromises)
    .then((responses) => {
      allBooks = responses.reduce((acc, data) => acc.concat(data.results), []);
      totalBooks = responses[0].count; 

      filteredBooks = allBooks;
      displayBooks(filteredBooks);
      createPagination(Math.ceil(totalBooks / booksPerPage), currentPage);
      populateGenres();
    })
    .catch((error) => console.error("Error fetching books:", error))
    .finally(() => {
      document.getElementById("loading-spinner").classList.add("hidden");
    });
}

// Display books on the page
function displayBooks(books) {
  const bookContainer = document.getElementById("book-list");
  bookContainer.innerHTML = "";
  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const paginatedBooks = books.slice(startIndex, endIndex);
  if (paginatedBooks.length === 0) {
    bookContainer.innerHTML = `<div class="col-span-full text-center text-gray-500">No books found</div>`;
    return;
  }
  paginatedBooks.forEach((book) => {
    const bookItem = document.createElement("div");
    bookItem.classList.add("book-item");
    const isWishlisted = wishlist.some((b) => b.id === book.id);

   
    // Extract genre from subjects or bookshelves
    let genre = "Unknown"; 
    if (book.subjects && book.subjects.length > 0) {
      genre = book.subjects[0]; 
    } else if (book.bookshelves && book.bookshelves.length > 0) {
      genre = book.bookshelves[0]; 
    }

    // Extract and truncate title
    const fullTitle = book.title;
    const truncatedTitle = fullTitle.length > 80 ? `${fullTitle.substring(0, 80)}...` : fullTitle;

    bookItem.innerHTML = `
      <img src="${book.formats["image/jpeg"] || "default_cover.jpg"}" alt="${book.title}" class="book-cover mb-4"/>
      <h3 class="text-md text-center font-bold mb-1 mt-2">
        <span class="full-title hidden">${fullTitle}</span>
        <span class="truncated-title">${truncatedTitle}</span>
        ${fullTitle.length > 100 ? `<button class="text-blue-500 underline read-more" onclick="toggleTitle(this)">Read More</button>` : ''}
      </h3>
      <p class="text-gray-600 text-center mb-1">Author: ${book.authors.length ? book.authors[0].name : "Unknown"}</p>
     <p class="text-gray-600 text-center mb-1">Genre: ${genre}</p>
      <div class="flex justify-between mt-4">
        <p class="text-gray-600 book-card-id">ID: ${book.id}</p>
        <button class="wishlist-btn ${isWishlisted ? "active" : ""}" data-id="${book.id}" onclick="toggleWishlist(${book.id})">
          <i class="${isWishlisted ? "fas fa-heart" : "far fa-heart"}"></i>
        </button>
      </div>
    `;

    bookContainer.appendChild(bookItem);
  });
}

// Toggle full title visibility
function toggleTitle(button) {
  const fullTitleSpan = button.previousElementSibling; 
  const truncatedTitleSpan = fullTitleSpan.previousElementSibling; 

  // Toggle visibility
  if (fullTitleSpan.classList.contains("hidden")) {
    fullTitleSpan.classList.remove("hidden");
    truncatedTitleSpan.classList.add("hidden");
    button.textContent = "Read More"; 
  } else {
    fullTitleSpan.classList.add("hidden");
    truncatedTitleSpan.classList.remove("hidden");
    button.textContent = "Read Less"; 
  }
}


// Real-time search for books by title
function filterBooks() {
  const searchQuery = document.getElementById("search-bar").value.trim().toLowerCase();
  
  // Update the URL with the search query
  const url = new URL(window.location);
  if (searchQuery) {
    url.searchParams.set('search', searchQuery); 
  } else {
    url.searchParams.delete('search'); 
  }
  window.history.pushState({}, '', url); 

  if (searchQuery === "") {
    filteredBooks = allBooks;
  } else {
    filteredBooks = allBooks.filter((book) =>
      book.title.toLowerCase().includes(searchQuery)
    );
  }

  currentPage = 1; 
  displayBooks(filteredBooks);
  createPagination(Math.ceil(filteredBooks.length / booksPerPage), currentPage);
}

// API-based search with debounce mechanism
function searchBooks() {
  const searchQuery = document.getElementById("search-bar").value.trim();

  if (searchTimeout) clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    const url = new URL(window.location);
    if (searchQuery === "") {
      filteredBooks = allBooks; 
      url.searchParams.delete('search'); 
      displayBooks(filteredBooks);
      createPagination(Math.ceil(filteredBooks.length / booksPerPage), currentPage);
      window.history.pushState({}, '', url); 
      return;
    }

    url.searchParams.set('search', searchQuery); 
    window.history.pushState({}, '', url); 
    fetch(`https://gutendex.com/books?search=${encodeURIComponent(searchQuery)}`)
      .then(response => response.json())
      .then(data => {
        filteredBooks = data.results;
        totalBooks = data.count;
        currentPage = 1; 

        displayBooks(filteredBooks);
        createPagination(Math.ceil(totalBooks / booksPerPage), currentPage);
      })
      .catch(error => console.error("Error fetching search results:", error));
  }, 300); // Debounce time in milliseconds
}

// On DOM load, fetch the books and handle any search parameters in the URL
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get('page')) || 1; 
  const searchQuery = urlParams.get('search') || ''; 
  currentPage = page;

  if (searchQuery) {
    document.getElementById("search-bar").value = searchQuery; 
    filterBooks(); 
  } else {
    fetchAllBooks(); 
  }
});


// Populate genres in the dropdown dynamically
function populateGenres() {
  const genreFilter = document.getElementById("genre-filter");
  const genres = new Set(); 

  allBooks.forEach((book) => {
    if (book.subjects && book.subjects.length > 0) {
      book.subjects.forEach((subject) => genres.add(subject));
    } else if (book.bookshelves && book.bookshelves.length > 0) {
      book.bookshelves.forEach((shelf) => genres.add(shelf));
    }
  });

  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });
}

// Filter by genre
function filterByGenre() {
  const selectedGenre = document.getElementById("genre-filter").value;
  filteredBooks = selectedGenre
    ? allBooks.filter((book) => 
        (book.subjects && book.subjects.includes(selectedGenre)) || 
        (book.bookshelves && book.bookshelves.includes(selectedGenre))
      )
    : allBooks;

  currentPage = 1;
  displayBooks(filteredBooks);
  createPagination(Math.ceil(filteredBooks.length / booksPerPage), currentPage);
}

// Create pagination
function createPagination(totalPages, currentPage) {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  const prevButton = document.createElement("button");
  prevButton.innerHTML = "Previous";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => goToPage(currentPage - 1));
  paginationContainer.appendChild(prevButton);

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

  const url = new URL(window.location);
  url.searchParams.set('page', currentPage);
  window.history.pushState({}, '', url); 

  fetchAllBooks();
}

// Toggle wishlist
function toggleWishlist(bookId) {
  const book = allBooks.find((b) => b.id === bookId);
  if (!book) return;

  const isBookInWishlist = wishlist.some((b) => b.id === bookId);
  if (isBookInWishlist) {
    wishlist = wishlist.filter((b) => b.id !== bookId);
    showToast(`Removed "${book.title}" from your wishlist!`, "red-600");
  } else {
    wishlist.push(book);
    showToast(`Added "${book.title}" to your wishlist!`, "green-600");
  }
  
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  displayBooks(filteredBooks); // Refresh the books display
}

// Toast notifications for wishlist updates
function showToast(message, color) {
  const toast = document.createElement("div");
  toast.classList.add("toast", `bg-${color}`);
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
