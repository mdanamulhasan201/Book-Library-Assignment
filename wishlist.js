// Get wishlist from localStorage
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

function displayWishlist(showSpinner = true) {
  const wishlistContainer = document.getElementById("wishlist-container");
  if (showSpinner) {
    document.getElementById("loading-spinner").classList.remove("hidden");
  }

  wishlistContainer.innerHTML = "";
  setTimeout(() => {
    if (wishlist.length === 0) {
      wishlistContainer.innerHTML =
        "<tr><td colspan='6' class='text-center py-2'>No books in your wishlist!</td></tr>";
    } else {
      wishlist.forEach((book, index) => {
        const bookRow = document.createElement("tr");
        bookRow.classList.add("border-b", "border-gray-300");
        bookRow.id = `book-${book.id}`;

        bookRow.innerHTML = `
          <td class="px-4 py-2 text-center">${index + 1}</td>
          <td class="px-4 py-2 text-center ">
            <img src="${
              book.formats["image/jpeg"] || "default_cover.jpg"
            }" alt="${book.title}" class="w-24 h-32 object-cover mx-auto"/>
          </td>
          <td class="px-4 py-2 text-center">${book.id}</td>
          <td class="px-4 py-2 text-center ">${book.title}</td>
          <td class="px-4 py-2 text-center whitespace-nowrap">${
            book.authors.length ? book.authors[0].name : "Unknown"
          }</td>
          <td class="px-4 py-2 text-center">
            <div class="flex flex-col items-center space-y-1"> 
              <a href="book-details.html?id=${
                book.id
              }" class="text-blue-500 hover:underline">View Details</a>
              <button class="text-red-500 hover:underline" onclick="removeFromWishlist(${
                book.id
              })">Remove</button>
            </div>
          </td>
        `;

        wishlistContainer.appendChild(bookRow);
      });
    }
    document.getElementById("loading-spinner").classList.add("hidden");
  }, 500);
}

function removeFromWishlist(bookId) {
  const index = wishlist.findIndex((book) => book.id === bookId);

  if (index !== -1) {
    const bookRow = document.getElementById(`book-${bookId}`);
    bookRow.classList.add("fade-out");
    setTimeout(() => {
      wishlist.splice(index, 1);
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      bookRow.remove();
      if (wishlist.length === 0) {
        displayWishlist(false);
      }
    }, 500);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  displayWishlist(); 
});
