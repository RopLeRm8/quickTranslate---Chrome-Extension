export function getIdenticalBool(languages) {
  return new Promise((resolve, _) => {
    chrome.storage.sync.get("languageList", async function (data) {
      if (data.languageList !== languages) {
        chrome.storage.sync.set({ languageList: languages });
        resolve();
      } else {
        resolve("dont change");
      }
    });
  });
}
export function getIfLanguagesExist() {
  return new Promise((resolve, _) => {
    chrome.storage.sync.get("languageList", async function (data) {
      if (!data.languageList || data.languageList.length === 0) {
        resolve("none");
      } else {
        resolve(data.languageList);
      }
    });
  });
}
export function getPreferredLang() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("language", function (data) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(data.language);
      }
    });
  });
}
