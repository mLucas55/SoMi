document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll(".draggable");

  images.forEach(image => {
      let isDragging = false;
      let isResizing = false;
      let offsetX, offsetY;
      let initialWidth, initialHeight, initialX, initialY;

      image.style.position = "absolute"; // Ensure the image can be moved

      image.addEventListener("mousedown", (e) => {
        if(e.button == 0) // Left Click, for dragging and resizing
        {
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
        
        }
        else if(e.button == 1) // Right click, for tag menu
        {
          // TBD
        }
        
      });

      // Mouse movement tracking for image dragging
      function onMouseMove(e) {
          if (isDragging) {
              image.style.left = (e.clientX - offsetX) + "px";
              image.style.top = (e.clientY - offsetY) + "px";
          }
      }

      // Resets dragging state
      function onMouseUp() {
          isDragging = false;
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
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