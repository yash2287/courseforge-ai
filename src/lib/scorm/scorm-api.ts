/** SCORM 1.2 RTE API JavaScript shim - embedded in SCORM packages */
export const SCORM_API_JS = `
// SCORM 1.2 Runtime Environment API Wrapper
var findAPITries = 0;
var API = null;

function findAPI(win) {
  while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
    findAPITries++;
    if (findAPITries > 500) return null;
    win = win.parent;
  }
  return win.API;
}

function getAPI() {
  if (API == null) {
    API = findAPI(window);
    if ((API == null) && (window.opener != null) && (typeof(window.opener) != "undefined")) {
      API = findAPI(window.opener);
    }
  }
  return API;
}

function doLMSInitialize() {
  var api = getAPI();
  if (api == null) {
    console.warn("SCORM API not found - running in standalone mode");
    return "true";
  }
  return api.LMSInitialize("");
}

function doLMSFinish() {
  var api = getAPI();
  if (api == null) return "true";
  return api.LMSFinish("");
}

function doLMSGetValue(name) {
  var api = getAPI();
  if (api == null) return "";
  return api.LMSGetValue(name);
}

function doLMSSetValue(name, value) {
  var api = getAPI();
  if (api == null) return "true";
  return api.LMSSetValue(name, value);
}

function doLMSCommit() {
  var api = getAPI();
  if (api == null) return "true";
  return api.LMSCommit("");
}

function doLMSGetLastError() {
  var api = getAPI();
  if (api == null) return "0";
  return api.LMSGetLastError();
}

function doLMSGetErrorString(errorCode) {
  var api = getAPI();
  if (api == null) return "";
  return api.LMSGetErrorString(errorCode);
}

function doLMSGetDiagnostic(errorCode) {
  var api = getAPI();
  if (api == null) return "";
  return api.LMSGetDiagnostic(errorCode);
}
`;

/** CSS styles for SCORM content pages */
export const SCORM_STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #faf8f5; color: #1a1a2e; line-height: 1.7; }
.container { max-width: 800px; margin: 0 auto; padding: 40px 24px; }
header { margin-bottom: 32px; border-bottom: 1px solid #e7e0d5; padding-bottom: 24px; }
.breadcrumb { font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
h1 { font-size: 28px; font-weight: 300; color: #1a1a2e; letter-spacing: -0.01em; }
h2 { font-size: 22px; font-weight: 600; margin-top: 28px; margin-bottom: 12px; color: #1a1a2e; }
h3 { font-size: 18px; font-weight: 600; margin-top: 20px; margin-bottom: 10px; color: #2d2d44; }
.progress { font-size: 13px; color: #a8a29e; margin-top: 8px; }
.content p { margin-bottom: 14px; color: #44403c; }
.content ul, .content ol { padding-left: 24px; margin-bottom: 14px; }
.content li { margin-bottom: 6px; color: #44403c; }
.content strong { font-weight: 600; color: #1a1a2e; }
.content blockquote { border-left: 3px solid #d4a843; padding-left: 16px; font-style: italic; color: #78716c; margin: 16px 0; }
.takeaways { background: #f0e1b9; border-radius: 10px; padding: 20px 24px; margin-top: 32px; }
.takeaways h3 { color: #1a1a2e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; margin-top: 0; }
.takeaways ul { list-style: none; padding: 0; }
.takeaways li { padding-left: 16px; position: relative; margin-bottom: 8px; font-size: 14px; }
.takeaways li::before { content: '\\2022'; color: #d4a843; position: absolute; left: 0; font-weight: bold; }
footer { margin-top: 40px; text-align: center; }
.btn-complete { background: #1a1a2e; color: #faf8f5; border: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
.btn-complete:hover { background: #2d2d44; }

/* Quiz styles */
.question { margin-bottom: 24px; padding: 20px; background: white; border-radius: 10px; border: 1px solid #e7e0d5; }
.q-text { margin-bottom: 12px; font-size: 15px; }
.options { display: flex; flex-direction: column; gap: 8px; }
.option { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; cursor: pointer; font-size: 14px; transition: background 0.15s; }
.option:hover { background: #f0ebe3; }
.option input { accent-color: #d4a843; }
.passing-note { font-size: 13px; color: #a8a29e; margin-top: 4px; }
.result-card { text-align: center; padding: 32px; border-radius: 12px; margin-top: 24px; }
.result-card.passed { background: #dcfce7; color: #166534; }
.result-card.failed { background: #fef2f2; color: #991b1b; }
.result-card h2 { font-size: 24px; margin-bottom: 8px; }
`;
