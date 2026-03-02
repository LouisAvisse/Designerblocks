"use strict";
// Designerblocks — Figma Plugin Sandbox
// This file runs in Figma's main thread (no DOM access).
figma.showUI(__html__, { width: 300, height: 330, themeColors: false });
// ---- Helpers ----
function countNodesByType(nodes) {
    const counts = {};
    for (const node of nodes) {
        counts[node.type] = (counts[node.type] || 0) + 1;
    }
    return counts;
}
function countAllNodes(parent) {
    let count = 0;
    for (const child of parent.children) {
        count++;
        if ('children' in child) {
            count += countAllNodes(child);
        }
    }
    return count;
}
function countByType(parent, type) {
    let count = 0;
    for (const child of parent.children) {
        if (child.type === type)
            count++;
        if ('children' in child) {
            count += countByType(child, type);
        }
    }
    return count;
}
// ---- Send data to UI ----
function sendDataToUI() {
    var _a, _b, _c;
    const user = figma.currentUser;
    const page = figma.currentPage;
    const file = figma.root;
    const totalNodes = countAllNodes(page);
    const totalFrames = countByType(page, 'FRAME');
    const totalComponents = countByType(page, 'COMPONENT') + countByType(page, 'COMPONENT_SET');
    const selectionTypes = countNodesByType(figma.currentPage.selection);
    figma.ui.postMessage({
        type: 'plugin-data',
        user: {
            name: (_a = user === null || user === void 0 ? void 0 : user.name) !== null && _a !== void 0 ? _a : 'Designer',
            photoUrl: (_b = user === null || user === void 0 ? void 0 : user.photoUrl) !== null && _b !== void 0 ? _b : null,
            color: (_c = user === null || user === void 0 ? void 0 : user.color) !== null && _c !== void 0 ? _c : '#0073FF',
        },
        file: {
            fileName: file.name,
            pageName: page.name,
            totalNodes,
            totalFrames,
            totalComponents,
        },
        selection: {
            count: figma.currentPage.selection.length,
            types: selectionTypes,
        },
    });
}
// ---- Listen for selection / page changes ----
figma.on('selectionchange', () => sendDataToUI());
figma.on('currentpagechange', () => sendDataToUI());
// ---- Listen for messages from UI ----
figma.ui.onmessage = (msg) => {
    if (msg.type === 'refresh') {
        sendDataToUI();
    }
    if (msg.type === 'resize') {
        const { width, height } = msg;
        figma.ui.resize(width, height);
    }
    // Place the designer card image onto the Figma canvas
    if (msg.type === 'place-card') {
        const bytes = new Uint8Array(msg.bytes);
        const image = figma.createImage(bytes);
        const frame = figma.createFrame();
        frame.name = 'Designerblocks Card';
        frame.resize(1200, 630);
        frame.fills = [{
                type: 'IMAGE',
                imageHash: image.hash,
                scaleMode: 'FILL',
            }];
        // Position in viewport center
        const vp = figma.viewport.center;
        frame.x = Math.round(vp.x - 600);
        frame.y = Math.round(vp.y - 315);
        figma.currentPage.appendChild(frame);
        figma.currentPage.selection = [frame];
        figma.viewport.scrollAndZoomIntoView([frame]);
    }
};
// Initial data push
sendDataToUI();
