let allBooks = [];
let filteredBooks = [];
let currentPage = 1;
let totalBooks = 0;
let totalPages = 0;  
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let searchTimeout;

// On DOM load, fetch the books
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get('page')) || 1; 
  currentPage = page;

  fetchBooksByPage(currentPage);
});


// Function to fetch books for the specific page from the API
function fetchBooksByPage(page = 1) {
  return new Promise((resolve, reject) => {
    document.getElementById("loading-spinner").classList.remove("hidden");

    fetch(`https://gutendex.com/books?page=${page}`)
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        allBooks = data.results;  
        totalBooks = data.count;  
        totalPages = Math.ceil(totalBooks / data.results.length);  
        const selectedGenre = document.getElementById("genre-filter").value;
        if (selectedGenre) {
          filteredBooks = allBooks.filter(book => 
            (book.subjects && book.subjects.includes(selectedGenre)) || 
            (book.bookshelves && book.bookshelves.includes(selectedGenre))
          );
        } else {
          filteredBooks = allBooks; 
        }
        displayBooks(filteredBooks);  
        createPagination(totalPages, currentPage); 
        populateGenres(); 
        resolve();
      })
      .catch(error => {
        console.error("Error fetching books:", error);
        alert("Failed to fetch books. Please try again later.");
        reject(error);
      })
      .finally(() => {
        document.getElementById("loading-spinner").classList.add("hidden");
      });
  });
}

// Display books on the page
function displayBooks(books) {
  const bookContainer = document.getElementById("book-list");
  bookContainer.innerHTML = "";
  if (books.length === 0) {
    bookContainer.innerHTML = `<div class="col-span-full text-center text-gray-500">No books found</div>`;
    return;
  }

  books.forEach((book) => {
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
    const truncatedTitle = fullTitle.length > 60 ? `${fullTitle.substring(0, 60)}...` : fullTitle;
    bookItem.innerHTML = `
      <img src="${book.formats["image/jpeg"] || "default_cover.jpg"}" alt="${book.title}" class="book-cover mb-4"/>
      <h3 class="text-md text-center font-bold mt-2">
        <span class="full-title hidden">${fullTitle}</span>
        <span class="truncated-title">${truncatedTitle}</span>
        ${fullTitle.length > 60 ? `<button class="text-blue-500 underline read-more" onclick="toggleTitle(this)">Read More</button>` : ''}
      </h3>
      <p class="text-gray-500 text-center mt-1"> <span class='font-bold text-sm'>Author:</span> ${book.authors.length ? book.authors[0].name : "Unknown"}</p>
      <p class="text-gray-500 text-center mb-5"><span class='font-bold text-sm'>Genre:</span> ${genre}</p>
      <div class="flex justify-between items-center mb-5">
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
    searchBooks(searchQuery); 
    return; 
  }
  currentPage = 1; 
  displayBooks(filteredBooks);
  createPagination(Math.ceil(filteredBooks.length / booksPerPage), currentPage);
}

// searchBooks function
function searchBooks() {
  const searchQuery = document.getElementById("search-bar").value.trim();
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    document.getElementById("loading-spinner").classList.remove("hidden");
    if (searchQuery.length < 3) {
      filteredBooks = allBooks;
      currentPage = 1; 
      displayBooks(filteredBooks);
      createPagination(totalPages, currentPage);  
      document.getElementById("loading-spinner").classList.add("hidden"); 
      return; 
    }
    // Perform the search
    fetch(`https://gutendex.com/books?search=${encodeURIComponent(searchQuery)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        if (data.results.length === 0) {
          filteredBooks = []; 
          alert("No books found for the given search term.");
        } else {
          filteredBooks = data.results; 
          totalBooks = data.count;
          totalPages = Math.ceil(totalBooks / data.results.length); 
        }
        currentPage = 1; 
        displayBooks(filteredBooks);
        createPagination(totalPages, currentPage); 
      })
      .catch(error => {
        console.error("Error fetching search results:", error);
        alert("Failed to fetch books. Please try again later.");
      })
      .finally(() => {
        document.getElementById("loading-spinner").classList.add("hidden");
      });
  }, 500);
}

// On DOM load, fetch the books and handle any search parameters in the URL
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get('page')) || 1; 
  const searchQuery = urlParams.get('search') || ''; 
  currentPage = page;
  if (searchQuery) {
    document.getElementById("search-bar").value = searchQuery; 
    searchBooks(searchQuery); 
  } else {
    fetchBooksByPage(currentPage); 
  }
});
function clearSearch() {
  document.getElementById("search-bar").value = ""; 
  document.getElementById("loading-spinner").classList.remove("hidden");
  fetchBooksByPage(1) 
    .then(() => {
      filteredBooks = allBooks; 
      currentPage = 1; 
      displayBooks(filteredBooks);
      const totalPages = Math.ceil(totalBooks / filteredBooks.length); 
      createPagination(totalPages, currentPage); 
    })
    .catch(error => console.error("Error fetching all books:", error))
    .finally(() => {
      document.getElementById("loading-spinner").classList.add("hidden");
    });
  const url = new URL(window.location);
  url.searchParams.delete('search'); 
  window.history.pushState({}, '', url); 
}

