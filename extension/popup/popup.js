import saveLanguagePref from "./utils/saveLanguagePref.js";
import {
  getIdenticalBool,
  getIfLanguagesExist,
  getPreferredLang,
} from "./utils/storageLib.js";
const selectLang = document.querySelector(".lang");
const errorElem = document.querySelector(".error");
const loadingElem = document.querySelector(".loading");
document.addEventListener("DOMContentLoaded", async () => {
  loadingElem.textContent = "Loading...";
  selectLang.style.display = "none";

  const languagesInStorage = await getIfLanguagesExist();
  if (languagesInStorage !== "none") {
    const selectOptions = languagesInStorage.map((lang) => {
      return `<option value="${lang.language}">${lang.name}</option>`;
    });
    selectLang.innerHTML = selectOptions.join("");
    loadingElem.textContent = "";
    selectLang.style.display = "flex";
    getPreferredLang()
      .then((language) => {
        selectLang.value = language;
      })
      .catch((err) => {
        errorElem.textContent = err;
        selectLang.value = languagesInStorage[0].name;
      });
    return; // end Listener
  }

  chrome.runtime.sendMessage({ type: "getLangs" }, async (languages) => {
    if (languages.length === 0) {
      errorElem.textContent = "Request failed. Please contact the creator";
      return;
    }

    await getIdenticalBool(languages);

    loadingElem.textContent = "";
    selectLang.style.display = "flex";

    const selectOptions = languages?.map((lang) => {
      return `<option value="${lang.language}">${lang.name}</option>`;
    });

    selectLang.innerHTML = selectOptions.join("");
  });
});

selectLang.addEventListener("change", (e) => {
  saveLanguagePref(e.target.value)
    .then(() => {
      loadingElem.textContent = "Preference saved";
    })
    .catch((err) => {
      errorElem.textContent = err;
    });
});
