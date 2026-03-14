"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiKey = generateApiKey;
exports.randomString = randomString;
exports.sleep = sleep;
exports.isValidJson = isValidJson;
exports.parseTemplate = parseTemplate;
exports.getNestedValue = getNestedValue;
exports.estimateTokens = estimateTokens;
function generateApiKey() {
    return `sk_${randomString(32)}`;
}
function randomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function isValidJson(str) {
    try {
        JSON.parse(str);
        return true;
    }
    catch {
        return false;
    }
}
function parseTemplate(template, variables) {
    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
        const value = getNestedValue(variables, key.trim());
        return value !== undefined ? String(value) : '';
    });
}
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
}
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
//# sourceMappingURL=utils.js.map