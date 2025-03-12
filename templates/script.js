const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const gallery = document.getElementById("gallery");
const deleteBox = document.getElementById("delete-box");

const savedPositions = JSON.parse(localStorage.getItem("imagePositions")) || {};
let currentImageId = null;
let useModifiedDrag = false;

// Create tag form with three fields: price, name, and link
const createForm = () => {
  const formBox = document.createElement("div");
  formBox.classList.add("image-form");
  formBox.innerHTML = `
    <button class="close-button">X</button>
    <label>Price: <input type="text" class="price-input" placeholder="Price"></label>
    <label>Name: <input type="text" class="name-input" placeholder="Name"></label>
    <label>Link: <input type="text" class="link-input" placeholder="Link"></label>
    <button class="save-tags-btn">Save Tags</button>
  `;

  formBox.querySelector(".close-button").addEventListener("click", () => {
    formBox.style.display = "none";
  });

  formBox.querySelector(".save-tags-btn").addEventListener("click", () => {
    if (currentImageId) {
      const price = formBox.querySelector(".price-input").value;
      const name = formBox.querySelector(".name-input").value;
      const link = formBox.querySelector(".link-input").value;

      // Store tags as an object
      savedPositions[currentImageId].tags = { price, name, link };
      savePositions();
      updateTagDisplay(currentImageId, savedPositions[currentImageId].tags);
      formBox.style.display = "none";
    }
  });

  document.body.appendChild(formBox);
  return formBox;
};

const formBox = createForm();

// Event Listeners
dropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

dropZone.addEventListener("dragover", (e) => e.preventDefault());
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
});

// Delete Box Handling (kept for manual drop events)
deleteBox.addEventListener("dragover", (e) => {
  e.preventDefault();
  deleteBox.style.backgroundColor = "#ff0000";
});

deleteBox.addEventListener("dragleave", () => {
  deleteBox.style.backgroundColor = "#f44336";
});

deleteBox.addEventListener("drop", (e) => {
  e.preventDefault();
  deleteBox.style.backgroundColor = "#f44336";
  // Iterate through all containers and delete those overlapping
  document.querySelectorAll(".image-container").forEach((container) => {
    const containerRect = container.getBoundingClientRect();
    const deleteRect = deleteBox.getBoundingClientRect();

    if (elementOverlap(containerRect, deleteRect)) {
      container.remove();
      delete savedPositions[container.dataset.id];
      savePositions();
    }
  });
});

// Helper Function to check overlap
function elementOverlap(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

function handleFiles(files) {
  Array.from(files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => createImageContainer(e.target.result);
    reader.readAsDataURL(file);
  });
}

function createImageContainer(src) {
  const container = document.createElement("div");
  container.classList.add("image-container");

  const img = document.createElement("img");
  img.src = src;

  const resizeHandle = document.createElement("div");
  resizeHandle.classList.add("resize-handle");

  container.append(img, resizeHandle);
  positionContainer(container);
  setupContainerEvents(container);
  gallery.appendChild(container);
}

function positionContainer(container) {
  const x = Math.random() * (gallery.clientWidth - 150);
  const y = Math.random() * (gallery.clientHeight - 150);
  container.style.left = `${x}px`;
  container.style.top = `${y}px`;

  const imgId = `img_${Date.now()}`;
  container.dataset.id = imgId;
  savedPositions[imgId] = {
    src: container.querySelector("img").src,
    x: x,
    y: y,
    width: 150,
    height: 150,
    tags: {},
  };
  savePositions();
}

function setupContainerEvents(container) {
  container.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    currentImageId = container.dataset.id;
    formBox.style.display = "block";
    formBox.style.left = `${e.pageX}px`;
    formBox.style.top = `${e.pageY}px`;

    // Populate form fields if tags already exist
    const tags = savedPositions[currentImageId].tags || {};
    formBox.querySelector(".price-input").value = tags.price || "";
    formBox.querySelector(".name-input").value = tags.name || "";
    formBox.querySelector(".link-input").value = tags.link || "";
  });

  container.addEventListener("mousedown", dragStart);
  container
    .querySelector(".resize-handle")
    .addEventListener("mousedown", resizeStart);
}

function updateTagDisplay(imgId, tags) {
  const container = document.querySelector(`[data-id="${imgId}"]`);
  let tagDisplay = container.querySelector(".tag-display");

  if (!tagDisplay) {
    tagDisplay = document.createElement("div");
    tagDisplay.classList.add("tag-display");
    container.appendChild(tagDisplay);
  }

  tagDisplay.textContent = `Price: ${tags.price || ""}, Name: ${
    tags.name || ""
  }, Link: ${tags.link || ""}`;
}

