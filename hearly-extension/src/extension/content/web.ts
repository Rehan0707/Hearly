// Content script injected into Hearly Web pages to facilitate local extension integration.
console.log('[Hearly] Web integration content script loaded.');

function notifyPage() {
  window.postMessage({
    type: 'HEARLY_EXTENSION_CONNECTED',
    version: '1.0.0',
  }, '*');
}

notifyPage();
const interval = setInterval(notifyPage, 1000);
setTimeout(() => clearInterval(interval), 5000);

window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  const data = event.data;
  if (data?.source === 'hearly-web-page') {
    chrome.runtime.sendMessage(data, (response) => {
      window.postMessage({
        source: 'hearly-extension',
        requestId: data.requestId,
        ...response,
      }, '*');
    });
  }
});