// Populate genres in the dropdown dynamically
function populateGenres() {
  const genreFilter = document.getElementById("genre-filter");
  genreFilter.innerHTML = ""; 
  // Add "All Genres" option
  const allGenresOption = document.createElement("option");
  allGenresOption.value = ""; 
  allGenresOption.textContent = "All Genres";
  genreFilter.appendChild(allGenresOption);
  const genres = new Set(); 

  // Extract genres from allBooks
  allBooks.forEach((book) => {
    if (book.subjects && book.subjects.length > 0) {
      book.subjects.forEach((subject) => genres.add(subject));
    } else if (book.bookshelves && book.bookshelves.length > 0) {
      book.bookshelves.forEach((shelf) => genres.add(shelf));
    }
  });

  // Add options to the genre filter dropdown
  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });
}

// Filter by genre when the user selects a genre
function filterByGenre() {
  const selectedGenre = document.getElementById("genre-filter").value;
  const url = new URL(window.location);
  if (selectedGenre) {
    url.searchParams.set('genre', selectedGenre); 
  } else {
    url.searchParams.delete('genre'); 
  }
  window.history.pushState({}, '', url); 
  if (selectedGenre) {
    filteredBooks = allBooks.filter(book => 
      (book.subjects && book.subjects.includes(selectedGenre)) || 
      (book.bookshelves && book.bookshelves.includes(selectedGenre))
    );
  } else {
    filteredBooks = allBooks; 
  }
  displayBooks(filteredBooks); 
  createPagination(Math.ceil(filteredBooks.length / booksPerPage), currentPage); 
}

// Create pagination
function createPagination(totalPages, currentPage) {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";
  // Previous Button
  const prevButton = document.createElement("button");
  prevButton.innerHTML = "Previous";
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => goToPage(currentPage - 1));
  paginationContainer.appendChild(prevButton);
  // Page buttons
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
  // Next Button
  const nextButton = document.createElement("button");
  nextButton.innerHTML = "Next";
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => goToPage(currentPage + 1));
  paginationContainer.appendChild(nextButton);
}
//specific page
function goToPage(page) {
  if (page < 1 || page > totalPages) return;  
  currentPage = page;
  const url = new URL(window.location);
  url.searchParams.set('page', currentPage);
  window.history.pushState({}, '', url); 
  fetchBooksByPage(currentPage);
}
// Toggle wishlist
function toggleWishlist(bookId) {
  const book = allBooks.find((b) => b.id === bookId);
  if (!book) return;
  const isBookInWishlist = wishlist.some((b) => b.id === bookId);
  if (isBookInWishlist) {
    wishlist = wishlist.filter((b) => b.id !== bookId);
    showToast(`Removed book from your wishlist!`, "red-600");
  } else {
    wishlist.push(book);
    showToast(`Added book to your wishlist!`, "green-600");
  }
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  displayBooks(filteredBooks); 
}

function showToast(message, color) {
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  //Toast element
  const toast = document.createElement("div");
  toast.classList.add(
    "toast", 
    "fixed",
    "top-4",
    "right-4",
    "bg-white",
    `border-l-4`,
    `border-${color}`,
    "shadow-lg",
    "rounded-lg",
    "p-4",
    "text-gray-800",
    "transition-all", 
    "duration-300", 
    "ease-in-out", 
    "opacity-0",
    "transform",
    "translate-y-[-20px]", 
    "z-50" 
  );

  //Message element
  const messageElement = document.createElement("span");
  messageElement.innerText = message;
  toast.appendChild(messageElement);
  //Close button
  const closeButton = document.createElement("button");
  closeButton.innerHTML = '&times;'; 
  closeButton.classList.add(
    "ml-4",
    "text-gray-500",
    "hover:text-gray-700",
    "focus:outline-none",
    "text-xl"
  );

  // Close button event
  closeButton.addEventListener("click", () => {
    toast.classList.remove("opacity-100");
    toast.classList.add("opacity-0", "translate-y-2"); 
    setTimeout(() => {
      toast.remove(); 
    }, 300); 
  });
  toast.appendChild(closeButton);
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-[-20px]"); 
    toast.classList.add("opacity-100", "translate-y-0");
  });
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove("opacity-100");
      toast.classList.add("opacity-0", "translate-y-2"); 
      setTimeout(() => {
        toast.remove(); 
      }, 300); 
    }
  }, 3000);
}

