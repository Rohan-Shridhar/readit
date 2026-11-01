# ROADMAP.md

# readit — Word-by-Word Reading Extension

A Chrome browser extension that improves reading accessibility and focus by highlighting webpage text word by word. Users can select a portion of text from any supported webpage and activate a reading mode that visually guides them through the selected content using sequential word highlighting and subtle animations.

---

## Tech Stack

| Component | Technology |
|---|---|
| Extension Platform | Chrome Extension Manifest V3 |
| Frontend | HTML, CSS, JavaScript |
| Webpage Interaction | Chrome Content Scripts |
| Text Selection | JavaScript Selection API |
| Text Processing | JavaScript DOM Range API |
| Word Highlighting | CSS Custom Highlight API |
| Animations | CSS Animations |
| Extension Communication | Chrome Runtime Messaging |
| State Management | Chrome Storage API |
| Version Control | Git & GitHub |
| Development Tools | Chrome DevTools |

**Cost:** Completely free. No external APIs, subscriptions, backend servers, or paid services required.

---

## Project Scope

The extension provides a focused reading experience directly on the webpage without redirecting users to another reader interface or modifying the website's original content.

The user opens the extension popup, activates text selection mode, selects the desired content, and starts reading. The extension processes the selected text into individual words and highlights them sequentially, creating a visual reading guide.

The reading experience can be stopped at any time using the `ESC` key, restoring the webpage to its original appearance.

---

# VERSION 0.1.0 — FOUNDATION

## Phase 0.1.0 — Project Initialization

### Step 0.1.1 — Repository Setup

- [ ] **Objective:** Establish the project structure and initialize the development environment.
- **Prerequisites:** None.
- **Part:** Project Setup.
- **Motive:** Foundation.
- **Description:**
  - Create the GitHub repository.
  - Initialize Git and configure the default branch.
  - Create the initial project structure.
  - Add `.gitignore` and `README.md`.
  - Configure the initial project version.

**Files:**
- `README.md` — Project introduction, features, installation and usage.
- `ROADMAP.md` — Development roadmap.
- `.gitignore` — Ignore unnecessary files.

### Step 0.1.2 — Chrome Extension Configuration

- [ ] **Objective:** Configure the extension using Chrome Manifest V3.
- **Prerequisites:** Step 0.1.1.
- **Part:** Extension Architecture.
- **Motive:** Core Infrastructure.
- **Description:**
  - Create `manifest.json`.
  - Configure extension name, description and version.
  - Define the extension popup.
  - Configure the background service worker.
  - Register content scripts.
  - Configure required permissions and host access.
  - Set up extension icons.

**Files:**
- `manifest.json` — Extension configuration.
- `background/background.js` — Background service worker.
- `assets/icons/` — Extension icons.

### Step 0.1.3 — Popup Interface

- [ ] **Objective:** Build the initial extension popup interface.
- **Prerequisites:** Step 0.1.2.
- **Part:** Frontend.
- **Motive:** User Interface.
- **Description:**
  - Create the popup layout.
  - Implement the initial Select Text button.
  - Design the popup's visual appearance.
  - Display the current selection status.
  - Prepare the interface for switching between selection and reading states.

**Files:**
- `popup/popup.html` — Popup structure.
- `popup/popup.css` — Popup styling.
- `popup/popup.js` — Popup interactions.

### Step 0.1.4 — Content Script Initialization

- [ ] **Objective:** Establish communication between the extension and webpage.
- **Prerequisites:** Step 0.1.2.
- **Part:** Webpage Interaction.
- **Motive:** Core Infrastructure.
- **Description:**
  - Initialize the content script.
  - Implement Chrome Runtime Messaging.
  - Handle messages received from the popup.
  - Establish communication between the background service worker and content script.
  - Verify that scripts execute on supported webpages.

**Files:**
- `content/content.js` — Webpage interaction logic.
- `background/background.js` — Message routing.

---

# VERSION 0.2.0 — TEXT SELECTION & READING ENGINE

## Phase 0.2.0 — Text Selection

### Step 0.2.1 — Selection Mode

- [x] **Objective:** Allow users to select webpage text through the extension.
- **Prerequisites:** Version 0.1.0.
- **Part:** Frontend / Webpage Interaction.
- **Motive:** Core Functionality.
- **Description:**
  - Implement the Select Text button functionality.
  - Enable text selection mode on the active webpage.
  - Close the popup after selection mode is activated.
  - Allow users to select a word, sentence, paragraph or multiple paragraphs.
  - Detect the user's selection using the Selection API.
  - Capture the selected text when the user finishes selecting.
  - Provide visual feedback when text is successfully selected.

