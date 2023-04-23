const url =
  "https://google-translate1.p.rapidapi.com/language/translate/v2/languages?target=en";
const options = {
  method: "GET",
  headers: {
    "content-type": "application/octet-stream",
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
