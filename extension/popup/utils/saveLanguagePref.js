export default function saveLanguagePref(nVal) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ language: nVal }, function () {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}
