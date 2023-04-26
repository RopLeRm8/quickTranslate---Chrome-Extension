const url =
  "https://google-translate1.p.rapidapi.com/language/translate/v2/languages?target=en";

const detectUrl =
  "https://google-translate1.p.rapidapi.com/language/translate/v2/detect";

const translateUrl =
  "https://google-translate1.p.rapidapi.com/language/translate/v2";

const options = {
  method: "GET",
  headers: {
    "content-type": "application/octet-stream",
    "Accept-Encoding": "application/gzip",
    "X-RapidAPI-Key": "c262f1b62amshf9532fbf70b2140p166e96jsna8919dec856f",
    "X-RapidAPI-Host": "google-translate1.p.rapidapi.com",
  },
};
const detectOptions = {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    "Accept-Encoding": "application/gzip",
    "X-RapidAPI-Key": "c262f1b62amshf9532fbf70b2140p166e96jsna8919dec856f",
    "X-RapidAPI-Host": "google-translate1.p.rapidapi.com",
  },
};
const translateOptions = {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    "Accept-Encoding": "application/gzip",
    "X-RapidAPI-Key": "c262f1b62amshf9532fbf70b2140p166e96jsna8919dec856f",
    "X-RapidAPI-Host": "google-translate1.p.rapidapi.com",
  },
};

function getLangs() {
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
}

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.type === "getLangs") {
    getLangs().then((languages) => sendResponse(languages));
    return true;
  }
});
// Extension
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    title: "Quick translate",
    contexts: ["selection"],
    onclick: performTranslate,
  });
});

async function performTranslate(info) {
  const text = info.selectionText;
  let prefLang;
  await chrome.storage.sync.get("language", function (data) {
    if (data.language) {
      prefLang = data.language;
    } else {
      prefLang = "en";
    }
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
              chrome.tabs.executeScript(tab.id, { code: errMessage });
            }
          );
          const result = await response.json();
          if (result.message) {
            const errMessage = `alert("API limit reached")`;
            chrome.tabs.executeScript(tab.id, { code: errMessage });
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
            chrome.tabs.executeScript(tab.id, { code: errMessage });
          });
          const newText = await translatedText.json();
          console.log(newText.data.translations[0].translatedText);
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
