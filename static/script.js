document.addEventListener("DOMContentLoaded", () => {
    const images = document.querySelectorAll(".draggable");

    images.forEach(image => {
        let isDragging = false;
        let offsetX, offsetY;

        image.style.position = "absolute"; // Ensure the image can be moved

        image.addEventListener("mousedown", (e) => {
            e.preventDefault(); // Prevent default image dragging

            // Calculate the offset relative to the mouse click
            offsetX = e.clientX - image.getBoundingClientRect().left;
            offsetY = e.clientY - image.getBoundingClientRect().top;
            isDragging = true;

            // Bring the clicked image to the front
            image.style.zIndex = "1000";

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });

        function onMouseMove(e) {
            if (isDragging) {
                image.style.left = (e.clientX - offsetX) + "px";
                image.style.top = (e.clientY - offsetY) + "px";
            }
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }
    });
});