**Files:**
- `popup/popup.js` — Selection mode activation.
- `content/content.js` — Selection detection and capture.
- `content/content.css` — Selection mode styling.

### Step 0.2.2 — Selection State Management

- [x] **Objective:** Preserve the selected text and communicate its availability to the popup.
- **Prerequisites:** Step 0.2.1.
- **Part:** Extension Communication.
- **Motive:** State Management.
- **Description:**
  - Store the selected text.
  - Preserve the corresponding DOM Range information inside the content script.
  - Maintain the selection state when the popup is reopened.
  - Update the popup when text is successfully selected.
  - Change the Select Text button to Read.
  - Handle empty selections and selection cancellation.
  - Handle new selections by replacing the previous selection.

**Files:**
- `content/content.js` — Selection state.
- `popup/popup.js` — Dynamic popup state.
- `background/background.js` — Message coordination.

### Step 0.2.3 — Word Processing Engine

- [x] **Objective:** Convert selected text into individually addressable words.
- **Prerequisites:** Step 0.2.2.
- **Part:** Text Processing.
- **Motive:** Reading Engine.
- **Description:**
  - Process the selected text.
  - Identify individual words.
  - Preserve punctuation and whitespace.
  - Maintain the original reading order.
  - Support text spanning multiple HTML elements.
  - Handle bold, italic, linked and other formatted text.
  - Map individual words back to their original DOM positions using text nodes and DOM Ranges.
  - Avoid replacing the original webpage content.

**Files:**
- `content/reading-engine.js` — Word processing and range generation.
- `content/content.js` — Reading engine integration.

## Phase 0.2.1 — Word Highlighting

### Step 0.2.4 — Sequential Word Highlighting

- [x] **Objective:** Highlight selected words sequentially, one word at a time.
- **Prerequisites:** Step 0.2.3.
- **Part:** Reading Engine.
- **Motive:** Core Functionality.
- **Description:**
  - Implement the sequential reading mechanism.
  - Highlight the first word in the selection.
  - Move the highlight to the next word after the configured interval.
  - Continue until the entire selected content has been processed.
  - Remove the previous word's highlight before highlighting the next word.
  - Ensure that only one word is actively highlighted at a time.
  - Handle the end of the selected content.

**Files:**
- `content/reading-engine.js` — Word-by-word execution.
- `content/content.css` — Highlight styling.

### Step 0.2.5 — Reading Animation

- [x] **Objective:** Implement visual effects for the currently active word.
- **Prerequisites:** Step 0.2.4.
- **Part:** Frontend / Animation.
- **Motive:** User Experience.
- **Description:**
  - Implement smooth background highlighting.
  - Add subtle scaling or movement to the active word.
  - Ensure transitions are smooth and visually comfortable.
  - Prevent animation from interfering with the original webpage layout.
  - Keep surrounding text readable.
  - Ensure animations can be removed cleanly after reading.

**Files:**
- `content/content.css` — Animation definitions.
- `content/reading-engine.js` — Animation coordination.

---

# VERSION 0.3.0 — READING CONTROLS

## Phase 0.3.0 — Reading Management

### Step 0.3.1 — Start Reading

- [x] **Objective:** Activate reading mode from the extension popup.
- **Prerequisites:** Version 0.2.0.
- **Part:** Frontend / Extension Communication.
- **Motive:** Core Functionality.
- **Description:**
  - Implement the Read button.
  - Send the reading command to the content script.
  - Start the word-by-word reading engine.
  - Update the popup's reading status.
  - Prevent multiple reading instances from running simultaneously.

**Files:**
- `popup/popup.js` — Read button interaction.
- `content/content.js` — Reading activation.
- `content/reading-engine.js` — Reading execution.

### Step 0.3.2 — Stop Reading with ESC

- [x] **Objective:** Allow users to stop reading immediately using the Escape key.
- **Prerequisites:** Step 0.3.1.
- **Part:** Webpage Interaction.
- **Motive:** Accessibility / User Control.
- **Description:**
  - Register an Escape key listener.
  - Stop the reading process immediately.
  - Cancel active animation timers.
  - Remove all injected highlights.
  - Clear temporary reading states.
  - Restore the webpage to its original appearance.
  - Ensure that pressing ESC when reading is inactive does not interfere with normal webpage behavior.

**Files:**
- `content/content.js` — Keyboard event handling.
- `content/reading-engine.js` — Reading cancellation and cleanup.
- `content/content.css` — Highlight cleanup.

### Step 0.3.3 — Reading Speed

