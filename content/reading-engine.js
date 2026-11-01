/**
 * readit — Reading Engine (v0.4.0)
 * Word-by-word text processing, range mapping, sequential highlighting,
 * multi-theme support, auto-scroll coordination, and robust error recovery.
 */

(function (global) {
    'use strict';

    class ReadingEngine {
        constructor() {
            this.words = [];
            this.currentIndex = -1;
            this.timer = null;
            this.isPlaying = false;
            this.isPaused = false;
            this.speedWpm = 250; // default 250 words per minute
            this.colorTheme = 'yellow';
            this.autoScroll = true;
            this.lastScrolledLineTop = null;
            this.onProgress = null;
            this.onComplete = null;
            this.onError = null;

            this.indicatorElement = null;
            this.highlightName = 'readit-word-highlight';

            this.initHighlightStyle();
        }

        /**
         * Initialize CSS Custom Highlight API and indicator overlay styles.
         */
        initHighlightStyle() {
            if (typeof document === 'undefined') return;

            if (!document.getElementById('readit-engine-styles')) {
                const style = document.createElement('style');
                style.id = 'readit-engine-styles';
                style.textContent = `
                    ::highlight(readit-word-highlight) {
                        background-color: var(--readit-highlight-bg, #ffe066) !important;
                        color: var(--readit-highlight-text, #111111) !important;
                    }
                    .readit-highlight-overlay {
                        position: absolute;
                        pointer-events: none;
                        z-index: 2147483640;
                        border-radius: 4px;
                        transition: all 0.12s cubic-bezier(0.2, 0.8, 0.2, 1);
                        box-sizing: border-box;
                    }
                    .readit-theme-yellow {
                        background-color: rgba(255, 224, 102, 0.42);
                        box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.7), 0 2px 8px rgba(234, 179, 8, 0.3);
                    }
                    .readit-theme-green {
                        background-color: rgba(110, 231, 183, 0.42);
                        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.7), 0 2px 8px rgba(16, 185, 129, 0.3);
                    }
                    .readit-theme-cyan {
                        background-color: rgba(103, 232, 249, 0.42);
                        box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.7), 0 2px 8px rgba(6, 182, 212, 0.3);
                    }
                    .readit-theme-coral {
                        background-color: rgba(254, 205, 211, 0.48);
                        box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.7), 0 2px 8px rgba(244, 63, 94, 0.3);
                    }
                    .readit-theme-purple {
                        background-color: rgba(221, 214, 254, 0.48);
                        box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.7), 0 2px 8px rgba(139, 92, 246, 0.3);
                    }
                `;
                document.head.appendChild(style);
            }
        }

        /**
         * Get or create the visual indicator overlay element.
         */
        getOrCreateIndicator() {
            if (this.indicatorElement && document.body && document.body.contains(this.indicatorElement)) {
                return this.indicatorElement;
            }
            if (typeof document === 'undefined' || !document.body) return null;

            const el = document.createElement('div');
            el.className = `readit-highlight-overlay readit-theme-${this.colorTheme}`;
            el.style.display = 'none';
            document.body.appendChild(el);
            this.indicatorElement = el;
            return el;
        }

        /**
         * Set highlight theme colors.
         * @param {'yellow'|'green'|'cyan'|'coral'|'purple'} theme 
         */
        setTheme(theme) {
            const validThemes = ['yellow', 'green', 'cyan', 'coral', 'purple'];
            this.colorTheme = validThemes.includes(theme) ? theme : 'yellow';

            const themeColors = {
                yellow: { bg: '#ffe066', text: '#111111' },
                green: { bg: '#86efac', text: '#064e3b' },
                cyan: { bg: '#7dd3fc', text: '#082f49' },
                coral: { bg: '#fda4af', text: '#4c0519' },
                purple: { bg: '#d8b4fe', text: '#3b0764' }
            };

            const colors = themeColors[this.colorTheme];
            if (typeof document !== 'undefined' && document.documentElement) {
                document.documentElement.style.setProperty('--readit-highlight-bg', colors.bg);
                document.documentElement.style.setProperty('--readit-highlight-text', colors.text);
            }

            if (this.indicatorElement) {
                this.indicatorElement.className = `readit-highlight-overlay readit-theme-${this.colorTheme}`;
            }
        }

        /**
         * Set reading speed in Words Per Minute.
         * @param {number} wpm 
         */
        setSpeed(wpm) {
            const parsed = parseInt(wpm, 10);
            if (!isNaN(parsed) && parsed >= 60 && parsed <= 1000) {
                this.speedWpm = parsed;
            }
        }

        /**
         * Enable or disable automatic scrolling.
         * @param {boolean} enabled 
         */
        setAutoScroll(enabled) {
            this.autoScroll = Boolean(enabled);
        }

        /**
         * Parse a DOM Range into individually addressable word ranges.
         * Handles complex DOM structures, nested formatting, headings, lists, blockquotes,
         * and preserves original content and reading order without altering DOM nodes.
         * @param {Range} range 
         * @returns {Array<{ index: number, word: string, range: Range, node: Node, startOffset: number, endOffset: number }>}
         */
        processRange(range) {
            if (!range || range.collapsed) {
                this.words = [];
                return [];
            }

            const words = [];
            let commonAncestor = null;
            try {
                commonAncestor = range.commonAncestorContainer;
            } catch (err) {
                console.warn("Readit: Invalid range container", err);
                return [];
            }

            if (!commonAncestor) return [];

            const root = commonAncestor.nodeType === Node.TEXT_NODE
                ? commonAncestor.parentNode
                : commonAncestor;

            if (!root) return [];

            const treeWalker = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;
                        const tag = parent.tagName.toLowerCase();
                        if (['script', 'style', 'noscript', 'textarea', 'input', 'select', 'svg'].includes(tag)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        try {
                            if (range.intersectsNode(node)) {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                        } catch (e) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_REJECT;
                    }
                }
            );

            let currentNode = treeWalker.nextNode();
            if (!currentNode && commonAncestor.nodeType === Node.TEXT_NODE) {
                try {
                    if (range.intersectsNode(commonAncestor)) {
                        currentNode = commonAncestor;
                    }
                } catch (e) {}
            }

            while (currentNode) {
                const text = currentNode.nodeValue;
                if (text && text.trim().length > 0) {
                    let startIdx = 0;
                    let endIdx = text.length;

                    if (currentNode === range.startContainer) {
                        startIdx = Math.max(0, range.startOffset);
                    }
                    if (currentNode === range.endContainer) {
                        endIdx = Math.min(text.length, range.endOffset);
                    }

                    if (startIdx < endIdx) {
                        const slice = text.substring(startIdx, endIdx);
                        const wordRegex = /\S+/g;
                        let match;

                        while ((match = wordRegex.exec(slice)) !== null) {
                            const wordText = match[0];
                            const wordStart = startIdx + match.index;
                            const wordEnd = wordStart + wordText.length;

                            try {
                                const wordRange = document.createRange();
                                wordRange.setStart(currentNode, wordStart);
                                wordRange.setEnd(currentNode, wordEnd);

                                words.push({
                                    index: words.length,
                                    word: wordText,
                                    range: wordRange,
                                    node: currentNode,
                                    startOffset: wordStart,
                                    endOffset: wordEnd
                                });
                            } catch (err) {
                                // Skip detached or invalid sub-ranges gracefully
                            }
                        }
                    }
                }

                currentNode = treeWalker.nextNode();
            }

            this.words = words;
            this.currentIndex = -1;
            this.lastScrolledLineTop = null;
            return words;
        }

        /**
         * Highlight a word by its index.
         * @param {number} index 
         */
        highlightWord(index) {
            if (index < 0 || index >= this.words.length) {
                this.clearHighlight();
                return;
            }

            this.currentIndex = index;
            const item = this.words[index];
            const range = item.range;

            // Check if node is still connected to document (compatibility check)
            if (item.node && typeof item.node.isConnected === 'boolean' && !item.node.isConnected) {
                // If node was modified or detached, skip to next word
                console.warn("Readit: Word node disconnected from DOM, skipping.");
                if (this.isPlaying && !this.isPaused) {
                    this.nextWord();
                }
                return;
            }

            // 1. CSS Custom Highlight API
            if (typeof Highlight !== 'undefined' && typeof CSS !== 'undefined' && CSS.highlights) {
                try {
                    const highlight = new Highlight(range);
                    CSS.highlights.set(this.highlightName, highlight);
                } catch (e) {
                    // Fail gracefully if Highlight API encounters any issue
                }
            }

            // 2. Smooth visual indicator overlay
            try {
                const rect = range.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    const indicator = this.getOrCreateIndicator();
                    if (indicator) {
                        const scrollX = window.scrollX || window.pageXOffset || 0;
                        const scrollY = window.scrollY || window.pageYOffset || 0;
                        const padX = 2;
                        const padY = 2;

                        indicator.style.display = 'block';
                        indicator.style.left = `${rect.left + scrollX - padX}px`;
                        indicator.style.top = `${rect.top + scrollY - padY}px`;
                        indicator.style.width = `${rect.width + padX * 2}px`;
                        indicator.style.height = `${rect.height + padY * 2}px`;

                        // 3. Auto-scroll support
                        if (this.autoScroll) {
                            this.ensureVisible(rect);
                        }
                    }
                }
            } catch (e) {
                // Error boundary for geometry calculation
            }

            if (typeof this.onProgress === 'function') {
                try {
                    this.onProgress({
                        currentIndex: index,
                        totalWords: this.words.length,
                        currentWord: item.word,
                        percentage: Math.round(((index + 1) / this.words.length) * 100)
                    });
                } catch (e) {}
            }
        }

        /**
         * Keep the active word visible and centered in the viewport.
         */
        ensureVisible(rect) {
            if (typeof window === 'undefined') return;
            const viewportHeight = window.innerHeight;
            const topMargin = 120;
            const bottomMargin = 160;

            const isBelow = rect.bottom > viewportHeight - bottomMargin;
            const isAbove = rect.top < topMargin;

            if (isBelow || isAbove) {
                // Throttle scroll per line to avoid jittery movements
                const lineKey = Math.round(rect.top / 30);
                if (this.lastScrolledLineTop !== lineKey) {
                    this.lastScrolledLineTop = lineKey;
                    const scrollTarget = isBelow
                        ? rect.bottom - (viewportHeight / 2)
                        : rect.top - (viewportHeight / 3);

                    window.scrollBy({
                        top: scrollTarget,
                        behavior: 'smooth'
                    });
                }
            }
        }

        /**
         * Calculate delay for word in milliseconds, factoring in punctuation for natural rhythm.
         */
        getWordDelay(word) {
            const baseDelay = (60 / this.speedWpm) * 1000;
            if (!word) return baseDelay;

            // Extra pause on sentence endings (.!?)
            if (/[.!?]$/.test(word)) {
                return baseDelay * 1.5;
            }
            // Slight pause on commas, semicolons, colons
            if (/[,;:]$/.test(word)) {
                return baseDelay * 1.25;
            }
            // Long words (> 10 characters) get slightly more time
            if (word.length > 10) {
                return baseDelay * 1.15;
            }
            return baseDelay;
        }

        /**
         * Start sequential word-by-word reading.
         */
        start(fromIndex = 0) {
            if (this.words.length === 0) {
                if (typeof this.onError === 'function') {
                    this.onError("No words available to read.");
                }
                return;
            }

            this.stopTimers();
            this.isPlaying = true;
            this.isPaused = false;
            this.setTheme(this.colorTheme);

            const startIndex = (fromIndex >= 0 && fromIndex < this.words.length) ? fromIndex : 0;
            this.highlightWord(startIndex);
            this.scheduleNext();
        }

        /**
         * Schedule the next word transition.
         */
        scheduleNext() {
            if (!this.isPlaying || this.isPaused) return;

            const currentWord = this.words[this.currentIndex];
            const delay = this.getWordDelay(currentWord ? currentWord.word : '');

            this.timer = setTimeout(() => {
                const nextIndex = this.currentIndex + 1;
                if (nextIndex < this.words.length) {
                    this.highlightWord(nextIndex);
                    this.scheduleNext();
                } else {
                    this.complete();
                }
            }, delay);
        }

        /**
         * Pause reading while preserving current position.
         */
        pause() {
            if (!this.isPlaying || this.isPaused) return;
            this.isPaused = true;
            this.stopTimers();
        }

        /**
         * Resume reading from the paused word position.
         */
        resume() {
            if (!this.isPlaying || !this.isPaused) return;
            this.isPaused = false;
            this.highlightWord(this.currentIndex);
            this.scheduleNext();
        }

        /**
         * Toggle pause / resume.
         */
        togglePause() {
            if (this.isPaused) {
                this.resume();
            } else if (this.isPlaying) {
                this.pause();
            } else if (this.words.length > 0) {
                this.start(this.currentIndex >= 0 ? this.currentIndex : 0);
            }
        }

        /**
         * Step to next word manually.
         */
        nextWord() {
            if (this.words.length === 0) return;
            const nextIdx = Math.min(this.currentIndex + 1, this.words.length - 1);
            this.highlightWord(nextIdx);
            if (this.isPlaying && !this.isPaused) {
                this.stopTimers();
                this.scheduleNext();
            }
        }

        /**
         * Step to previous word manually.
         */
        prevWord() {
            if (this.words.length === 0) return;
            const prevIdx = Math.max(this.currentIndex - 1, 0);
            this.highlightWord(prevIdx);
            if (this.isPlaying && !this.isPaused) {
                this.stopTimers();
                this.scheduleNext();
            }
        }

        /**
         * Stop reading and clean up all visual highlights.
         */
        stop() {
            this.stopTimers();
            this.isPlaying = false;
            this.isPaused = false;
            this.currentIndex = -1;
            this.lastScrolledLineTop = null;
            this.clearHighlight();
        }

        /**
         * Stop active timers safely.
         */
        stopTimers() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        }

        /**
         * Clear all visual highlights and overlays.
         */
        clearHighlight() {
            if (typeof CSS !== 'undefined' && CSS.highlights) {
                try {
                    CSS.highlights.delete(this.highlightName);
                } catch (e) {}
            }
            if (this.indicatorElement) {
                this.indicatorElement.style.display = 'none';
            }
        }

        /**
         * Handle reading completion.
         */
        complete() {
            this.stop();
            if (typeof this.onComplete === 'function') {
                this.onComplete();
            }
        }

        /**
         * Destroy engine instance and clean up DOM elements.
         */
        destroy() {
            this.stop();
            if (this.indicatorElement && this.indicatorElement.parentNode) {
                this.indicatorElement.parentNode.removeChild(this.indicatorElement);
                this.indicatorElement = null;
            }
            const styles = document.getElementById('readit-engine-styles');
            if (styles && styles.parentNode) {
                styles.parentNode.removeChild(styles);
            }
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ReadingEngine;
    } else {
        global.ReaditReadingEngine = ReadingEngine;
    }

})(typeof window !== 'undefined' ? window : this);
