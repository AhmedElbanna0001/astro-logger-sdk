'use strict';

const VALID_LEVELS = ['INFO', 'WARN', 'ERROR'];

let _apiKey = null;
let _appName = null;
let _baseUrl = null;

/**
 * Initialize the logger SDK.
 * Must be called once before using log().
 *
 * @param {object} options
 * @param {string} options.apiKey   - Your developer API key
 * @param {string} options.appName  - Your application name (no whitespace)
 * @param {string} options.baseUrl  - Base URL of your logging server (e.g. 'https://api.mylogger.com')
 */
function init({ apiKey, appName, baseUrl }) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('[logger-sdk] init() requires a valid "apiKey" string.');
  }
  if (!appName || typeof appName !== 'string') {
    throw new Error('[logger-sdk] init() requires a valid "appName" string.');
  }
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new Error('[logger-sdk] init() requires a valid "baseUrl" string.');
  }

  _apiKey = apiKey.trim();
  _appName = appName.trim();
  _baseUrl = baseUrl.replace(/\/$/, ''); // strip trailing slash
}

/**
 * Send a log entry to the server.
 *
 * @param {object} options
 * @param {string} options.message - Log message
 * @param {'INFO'|'WARN'|'ERROR'} options.level - Log level
 * @returns {Promise<{ success: boolean, data?: object, error?: string, status?: number }>}
 */
async function log({ message, level }) {
  // ── Local validation ────────────────────────────────────────────────────────

  if (!_apiKey || !_appName || !_baseUrl) {
    return {
      success: false,
      error: '[logger-sdk] SDK not initialized. Call init() before log().',
    };
  }

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return {
      success: false,
      error: '[logger-sdk] "message" is required and must be a non-empty string.',
    };
  }

  if (!level) {
    return {
      success: false,
      error: '[logger-sdk] "level" is required. Use "INFO", "WARN", or "ERROR".',
    };
  }

  if (!VALID_LEVELS.includes(level)) {
    return {
      success: false,
      error: `[logger-sdk] Invalid level "${level}". Use "INFO", "WARN", or "ERROR".`,
    };
  }

  // ── HTTP request ─────────────────────────────────────────────────────────────

  const url = `${_baseUrl}/api/applications/${_appName}/logs`;

  let response;
  let body;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': _apiKey,
      },
      body: JSON.stringify({ message: message.trim(), level }),
    });

    body = await response.json();
  } catch (networkError) {
    // Network failure — server unreachable, DNS error, timeout, etc.
    return {
      success: false,
      error: `[logger-sdk] Network error: ${networkError.message}. Check your baseUrl and internet connection.`,
    };
  }

  // ── Response handling ────────────────────────────────────────────────────────

  if (response.status === 201 && body.success) {
    return {
      success: true,
      data: body.data,
    };
  }

  // Map every documented error scenario to a clear message
  switch (response.status) {
    case 400:
      return {
        success: false,
        status: 400,
        error: `[logger-sdk] Validation error: ${body.message}`,
      };

    case 401:
      return {
        success: false,
        status: 401,
        error: '[logger-sdk] Unauthorized: API key was not provided or is missing. Check your apiKey in init().',
      };

    case 403:
      return {
        success: false,
        status: 403,
        error: '[logger-sdk] Forbidden: The API key does not belong to this application. Make sure apiKey and appName match.',
      };

    case 404:
      return {
        success: false,
        status: 404,
        error: `[logger-sdk] Application not found: No application named "${_appName}" exists on the server.`,
      };

    default:
      return {
        success: false,
        status: response.status,
        error: `[logger-sdk] Unexpected server error (${response.status}): ${body.message || 'No message provided.'}`,
      };
  }
}

module.exports = { init, log };
