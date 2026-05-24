const reloadKey = "risolju-coi-reloaded";

export function registerCrossOriginIsolation() {
  if (!import.meta.env.PROD || window.crossOriginIsolated || !("serviceWorker" in navigator)) {
    return;
  }

  const serviceWorkerUrl = `${import.meta.env.BASE_URL}coi-serviceworker.js`;

  navigator.serviceWorker
    .register(serviceWorkerUrl)
    .then((registration) => {
      if (registration.active && !navigator.serviceWorker.controller) {
        reloadForCrossOriginIsolation();
      }
    })
    .catch((error) => {
      console.warn("Cross-origin isolation service worker registration failed.", error);
    });

  navigator.serviceWorker.addEventListener("controllerchange", reloadForCrossOriginIsolation);
}

function reloadForCrossOriginIsolation() {
  if (sessionStorage.getItem(reloadKey)) return;

  sessionStorage.setItem(reloadKey, "1");
  window.location.reload();
}
