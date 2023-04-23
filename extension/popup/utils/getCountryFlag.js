const URL = "https://restcountries.com/v3.1/alpha/";

export const getCountryFlag = (code) => {
  return new Promise((resolve, reject) => {
    fetch(`${URL}${code}`)
      .then((resp) => {
        return resp.json();
      })
      .then((data) => {
        resolve(data[0].flags.png);
      })
      .catch(() => {
        resolve(null);
      });
  });
};
