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
  return new Promise((resolve, _) => {
    fetch(url, options)
      .then((response) => response.json())
      .then((result) => {
        const languages = result.data.languages;
        resolve(languages);
      })
      .catch(() => {
        resolve([]);
      });
  });
};

async function performTranslate(info) {
  const text = info.selectionText;
  let prefLang;
  await chrome.storage.sync.get("language", function (data) {
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
            }
          );
          const result = await response.json();
          if (result.message) {
            const errMessage = `alert("API limit reached")`;
            errorHandler(tab.id, errMessage);
            return;
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
          });
          const newText = await translatedText.json();
          const replaceText = newText.data.translations[0].translatedText;
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
        } catch (error) {
          const errMessage = `alert("Error occured")`;
          chrome.tabs.executeScript(tab.id, { code: errMessage });
        }
      }
    }
  );
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

chrome.runtime.onInstalled.addListener(function () {
  (async function () {
    const manifest = chrome.runtime.getManifest();
    const response = await fetch(manifest.env.firebaseFunctionUrl);
    const data = await response.text();
    await setUpOptions(data);
  })();

  chrome.contextMenus.create({
    title: "Quick translate",
    contexts: ["selection"],
    onclick: performTranslate,
  });
});