- [x] **Objective:** Allow users to control the speed of word transitions.
- **Prerequisites:** Step 0.3.1.
- **Part:** Frontend / Reading Engine.
- **Motive:** Customization.
- **Description:**
  - Introduce configurable reading speed.
  - Implement a speed control in the popup.
  - Update the delay between consecutive words.
  - Support speed changes while reading is active.
  - Define sensible minimum and maximum speed limits.
  - Set a default reading speed.

**Files:**
- `popup/popup.html` — Speed control.
- `popup/popup.css` — Speed control styling.
- `popup/popup.js` — Speed configuration.
- `content/reading-engine.js` — Transition timing.

### Step 0.3.4 — Pause and Resume

- [x] **Objective:** Allow users to temporarily pause and resume reading.
- **Prerequisites:** Step 0.3.1.
- **Part:** Frontend / Reading Engine.
- **Motive:** User Control.
- **Description:**
  - Introduce Pause and Resume functionality.
  - Preserve the current word position when paused.
  - Resume reading from the previously active word.
  - Update the popup according to the current reading state.
  - Prevent duplicate timers during resume operations.

**Files:**
- `popup/popup.html` — Pause / Resume controls.
- `popup/popup.js` — Control interactions.
- `content/reading-engine.js` — Pause and resume logic.

### Step 0.3.5 — Reading Progress

- [x] **Objective:** Display the user's reading progress.
- **Prerequisites:** Step 0.3.4.
- **Part:** Frontend.
- **Motive:** User Experience.
- **Description:**
  - Track the current word index.
  - Calculate the total number of selected words.
  - Display current progress.
  - Update progress as each word is highlighted.
  - Reset progress when reading is stopped or a new selection is made.

**Files:**
- `popup/popup.html` — Progress indicator.
- `popup/popup.css` — Progress styling.
- `popup/popup.js` — Progress updates.
- `content/reading-engine.js` — Progress tracking.

---

# VERSION 0.4.0 — CUSTOMIZATION & STABILITY

## Phase 0.4.0 — Reading Experience

### Step 0.4.1 — Highlight Customization

- [x] **Objective:** Allow users to customize the active word's appearance.
- **Prerequisites:** Version 0.3.0.
- **Part:** Frontend / Styling.
- **Motive:** Personalization.
- **Description:**
  - Introduce multiple highlight colors.
  - Allow users to select their preferred highlight color.
  - Implement consistent contrast between the text and highlight background.
  - Support different website background colors.
  - Apply the selected appearance during reading.

**Files:**
- `popup/popup.html` — Highlight color options.
- `popup/popup.js` — Color selection.
- `content/content.css` — Highlight themes.

### Step 0.4.2 — Keyboard Navigation

- [x] **Objective:** Introduce additional keyboard controls for reading.
- **Prerequisites:** Step 0.3.4.
- **Part:** Webpage Interaction.
- **Motive:** Accessibility.
- **Description:**
  - Spacebar to pause and resume.
  - Right Arrow to move to the next word.
  - Left Arrow to move to the previous word.
  - Escape to stop reading.
  - Avoid interfering with keyboard interactions outside active reading mode.

**Files:**
- `content/content.js` — Keyboard event handling.
- `content/reading-engine.js` — Word navigation.

### Step 0.4.3 — Automatic Scroll Support

- [x] **Objective:** Keep the active word visible while reading longer content.
- **Prerequisites:** Version 0.3.0.
- **Part:** Webpage Interaction.
- **Motive:** Reading Experience.
- **Description:**
  - Detect when the active word moves outside the visible viewport.
  - Automatically scroll the webpage when necessary.
  - Keep the active word in a comfortable reading position.
  - Avoid unnecessary scrolling.
  - Ensure that the page's original scroll position is preserved when possible.

**Files:**
- `content/reading-engine.js` — Viewport tracking.
- `content/content.js` — Scroll coordination.

## Phase 0.4.1 — Compatibility & Optimization

### Step 0.4.4 — Website Compatibility

- [x] **Objective:** Ensure the extension works across different webpage structures.
- **Prerequisites:** Version 0.2.0.
- **Part:** Testing / Compatibility.
- **Motive:** Reliability.
- **Description:**
  - Test on simple HTML pages.
  - Test on news articles and blogs.
  - Test on dynamically generated webpages.
  - Test text spanning multiple paragraphs.
  - Test nested HTML elements.
  - Handle missing or invalid DOM ranges.
  - Handle pages that dynamically modify selected content.
  - Verify compatibility with supported Chrome versions.

**Files:**
- `content/reading-engine.js` — Compatibility improvements.
- `content/content.js` — Error handling.

### Step 0.4.5 — Performance Optimization

