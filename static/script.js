document.addEventListener("DOMContentLoaded", () => {
  //image uploading
  // --- Drag & Drop Upload Handling ---
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");

  // Click handler for drop zone
  dropZone.addEventListener("click", () => fileInput.click());

  // File input change handler
  fileInput.addEventListener("change", function (e) {
    handleFiles(e.target.files);
  });

  // Drag & drop handlers
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = "#e0e0e0";
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.style.backgroundColor = "#f9f9f9";
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = "#f9f9f9";
    handleFiles(e.dataTransfer.files);
  });

  function handleFiles(files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append("file", file);
    }

    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.ok && window.location.reload())
      .catch((error) => console.error("Upload failed:", error));
  }

  // Retrieve saved tags from localStorage or create an empty object
  const savedTags = JSON.parse(localStorage.getItem("imageTags")) || {};
  let currentImageId = null;

  // Create the tag form (floating overlay)
  const tagForm = createTagForm();

  // Get all draggable images
  const images = document.querySelectorAll(".draggable");

  // keeps track of current image
  let idCounter = 0;
  images.forEach((image) => {
    let isDragging = false;
    let isResizing = false;
    let offsetX, offsetY;
    let initialWidth, initialHeight, initialX, initialY;

    image.style.position = "absolute"; // Ensure the image can be moved

    // Assigns an ID to an image, if it lacks one
    if (!image.dataset.id) {
      image.dataset.id = "img_" + idCounter++;
    }

    // updates tags in real time
    if (savedTags[image.dataset.id]) {
      updateTagDisplay(image, savedTags[image.dataset.id]);
    }

    image.addEventListener("mousedown", (e) => {
      if (e.button == 0) {
        // Left Click, for dragging and resizing
        e.preventDefault(); // Prevent default image dragging

        const rect = image.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check if the click is in the bottom-right corner (resize zone: last 10px)
        // NEEDS A VISUAL
        if (clickX > rect.width - 10 && clickY > rect.height - 10) {
          isResizing = true;
          initialWidth = rect.width;
          initialHeight = rect.height;
          initialX = e.clientX;
          initialY = e.clientY;
          image.style.zIndex = "1000";
          document.addEventListener("mousemove", onMouseResize);
          document.addEventListener("mouseup", onMouseResizeEnd);
        } else {
          // Otherwise, start dragging
          isDragging = true;
          offsetX = e.clientX - rect.left;
          offsetY = e.clientY - rect.top;
          image.style.zIndex = "1000";
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        }
      } else if (e.button == 2) {
        // Right click, for tag menu
        e.preventDefault();
        openTagForm(e, image);
      }
    });

    // Mouse movement tracking for image dragging
    function onMouseMove(e) {
      if (isDragging) {
        image.style.left = e.clientX - offsetX + "px";
        image.style.top = e.clientY - offsetY + "px";
      }
    }

    // Resets dragging state
    function onMouseUp() {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      // Check if the image is dropped over the delete box
      const deleteBox = document.getElementById("delete-box");
      if (deleteBox) {
        const deleteRect = deleteBox.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        if (
          imageRect.left < deleteRect.right &&
          imageRect.right > deleteRect.left &&
          imageRect.top < deleteRect.bottom &&
          imageRect.bottom > deleteRect.top
        ) {
          image.remove();
          // Remove saved tags from localStorage
          delete savedTags[image.dataset.id];
          localStorage.setItem("imageTags", JSON.stringify(savedTags));
          // NEEDS A CALL TO THE BACKEND TO DELETE THE IMAGE
        }
      }
    }

    // Resize image
    function onMouseResize(e) {
      if (isResizing) {
        let newWidth = initialWidth + (e.clientX - initialX);
        let newHeight = initialHeight + (e.clientY - initialY);
        // Set minimum size limits
        newWidth = Math.max(newWidth, 50);
        newHeight = Math.max(newHeight, 50);
        image.style.width = newWidth + "px";
        image.style.height = newHeight + "px";
      }
    }

    function onMouseResizeEnd() {
      isResizing = false;
      document.removeEventListener("mousemove", onMouseResize);
      document.removeEventListener("mouseup", onMouseResizeEnd);
    }
  });

  // ----- Tag Form Creation and Handling -----

  // Create the floating tag form
  function createTagForm() {
    const formBox = document.createElement("div");
    formBox.classList.add("image-form");
    formBox.innerHTML = `
      <button class="close-button">X</button>
      <label>Price: <input type="text" class="price-input" placeholder="Price"></label>
      <br>
      <label>Name: <input type="text" class="name-input" placeholder="Name"></label>
      <br>
      <label>Link: <input type="text" class="link-input" placeholder="Link"></label>
      <br>
      <button class="save-tags-btn">Save Tags</button>
    `;

    // Close the form when clicking the close button
    formBox.querySelector(".close-button").addEventListener("click", () => {
      formBox.style.display = "none";
    });

    // Save tag data and update localStorage
    formBox.querySelector(".save-tags-btn").addEventListener("click", () => {
      if (currentImageId) {
        const price = formBox.querySelector(".price-input").value;
        const name = formBox.querySelector(".name-input").value;
        const link = formBox.querySelector(".link-input").value;
        // Save tags for the current image
        savedTags[currentImageId] = { price, name, link };
        localStorage.setItem("imageTags", JSON.stringify(savedTags));
        // Update the tag display for the image
        const img = document.querySelector(`[data-id="${currentImageId}"]`);
        if (img) {
          updateTagDisplay(img, savedTags[currentImageId]);
        }
        formBox.style.display = "none";
      }
    });

    document.body.appendChild(formBox);
    return formBox;
  }

  // Open and populate the tag form for a given image
  function openTagForm(e, image) {
    currentImageId = image.dataset.id;
    const existingTags = savedTags[currentImageId] || {};
    tagForm.querySelector(".price-input").value = existingTags.price || "";
    tagForm.querySelector(".name-input").value = existingTags.name || "";
    tagForm.querySelector(".link-input").value = existingTags.link || "";
    // Position the form near the mouse click
    tagForm.style.left = e.pageX + "px";
    tagForm.style.top = e.pageY + "px";
    tagForm.style.display = "block";
  }

  // Update (or create) a tag display element for an image
  function updateTagDisplay(image, tags) {
    // Assume the image is inside a container; if not, you might need to wrap it
    let container = image.parentElement;
    let tagDisplay = container.querySelector(".tag-display");
    if (!tagDisplay) {
      tagDisplay = document.createElement("div");
      tagDisplay.classList.add("tag-display");
      container.appendChild(tagDisplay);
    }
  }
});

// Prevents right click context menu on the HTML page
document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

// hamburger menu
document
  .getElementById("hamburger-menu")
  .addEventListener("click", function () {
    document.getElementById("sidebar").classList.add("active");
  });

document.getElementById("close-menu").addEventListener("click", function () {
  document.getElementById("sidebar").classList.remove("active");
});
