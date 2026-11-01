const assert = require('assert');

// Mock browser globals for Node.js environment
global.Node = {
    TEXT_NODE: 3,
    ELEMENT_NODE: 1
};

global.NodeFilter = {
    SHOW_TEXT: 4,
    FILTER_ACCEPT: 1,
    FILTER_REJECT: 2,
    FILTER_SKIP: 3
};

class MockTextNode {
    constructor(text) {
        this.nodeType = Node.TEXT_NODE;
        this.nodeValue = text;
        this.length = text.length;
        this.parentElement = { tagName: 'P' };
        this.parentNode = this.parentElement;
    }
}

class MockElementNode {
    constructor(tag, children = []) {
        this.nodeType = Node.ELEMENT_NODE;
        this.tagName = tag.toUpperCase();
        this.parentElement = null;
        this.parentNode = null;
        this.childNodes = children;
        children.forEach(c => { c.parentNode = this; c.parentElement = this; });
    }
}

class MockRange {
    constructor(startContainer, startOffset, endContainer, endOffset) {
        this.startContainer = startContainer;
        this.startOffset = startOffset;
        this.endContainer = endContainer;
        this.endOffset = endOffset;
        this.collapsed = false;
        this.commonAncestorContainer = startContainer === endContainer ? startContainer : { nodeType: Node.ELEMENT_NODE, parentNode: null };
    }

    intersectsNode(node) {
        return true;
    }

    getBoundingClientRect() {
        return { top: 100, left: 100, width: 40, height: 18, bottom: 118, right: 140 };
    }
}

global.document = {
    createRange: () => {
        let sc, so, ec, eo;
        return {
            setStart: (c, o) => { sc = c; so = o; },
            setEnd: (c, o) => { ec = c; eo = o; },
            getBoundingClientRect: () => ({ top: 100, left: 100, width: 40, height: 18, bottom: 118, right: 140 })
        };
    },
    createTreeWalker: (root, whatToShow, filter) => {
        const textNodes = [];
        function collect(n) {
            if (n.nodeType === Node.TEXT_NODE) {
                if (!filter || filter.acceptNode(n) === NodeFilter.FILTER_ACCEPT) {
                    textNodes.push(n);
                }
            } else if (n.childNodes) {
                n.childNodes.forEach(collect);
            }
        }
        collect(root);
        let idx = -1;
        return {
            nextNode: () => {
                idx++;
                return idx < textNodes.length ? textNodes[idx] : null;
            }
        };
    },
    getElementById: () => null,
    createElement: () => ({
        style: {},
        classList: { add: () => {}, remove: () => {} },
        appendChild: () => {}
    }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {}, contains: () => true },
    documentElement: { style: { setProperty: () => {} } }
};

global.window = {
    scrollX: 0,
    scrollY: 0,
    innerHeight: 800,
    scrollBy: () => {}
};

const ReadingEngine = require('../content/reading-engine.js');

console.log("Running ReadingEngine Tests...");

const engine = new ReadingEngine();
assert(engine, "Engine should instantiate");

const node1 = new MockTextNode("Focus on every single word.");
const root = new MockElementNode('div', [node1]);
const range = new MockRange(node1, 0, node1, node1.length);
range.commonAncestorContainer = root;

const words = engine.processRange(range);
assert.strictEqual(words.length, 5, "Should identify 5 words");
console.log(`Tokenized ${words.length} words:`, words.map(w => w.word));

// Test Progress tracking
let progressCount = 0;
engine.onProgress = (p) => {
    progressCount++;
    assert(p.totalWords === 5, "Total words in progress should be 5");
};

// Test start and highlight
engine.start(0);
assert.strictEqual(engine.currentIndex, 0, "Current index should be 0");
assert.strictEqual(engine.isPlaying, true, "Engine should be playing");
assert.strictEqual(engine.isPaused, false, "Engine should not be paused");

// Test pause & resume
engine.pause();
assert.strictEqual(engine.isPaused, true, "Engine should be paused");
assert.strictEqual(engine.timer, null, "Timer should be cleared when paused");

engine.resume();
assert.strictEqual(engine.isPaused, false, "Engine should be unpaused");

// Test manual stepping
engine.nextWord();
assert.strictEqual(engine.currentIndex, 1, "Should step to index 1");

engine.prevWord();
assert.strictEqual(engine.currentIndex, 0, "Should step back to index 0");

// Test stop
engine.stop();
assert.strictEqual(engine.isPlaying, false, "Engine should be stopped");
assert.strictEqual(engine.currentIndex, -1, "Index should be reset to -1");

console.log("All ReadingEngine v0.3.0 tests passed successfully!");
