// ADRI website -> Google Sheets form receiver
//
// Paste this whole file into the Apps Script editor of the ONE spreadsheet
// that holds both forms (Extensions -> Apps Script), then deploy it as a
// web app. Full steps are in README.md, "Connect the forms to Google Sheets".
//
// Each website form sends a hidden field "form" naming which tab to write to.
// The script creates the tab and its column headers on first use.

// Cap on submissions per minute across all visitors, so a scripted flood
// can't fill the sheet. (For notifications, use the spreadsheet's own
// Tools -> Notification settings -> "any changes are made".)
var MAX_PER_MINUTE = 10;

// Which tab each form writes to, and the columns it gets, in order.
// Anything not listed here is ignored, so junk posted to the URL is dropped.
var FORMS = {
  subscribe: { tab: 'Subscribers', fields: ['email'] },
  contact:   { tab: 'Contact Messages', fields: ['first_name', 'last_name', 'email', 'message'] }
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var params = (e && e.parameter) || {};

    // Honeypot: real visitors never fill this hidden field; bots often do.
    if (params.company) {
      return respond({ result: 'ok' });
    }

    // Rate limit (global, per minute).
    var cache = CacheService.getScriptCache();
    var count = Number(cache.get('submissions') || 0) + 1;
    cache.put('submissions', String(count), 60);
    if (count > MAX_PER_MINUTE) {
      return respond({ result: 'error', message: 'Too many submissions. Please try again shortly.' });
    }

    var config = FORMS[params.form];
    if (!config) {
      return respond({ result: 'error', message: 'Unknown form.' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(config.tab) || ss.insertSheet(config.tab);

    // Set up headers on first use of this tab.
    if (sheet.getLastRow() === 0) {
      var headers = ['Timestamp'].concat(config.fields.map(prettify));
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var row = [new Date()].concat(config.fields.map(function (f) {
      return f in params ? sanitize(params[f]) : '';
    }));
    sheet.appendRow(row);


    return respond({ result: 'ok' });
  } catch (err) {
    console.error(err);  // visible to you in Apps Script > Executions
    return respond({ result: 'error', message: 'Could not save the submission.' });
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the /exec URL in a browser to confirm the deployment works.
function doGet() {
  return respond({ result: 'ok', message: 'ADRI form receiver is running.' });
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Store visitor input as plain text: cap the length and defuse anything
// Sheets would otherwise treat as a formula (values starting with = + - @).
function sanitize(value) {
  var s = String(value).slice(0, 5000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function prettify(key) {
  return key.split('_').map(function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}