// Drag and Resize Functions
function dragStart(e) {
  const container = e.currentTarget;
  let offsetX = e.clientX - container.offsetLeft;
  let offsetY = e.clientY - container.offsetTop;

  if (useModifiedDrag) {
    let isDragging = true;

    function moveImage(event) {
      if (!isDragging) return;
      const x = event.clientX - offsetX;
      const y = event.clientY - offsetY;
      container.style.left = `${Math.max(
        0,
        Math.min(gallery.clientWidth - container.offsetWidth, x)
      )}px`;
      container.style.top = `${Math.max(
        0,
        Math.min(gallery.clientHeight - container.offsetHeight, y)
      )}px`;
    }

    window.addEventListener("mousemove", moveImage);
    window.addEventListener(
      "mouseup",
      () => {
        isDragging = false;
        const imgId = container.dataset.id;
        savedPositions[imgId].x = parseInt(container.style.left);
        savedPositions[imgId].y = parseInt(container.style.top);
        savePositions();

        // Check for deletion when mouse is released
        const containerRect = container.getBoundingClientRect();
        const deleteRect = deleteBox.getBoundingClientRect();
        if (elementOverlap(containerRect, deleteRect)) {
          container.remove();
          delete savedPositions[imgId];
          savePositions();
        }

        window.removeEventListener("mousemove", moveImage);
      },
      { once: true }
    );
  } else {
    function moveImage(event) {
      const x = event.clientX - offsetX;
      const y = event.clientY - offsetY;
      container.style.left = `${Math.max(
        0,
        Math.min(gallery.clientWidth - container.offsetWidth, x)
      )}px`;
      container.style.top = `${Math.max(
        0,
        Math.min(gallery.clientHeight - container.offsetHeight, y)
      )}px`;
    }

    moveImage(e);
    window.addEventListener("mousemove", moveImage);
    window.addEventListener(
      "mouseup",
      () => {
        const imgId = container.dataset.id;
        savedPositions[imgId].x = parseInt(container.style.left);
        savedPositions[imgId].y = parseInt(container.style.top);
        savePositions();

        // Check for deletion on mouseup
        const containerRect = container.getBoundingClientRect();
        const deleteRect = deleteBox.getBoundingClientRect();
        if (elementOverlap(containerRect, deleteRect)) {
          container.remove();
          delete savedPositions[imgId];
          savePositions();
        }

        window.removeEventListener("mousemove", moveImage);
      },
      { once: true }
    );
  }
}

function resizeStart(e) {
  e.stopPropagation();
  const container = e.target.parentElement;
  const img = container.querySelector("img");
  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = img.offsetWidth;
  const startHeight = img.offsetHeight;

  function resizeImage(event) {
    const newWidth = Math.max(50, startWidth + (event.clientX - startX));
    const newHeight = Math.max(50, startHeight + (event.clientY - startY));

    img.style.width = `${newWidth}px`;
    img.style.height = `${newHeight}px`;

    const imgId = container.dataset.id;
    savedPositions[imgId].width = newWidth;
    savedPositions[imgId].height = newHeight;
  }

  function stopResize() {
    savePositions();
    window.removeEventListener("mousemove", resizeImage);
    window.removeEventListener("mouseup", stopResize);
  }

  window.addEventListener("mousemove", resizeImage);
  window.addEventListener("mouseup", stopResize);
}

// Persistence
function savePositions() {
  localStorage.setItem("imagePositions", JSON.stringify(savedPositions));
}

// Initial Load: restore images from saved positions
window.onload = () => {
  for (const [id, data] of Object.entries(savedPositions)) {
    const container = document.createElement("div");
    container.classList.add("image-container");
    container.style.left = `${data.x}px`;
    container.style.top = `${data.y}px`;
    container.dataset.id = id;

    const img = document.createElement("img");
    img.src = data.src;
    img.style.width = `${data.width}px`;
    img.style.height = `${data.height}px`;

    const resizeHandle = document.createElement("div");
    resizeHandle.classList.add("resize-handle");

    container.append(img, resizeHandle);
    setupContainerEvents(container);

    if (data.tags) {
      updateTagDisplay(id, data.tags);
    }

    gallery.appendChild(container);
  }
};

// Drag Mode Toggle
const toggleSwitch = document.createElement("input");
toggleSwitch.type = "checkbox";
toggleSwitch.id = "drag-switch";
const label = document.createElement("label");
label.setAttribute("for", "drag-switch");
label.textContent = "Modified Drag";

document.body.appendChild(toggleSwitch);
document.body.appendChild(label);

toggleSwitch.addEventListener("change", (event) => {
  useModifiedDrag = event.target.checked;
});
