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
    "X-RapidAPI-Key": "05d240adc7msh769af2d041590acp1fcad4jsna94aa86ad4bc",
    "X-RapidAPI-Host": "google-translate1.p.rapidapi.com",
  },
};
const detectOptions = {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    "Accept-Encoding": "application/gzip",
    "X-RapidAPI-Key": "05d240adc7msh769af2d041590acp1fcad4jsna94aa86ad4bc",
    "X-RapidAPI-Host": "google-translate1.p.rapidapi.com",
  },
};
const translateOptions = {
  method: "POST",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    "Accept-Encoding": "application/gzip",
    "X-RapidAPI-Key": "05d240adc7msh769af2d041590acp1fcad4jsna94aa86ad4bc",
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

async function performTranslate(info, tab) {
  const text = info.selectionText;
  let prefLang;
  await chrome.storage.sync.get("language", function (data) {
    if (data.language) {
      prefLang = data.language;
    } else {
      prefLang = "en";
    }
  });
  detectOptions.body = new URLSearchParams({
    q: text,
  });
  try {
    const response = await fetch(detectUrl, detectOptions);
    const result = await response.json();
    console.log(result);
    translateOptions.body = new URLSearchParams({
      q: text,
      target: prefLang,
      source: result.data.detections[0][0].language,
    });
    const translatedText = await fetch(translateUrl, translateOptions);
    console.log(translatedText);
    const newContent = tab.content.replace(text, result);
    chrome.tabs.executeScript(tab.id, {
      code: "document.body.innerHTML = " + JSON.stringify(newContent),
    });
  } catch (error) {
    console.error(error);
  }
}
