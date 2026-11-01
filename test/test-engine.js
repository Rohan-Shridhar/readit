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
        this.isConnected = true;
    }
}

class MockElementNode {
    constructor(tag, children = []) {
        this.nodeType = Node.ELEMENT_NODE;
        this.tagName = tag.toUpperCase();
        this.parentElement = null;
        this.parentNode = null;
        this.childNodes = children;
        this.isConnected = true;
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

console.log("Running ReadingEngine v0.4.0 Tests...");

const engine = new ReadingEngine();
assert(engine, "Engine should instantiate");

// Test multi-element parsing
const node1 = new MockTextNode("Explore clean reading, ");
const node2 = new MockTextNode("word by word!");
const root = new MockElementNode('div', [
    new MockElementNode('p', [node1]),
    new MockElementNode('p', [node2])
]);
const range = new MockRange(node1, 0, node2, node2.length);
range.commonAncestorContainer = root;

const words = engine.processRange(range);
assert.strictEqual(words.length, 6, "Should find 6 words across paragraphs");
console.log(`Parsed ${words.length} words across nodes:`, words.map(w => w.word));

// Test all highlight themes
const themes = ['yellow', 'green', 'cyan', 'coral', 'purple'];
themes.forEach(t => {
    engine.setTheme(t);
    assert.strictEqual(engine.colorTheme, t, `Theme should be set to ${t}`);
});
console.log("All themes validated successfully.");

// Test auto-scroll configuration
engine.setAutoScroll(false);
assert.strictEqual(engine.autoScroll, false);
engine.setAutoScroll(true);
assert.strictEqual(engine.autoScroll, true);

// Test detached node resilience
words[2].node.isConnected = false;
engine.highlightWord(2); // Should handle gracefully without throwing

// Test speed boundaries
engine.setSpeed(50); // Below 60, should not apply
assert.strictEqual(engine.speedWpm, 250);
engine.setSpeed(600); // Valid
assert.strictEqual(engine.speedWpm, 600);

console.log("All ReadingEngine v0.4.0 tests passed successfully!");
