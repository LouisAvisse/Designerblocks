"use strict";
/// <reference types="@figma/plugin-typings" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Statistigma — God Tier Performance Edition
 * - Non-blocking recursive crawler (60FPS)
 * - File-based shared activity storage
 * - Instant-load stats cache
 * - Live activity tracking
 * - Instant current-page stats on every change
 */
figma.showUI(__html__, { width: 300, height: 460, themeColors: false });
let activityData = {}; // Date -> Count (File-wide)
let uiIsReady = false;
const pageStatsCache = new Map();
// ---- Persistence Keys ----
const KEY_ACTIVITY = 'stg_activity_v1';
const KEY_STATS_CACHE = 'stg_stats_cache_v1';
// ---- Helpers ----
function pad(n) { return n < 10 ? `0${n}` : `${n}`; }
function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
// ---- Shared Plugin Data ----
const NAMESPACE = 'statistigma';
function saveToFile(key, data) {
    figma.root.setSharedPluginData(NAMESPACE, key, JSON.stringify(data));
}
function loadFromFile(key) {
    try {
        const raw = figma.root.getSharedPluginData(NAMESPACE, key);
        return raw ? JSON.parse(raw) : null;
    }
    catch (e) {
        return null;
    }
}
// ---- Activity Logic ----
function initActivity() {
    const stored = loadFromFile(KEY_ACTIVITY);
    if (stored)
        activityData = stored;
    // Cleanup old activity (keep 1 year)
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const cutoffKey = `${cutoff.getFullYear()}-${pad(cutoff.getMonth() + 1)}-${pad(cutoff.getDate())}`;
    for (const k in activityData) {
        if (k < cutoffKey)
            delete activityData[k];
    }
}
function sendActivity() {
    figma.ui.postMessage({ type: 'activity-data', data: activityData });
}
let activityTimer = null;
function recordActivity(amount = 1) {
    var _a;
    const key = getTodayKey();
    activityData[key] = ((_a = activityData[key]) !== null && _a !== void 0 ? _a : 0) + amount;
    if (activityTimer)
        clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
        activityTimer = null;
        saveToFile(KEY_ACTIVITY, activityData);
        sendActivity();
    }, 1000);
}
// ---- Quick Synchronous Page Counter (instant live updates) ----
function quickCountCurrentPage() {
    const stats = { nodes: 0, frames: 0, components: 0 };
    const stack = [figma.currentPage];
    while (stack.length > 0) {
        const node = stack.pop();
        stats.nodes++;
        if (node.type === 'FRAME')
            stats.frames++;
        if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET')
            stats.components++;
        if ('children' in node) {
            for (const child of node.children)
                stack.push(child);
        }
    }
    return stats;
}
// ---- Non-Blocking Crawler Engine ----
let crawlerIsRunning = false;
function crawlPage(page) {
    return __awaiter(this, void 0, void 0, function* () {
        yield page.loadAsync();
        const stats = { nodes: 0, frames: 0, components: 0 };
        const stack = [page];
        let processedInBatch = 0;
        const BATCH_SIZE = 150;
        while (stack.length > 0) {
            const node = stack.pop();
            processedInBatch++;
            stats.nodes++;
            if (node.type === 'FRAME')
                stats.frames++;
            if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET')
                stats.components++;
            if ('children' in node) {
                for (const child of node.children)
                    stack.push(child);
            }
            if (processedInBatch >= BATCH_SIZE) {
                processedInBatch = 0;
                yield new Promise(r => setTimeout(r, 0));
            }
        }
        pageStatsCache.set(page.id, stats);
        saveStatsDebounced();
    });
}
let statsSaveTimer = null;
function saveStatsDebounced() {
    if (statsSaveTimer)
        clearTimeout(statsSaveTimer);
    statsSaveTimer = setTimeout(() => {
        statsSaveTimer = null;
        saveToFile(KEY_STATS_CACHE, Array.from(pageStatsCache.entries()));
    }, 2000);
}
function startCrawler() {
    return __awaiter(this, void 0, void 0, function* () {
        if (crawlerIsRunning)
            return;
        crawlerIsRunning = true;
        try {
            figma.ui.postMessage({ type: 'project-syncing', isSyncing: true });
            // Crawl current page first
            try {
                yield crawlPage(figma.currentPage);
            }
            catch (e) {
                console.error('Failed to crawl current page:', e);
            }
            // Then crawl other pages (each in its own try/catch so one bad page doesn't block the rest)
            const others = figma.root.children.filter(p => p.id !== figma.currentPage.id);
            for (const p of others) {
                try {
                    yield crawlPage(p);
                }
                catch (e) {
                    console.error(`Failed to crawl page ${p.name}:`, e);
                }
            }
        }
        finally {
            // Always finish with a fresh current-page count so stale crawl data never wins
            const freshStats = quickCountCurrentPage();
            pageStatsCache.set(figma.currentPage.id, freshStats);
            crawlerIsRunning = false;
            figma.ui.postMessage({ type: 'project-syncing', isSyncing: false });
            sendAllStats();
        }
    });
}
// ---- Stats Reporting ----
function sendAllStats() {
    var _a, _b, _c;
    const user = figma.currentUser;
    const page = figma.currentPage;
    const pageStats = pageStatsCache.get(page.id) || { nodes: 0, frames: 0, components: 0 };
    figma.ui.postMessage({
        type: 'plugin-data',
        user: {
            name: (_a = user === null || user === void 0 ? void 0 : user.name) !== null && _a !== void 0 ? _a : 'Designer',
            photoUrl: (_b = user === null || user === void 0 ? void 0 : user.photoUrl) !== null && _b !== void 0 ? _b : null,
            color: (_c = user === null || user === void 0 ? void 0 : user.color) !== null && _c !== void 0 ? _c : '#0073FF',
        },
        file: {
            fileName: figma.root.name,
            pageName: page.name,
            pageCount: figma.root.children.length,
            pageNodes: pageStats.nodes,
            pageFrames: pageStats.frames,
            pageComponents: pageStats.components,
        },
    });
    let tN = 0, tF = 0, tC = 0;
    for (const s of pageStatsCache.values()) {
        tN += s.nodes;
        tF += s.frames;
        tC += s.components;
    }
    figma.ui.postMessage({
        type: 'project-stats',
        projectNodes: tN,
        projectFrames: tF,
        projectComponents: tC,
    });
}
function updateSelection() {
    const sel = figma.currentPage.selection;
    const types = {};
    sel.forEach(n => { var _a; return types[n.type] = ((_a = types[n.type]) !== null && _a !== void 0 ? _a : 0) + 1; });
    figma.ui.postMessage({
        type: 'selection-stats',
        selection: { count: sel.length, types }
    });
}
// ---- Event Handling ----
let refreshTimer = null;
function handleUpdate() {
    // Debounced full project crawl for accurate cross-page totals
    if (refreshTimer)
        clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
        refreshTimer = null;
        startCrawler();
    }, 3000);
}
// ---- Live Polling Engine ----
// Polls the current page every second for instant stat updates.
// This is more reliable than documentchange which may not fire in all cases.
let pollInterval = null;
function startPolling() {
    if (pollInterval)
        return;
    pollInterval = setInterval(() => {
        const stats = quickCountCurrentPage();
        const cached = pageStatsCache.get(figma.currentPage.id);
        // Only send if something actually changed
        if (!cached ||
            stats.nodes !== cached.nodes ||
            stats.frames !== cached.frames ||
            stats.components !== cached.components) {
            // Record the activity (delta of nodes). If no cache, it's a new page load, treat as 1 interaction to be safe.
            const delta = cached ? Math.abs(stats.nodes - cached.nodes) : 1;
            if (delta > 0)
                recordActivity(delta);
            pageStatsCache.set(figma.currentPage.id, stats);
            sendAllStats();
        }
    }, 1000);
}
// ---- Initialization ----
initActivity();
// Load cached stats, then prune stale page IDs
const cachedStats = loadFromFile(KEY_STATS_CACHE);
if (cachedStats) {
    const validPageIds = new Set(figma.root.children.map(p => p.id));
    for (const [id, s] of cachedStats) {
        if (validPageIds.has(id)) {
            pageStatsCache.set(id, s);
        }
    }
}
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'ui-ready') {
        uiIsReady = true;
        // Immediately count current page so we never show 0
        const stats = quickCountCurrentPage();
        pageStatsCache.set(figma.currentPage.id, stats);
        sendAllStats();
        sendActivity();
        updateSelection();
        // Start live polling for instant stat updates
        startPolling();
        // Full crawl in background for cross-page totals
        startCrawler();
        // documentchange for activity tracking + background crawl trigger
        figma.on('documentchange', handleUpdate);
        figma.on('currentpagechange', () => {
            // Quick count new page immediately, then background crawl
            const s = quickCountCurrentPage();
            pageStatsCache.set(figma.currentPage.id, s);
            sendAllStats();
            startCrawler();
        });
        figma.on('selectionchange', updateSelection);
    }
    if (msg.type === 'resize')
        figma.ui.resize(msg.width, msg.height);
    if (msg.type === 'place-card') {
        const bytes = new Uint8Array(msg.bytes);
        const image = figma.createImage(bytes);
        const frame = figma.createFrame();
        frame.name = 'Statistigma Card';
        frame.resize(1200, 630);
        frame.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
        const vp = figma.viewport.center;
        frame.x = Math.round(vp.x - 600);
        frame.y = Math.round(vp.y - 315);
        figma.currentPage.appendChild(frame);
        figma.currentPage.selection = [frame];
        figma.viewport.scrollAndZoomIntoView([frame]);
    }
});
