import { getCountryFlag } from "./utils/getCountryFlag.js";

const selectLang = document.querySelector(".lang");
const errorElem = document.querySelector(".error");
const loadingElem = document.querySelector(".loading");

document.addEventListener("DOMContentLoaded", async () => {
  loadingElem.textContent = "Loading...";
  selectLang.style.display = "none";

  chrome.runtime.sendMessage({ type: "getLangs" }, async (languages) => {
    if (languages.length === 0) {
      errorElem.textContent = "Request failed. Please contact the creator";
      return;
    }

    await chrome.storage.sync.get("languageList", async function (data) {
      if (JSON.stringify(data.languageList) !== JSON.stringify(languages)) {
        chrome.storage.sync.set({ languageList: languages }, function () {
          console.log("Saved new language list:", languages);
        });
      } else {
        console.log("Retrieved same language list:", languages);
        return;
      }

      const flagURLS = await Promise.all(
        languages.map(async (lang) => getCountryFlag(lang.language))
      );

      loadingElem.textContent = "";
      selectLang.style.display = "flex";
      chrome.storage.sync.get("language", function (data) {
        selectLang.value = data.language;
      });

      const selectOptions = languages?.map((lang, i) => {
        return `<option value="${lang.language}">${lang.name}</option>`;
      });

      selectLang.innerHTML = selectOptions.join("");
    });
  });
});

selectLang.addEventListener("change", (e) => {
  console.log(e.target.value);
  chrome.storage.sync.set({ language: e.target.value }, function () {
    loadingElem.textContent = "Preference saved";
    console.log("gud");
  });
});