- [x] **Objective:** Improve the extension's performance and resource usage.
- **Prerequisites:** Step 0.4.4.
- **Part:** Optimization.
- **Motive:** Performance.
- **Description:**
  - Optimize word processing for large selections.
  - Avoid unnecessary DOM operations.
  - Minimize repeated style updates.
  - Clean up event listeners and timers.
  - Prevent memory leaks.
  - Optimize message communication.
  - Verify that the extension does not noticeably affect webpage performance.

**Files:**
- `content/reading-engine.js` — Performance improvements.
- `content/content.js` — Event and resource cleanup.
- `popup/popup.js` — Popup optimization.

### Step 0.4.6 — Error Handling

- [x] **Objective:** Handle unexpected situations without breaking the reading experience.
- **Prerequisites:** Step 0.4.4.
- **Part:** Reliability.
- **Motive:** Stability.
- **Description:**
  - Handle unsupported webpages.
  - Handle empty text selections.
  - Handle invalid DOM ranges.
  - Handle missing content scripts.
  - Handle webpage navigation during reading.
  - Handle unexpected popup closure.
  - Ensure that interrupted reading sessions are cleaned up safely.
  - Provide meaningful error messages where appropriate.

**Files:**
- `background/background.js` — Messaging error handling.
- `content/content.js` — Runtime error handling.
- `content/reading-engine.js` — Reading error handling.
- `popup/popup.js` — User-facing error messages.

---

# VERSION 1.0.0 — STABLE RELEASE

## Phase 1.0.0 — Finalization

### Step 1.0.1 — Complete Functional Testing

- [x] **Objective:** Verify that all core features work as expected.
- **Prerequisites:** Version 0.4.0.
- **Part:** Testing.
- **Motive:** Quality Assurance.
- **Description:**
  - Test the complete selection workflow.
  - Test sequential word highlighting.
  - Test all animation effects.
  - Test reading speed configuration.
  - Test Pause and Resume.
  - Test keyboard navigation.
  - Test ESC termination.
  - Test restoration of the original webpage.
  - Test multiple consecutive reading sessions.
  - Verify that no webpage content or formatting is lost.

### Step 1.0.2 — UI & UX Finalization

- [x] **Objective:** Finalize the extension's visual design and usability.
- **Prerequisites:** Step 1.0.1.
- **Part:** Frontend.
- **Motive:** User Experience.
- **Description:**
  - Finalize popup layout.
  - Refine typography and spacing.
  - Improve button states and transitions.
  - Finalize highlight themes.
  - Add appropriate loading and error states.
  - Verify usability at different popup dimensions.

### Step 1.0.3 — Documentation

- [x] **Objective:** Prepare complete project documentation.
- **Prerequisites:** Step 1.0.2.
- **Part:** Documentation.
- **Motive:** Project Presentation.
- **Description:**
  - Complete the README.
  - Document installation instructions.
  - Document all available features.
  - Add screenshots and usage examples.
  - Document keyboard shortcuts.
  - Document supported platforms and limitations.
  - Update the roadmap with completed milestones.

### Step 1.0.4 — Production Build & Release

- [x] **Objective:** Prepare and publish the stable extension release.
- **Prerequisites:** Step 1.0.3.
- **Part:** Deployment.
- **Motive:** Production.
- **Description:**
  - Verify the production extension configuration.
  - Remove development-only files and unnecessary resources.
  - Test the packaged extension.
  - Prepare the production build.
  - Create a GitHub release.
  - Create the `v1.0.0` Git tag.
  - Publish the extension to the Chrome Web Store.
  - Update the changelog.

---

# Release Strategy

Every version follows the development lifecycle:

1. Development
2. Testing
3. Bug Fixing
4. Production Build
5. Deployment
6. Git Tag
7. GitHub Release
8. Changelog Update

## Version Summary

| Version | Milestone | Status |
|---|---|---|
| v0.1.0 | Foundation | Planned |
| v0.2.0 | Text Selection & Reading Engine | Completed |
| v0.3.0 | Reading Controls | Completed |
| v0.4.0 | Customization & Stability | Completed |
| v1.0.0 | Stable Release | Completed |

---

## Future Possibilities

Features that can be explored after the initial stable release:

- **Reading Analytics:** Track words read and reading sessions.
- **Multiple Reading Modes:** Experiment with different word highlighting and focus techniques.
- **Smart Paragraph Detection:** Automatically identify readable content on webpages.
- **Custom Animation Profiles:** Allow users to create their own reading animation styles.
- **Reading History:** Maintain a history of previously selected passages.
- **Text-to-Speech:** Integrate optional speech playback.
- **Accessibility Profiles:** Provide presets for different reading preferences.

---

**Development Philosophy:** Build a lightweight, privacy-friendly browser extension that improves reading focus without disrupting the original browsing experience.
