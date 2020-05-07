/* eslint-disable no-undef */
const APP_NAME = 'App B';

// Entry point. Initializes Glue42 Web. A Glue42 Web instance will be attached to the global window.
window.startApp({ appName: APP_NAME })
  .then(subscribeToWindowEvents)

  .then(clearLogsHandler)
  .catch(console.error);

function subscribeToWindowEvents() {
  glue.windows.onWindowAdded((webWindow) => {
    logger.info(`Window with ID "${webWindow.id}" opened.`);
  });
}
