const selectBtn = document.getElementById("selectBtn");

const statusBadge = document.getElementById("statusBadge");
const statusIcon = document.getElementById("statusIcon");

const statusTitle = document.getElementById("statusTitle");
const statusDescription = document.getElementById("statusDescription");

const buttonText = document.getElementById("buttonText");


let readingState = "idle";


function updateUI(state) {

    readingState = state;

    if (state === "idle") {

        statusBadge.textContent = "Idle";
        statusBadge.className = "status-badge";

        statusIcon.textContent = "◎";

        statusTitle.textContent = "No text selected";

        statusDescription.textContent =
            "Select text from the webpage to get started.";

        buttonText.textContent = "Select Text";

    }

    else if (state === "selected") {

        statusBadge.textContent = "Selected";
        statusBadge.className = "status-badge selected";

        statusIcon.textContent = "✓";

        statusTitle.textContent = "Text selected";

        statusDescription.textContent =
            "Your selection is ready to read.";

        buttonText.textContent = "Read";

    }

    else if (state === "reading") {

        statusBadge.textContent = "Reading";

        statusIcon.textContent = "▶";

        statusTitle.textContent = "Reading in progress";

        statusDescription.textContent =
            "Your reading session is active.";

        buttonText.textContent = "Reading...";

    }

}


selectBtn.addEventListener("click", () => {

    if (readingState === "idle") {

        statusDescription.textContent =
            "Webpage selection will be connected in the next milestone.";

    }

});


updateUI("idle");