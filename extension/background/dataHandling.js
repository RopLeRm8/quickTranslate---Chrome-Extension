const url =
  "https://google-translate1.p.rapidapi.com/language/translate/v2/languages?target=en";

const detectUrl =
  "https://google-translate1.p.rapidapi.com/language/translate/v2/detect";

const translateUrl =
  "https://google-translate1.p.rapidapi.com/language/translate/v2";
const CONTTYPE = "application/octet-stream";
const ACCEPTCODE = "application/gzip";
const HOST = "google-translate1.p.rapidapi.com";

const options = {};
const detectOptions = {};
const translateOptions = {};

const setUpOptions = (data) => {
  options.method = "GET";
  options.headers = {
    "content-type": CONTTYPE,
    "Accept-Encoding": ACCEPTCODE,
    "X-RapidAPI-Key": data,
    "X-RapidAPI-Host": HOST,
  };

  detectOptions.method = "POST";
  detectOptions.headers = {
    "content-type": CONTTYPE,
    "Accept-Encoding": ACCEPTCODE,
    "X-RapidAPI-Key": data,
    "X-RapidAPI-Host": HOST,
  };

  translateOptions.method = "POST";
  translateOptions.headers = {
    "content-type": CONTTYPE,
    "Accept-Encoding": ACCEPTCODE,
    "X-RapidAPI-Key": data,
    "X-RapidAPI-Host": HOST,
  };
};
const getLangs = () => {
  return new Promise(async (resolve, reject) => {
    try {
      await chrome.identity.getAuthToken(
        { interactive: false },
        async function (token) {
          if (token) {
            await chrome.identity.removeCachedAuthToken({ token: token });
            console.log(token);
          }
          if (!token) {
            const newToken = await chrome.identity.getAuthToken({
              interactive: true,
            });
            if (!newToken) {
              console.log("Failed to authorize new user");
              return;
            } else {
              console.log("New token retrieved:", newToken);
            }
          }
        }
      );
      const response = await fetch(url, options);
      const result = await response.json();

      if (result.message) {
        await chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            if (tabs && tabs[0]) {
              const tab = tabs[0];
              const errMessage = `alert("API limit reached")`;
              errorHandler(tab.id, errMessage);
            }
          }
        );
        reject("API limit reached");
        return;
      }
      const languages = result.data.languages;
      resolve(languages);
    } catch (error) {
      reject(error);
    }
  });
};

function performTranslate(info) {
  return new Promise(async (resolve, reject) => {
    chrome.identity.getAuthToken(
      { interactive: false },
      async function (token) {
        console.log(token);
        if (!token) {
          const newToken = await chrome.identity.getAuthToken({
            interactive: true,
          });
          if (!newToken) {
            console.log("Failed to authorize new user");
            return;
          }
          console.log("New token retrieved:", newToken);
        } else {
          const text = info.selectionText;
          let prefLang;
          chrome.storage.sync.get("language", function (data) {
            prefLang = data.language ?? "en";
          });
          chrome.tabs.query(
            { active: true, currentWindow: true },
            async function (tabs) {
              if (tabs && tabs[0]) {
                const tab = tabs[0];
                detectOptions.body = new URLSearchParams({
                  q: text,
                });
                try {
                  const response = await fetch(detectUrl, detectOptions).catch(
                    (err) => {
                      const errMessage = `alert("Couldn't detect the language - ", ${err.code})`;
                      errorHandler(tab.id, errMessage);
                      reject(`Couldn't detect the language - ${err.code}`);
                    }
                  );
                  const result = await response.json();
                  if (result.message) {
                    const errMessage = `alert("API limit reached")`;
                    errorHandler(tab.id, errMessage);
                    reject("API limit reached");
                  }
                  translateOptions.body = new URLSearchParams({
                    q: text,
                    target: prefLang,
                    source: result.data.detections[0][0].language ?? "en",
                  });
                  const translatedText = await fetch(
                    translateUrl,
                    translateOptions
                  ).catch((err) => {
                    const errMessage = `alert("Couldn't translate - ", ${err.code})`;
                    errorHandler(tab.id, errMessage);
                    reject(`Couldn't translate - ${err.code}`);
                  });
                  const newText = await translatedText.json();
                  const replaceText =
                    newText.data.translations[0].translatedText;
                  chrome.tabs.executeScript(tab.id, {
                    code: `
                  const textNodes = document.evaluate('//text()[contains(., "${text}")]',
                    document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                  for (let i = 0; i < textNodes.snapshotLength; i++) {
                    const node = textNodes.snapshotItem(i);
                    node.textContent = node.textContent.replace('${text}', '${replaceText}');
                  }
                `,
                  });
                  resolve();
                } catch (error) {
                  const errMessage = `alert("Error occurred")`;
                  chrome.tabs.executeScript(tab.id, { code: errMessage });
                  reject("Error occurred");
                }
              }
            }
          );
        }
      }
    );
  });
}

const errorHandler = (tabid, err) => {
  chrome.tabs.executeScript(tabid, { code: err });
};
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.type === "getLangs") {
    getLangs().then((languages) => sendResponse(languages));
    return true;
  }
});
chrome.runtime.onInstalled.addListener(async function () {
  const manifest = chrome.runtime.getManifest();
  const response = await fetch(manifest.env.firebaseFunctionUrl);
  const data = await response.text();
  await setUpOptions(data);
  createContextMenu();
});

chrome.runtime.onStartup.addListener(async function () {
  const manifest = chrome.runtime.getManifest();
  const response = await fetch(manifest.env.firebaseFunctionUrl);
  const data = await response.text();
  await setUpOptions(data);
  createContextMenu();
});

function createContextMenu() {
  chrome.contextMenus.create({
    title: "Quick translate",
    contexts: ["selection"],
    onclick: performTranslate,
  });
}
