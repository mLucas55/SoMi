// Helper function to check if two rectangles intersect
function isIntersecting(rect1, rect2) {
  return !(
    rect2.left > rect1.right ||
    rect2.right < rect1.left ||
    rect2.top > rect1.bottom ||
    rect2.bottom < rect1.top
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const gallery = document.getElementById("gallery");

  // Retrieve saved positions or initialize an empty object
  const savedPositions =
    JSON.parse(localStorage.getItem("imagePositions")) || {};

  dropZone.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (event) => {
    const files = event.target.files;
    handleFiles(files);
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "green";
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "#ccc";
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "#ccc";
    const files = e.dataTransfer.files;
    handleFiles(files);
  });

  function handleFiles(files) {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const container = document.createElement("div");
        container.classList.add("image-container");

        const img = document.createElement("img");
        img.src = e.target.result;
        img.alt = "Gallery image";

        const resizeHandle = document.createElement("div");
        resizeHandle.classList.add("resize-handle");

        container.append(img, resizeHandle);

        // Position image randomly within gallery boundaries
        container.style.left = `${
          Math.random() * (gallery.clientWidth - 150)
        }px`;
        container.style.top = `${
          Math.random() * (gallery.clientHeight - 150)
        }px`;

        container.addEventListener("mousedown", dragStart);
        resizeHandle.addEventListener("mousedown", resizeStart);

        const imgId = `img_${Date.now()}`;
        container.dataset.id = imgId;
        savedPositions[imgId] = {
          src: img.src,
          x: parseInt(container.style.left),
          y: parseInt(container.style.top),
          width: 150,
          height: 150,
        };

        gallery.appendChild(container);
        savePositions();
      };
      reader.readAsDataURL(file);
    });
  }

  function dragStart(e) {
    const container = e.currentTarget;
    const offsetX = e.clientX - container.offsetLeft;
    const offsetY = e.clientY - container.offsetTop;

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

    // Move immediately for smooth dragging
    moveImage(e);

    function stopDrag() {
      // Check if the container is over the delete box
      const deleteBox = document.getElementById("delete-box");
      if (deleteBox) {
        const deleteRect = deleteBox.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (isIntersecting(deleteRect, containerRect)) {
          // Remove container from DOM and saved positions if intersecting delete box
          container.remove();
          delete savedPositions[container.dataset.id];
          savePositions();
          window.removeEventListener("mousemove", moveImage);
          window.removeEventListener("mouseup", stopDrag);
          return;
        }
      }
      // Otherwise, update the position in savedPositions
      savedPositions[container.dataset.id].x = parseInt(container.style.left);
      savedPositions[container.dataset.id].y = parseInt(container.style.top);
      savePositions();
      window.removeEventListener("mousemove", moveImage);
      window.removeEventListener("mouseup", stopDrag);
    }

    window.addEventListener("mousemove", moveImage);
    window.addEventListener("mouseup", stopDrag, { once: true });
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

  function savePositions() {
    localStorage.setItem("imagePositions", JSON.stringify(savedPositions));
  }

  // Load saved images with their positions when the page loads
  Object.entries(savedPositions).forEach(([id, data]) => {
    const container = document.createElement("div");
    container.classList.add("image-container");

    const img = document.createElement("img");
    img.src = data.src;
    img.alt = "Gallery image";
    img.style.width = `${data.width}px`;
    img.style.height = `${data.height}px`;

    const resizeHandle = document.createElement("div");
    resizeHandle.classList.add("resize-handle");

    container.append(img, resizeHandle);
    container.style.left = `${data.x}px`;
    container.style.top = `${data.y}px`;
    container.dataset.id = id;

    container.addEventListener("mousedown", dragStart);
    resizeHandle.addEventListener("mousedown", resizeStart);

    gallery.appendChild(container);
  });
});
