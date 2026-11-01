const buttonText = document.getElementById("buttonText");

function updateUI(state) {
    if (state === "idle") {
        buttonText.textContent = "Select Text";
    } else if (state === "selected") {
        buttonText.textContent = "Read";
    } else if (state === "reading") {
        buttonText.textContent = "Reading...";
    }
}

updateUI("idle");
