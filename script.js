const apiKey = "0613d26eff96fd6a0def214d7f41b225";
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const citySuggestions = document.getElementById("citySuggestions");

// === Autocomplete using GeoDB Cities API ===
cityInput.addEventListener("input", function () {
  const query = cityInput.value;
  if (query.length < 2) return;

  fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${query}&limit=5`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': '29f9fceee4msh5a8c45c12b27a01p16d498jsn9e91f54dcdac',
      'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
    }
  })
    .then(res => res.json())
    .then(data => {
      citySuggestions.innerHTML = "";
      data.data.forEach(city => {
        const option = document.createElement("option");
        option.value = `${city.city}, ${city.region}, ${city.countryCode}`;
        citySuggestions.appendChild(option);
      });
    })
    .catch(err => console.error(err));
});

// === Button Listeners ===
searchBtn.addEventListener("click", () => getWeather(cityInput.value));
locationBtn.addEventListener("click", getLocationWeather);

// === Show Toast Notification ===
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// === Get Weather by City ===
function getWeather(city) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      if (data.cod !== 200) {
        showToast("City not found. Please enter a valid city.");
        return;
      }
      updateCurrentWeather(data);
      getForecast(city);
      getAQI(data.coord.lat, data.coord.lon);
    })
    .catch(() => showToast("Failed to connect. Please check your internet."));
}

// === Get Weather by Geolocation ===
function getLocationWeather() {
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`)
      .then(res => res.json())
      .then(data => {
        updateCurrentWeather(data);
        getForecast(data.name);
        getAQI(latitude, longitude);
      })
      .catch(() => showToast("Could not get location weather."));
  }, () => {
    showToast("Location access denied.");
  });
}

// === Update Current Weather ===
function updateCurrentWeather(data) {
  document.getElementById("temp").textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById("description").textContent = data.weather[0].description;
  document.getElementById("location").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("datetime").textContent = moment().utcOffset(data.timezone / 60).format("dddd, D MMM YYYY, hh:mm A");
  document.getElementById("icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  document.getElementById("humidity").textContent = data.main.humidity;
  document.getElementById("wind").textContent = data.wind.speed;
  document.getElementById("pressure").textContent = data.main.pressure;
  document.getElementById("feelsLike").textContent = Math.round(data.main.feels_like);
  document.getElementById("sunrise").textContent = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
  document.getElementById("sunset").textContent = new Date(data.sys.sunset * 1000).toLocaleTimeString();

  document.body.className = "";
  const weather = data.weather[0].main.toLowerCase();
  if (weather.includes("storm") || weather.includes("thunderstorm")) {
    document.body.classList.add("storm");
  } else if (weather.includes("clear")) {
    document.body.classList.add("clear");
  } else if (weather.includes("cloud")) {
    document.body.classList.add("clouds");
  } else if (weather.includes("fog") || weather.includes("haze") || weather.includes("mist") || weather.includes("smoke")) {
    document.body.classList.add("fog");
  } else {
    document.body.classList.add("clear-day");
  }

  const hours = new Date().getHours();
  if (hours < 6 || hours > 18) {
    document.body.classList.add("night");
  }

  suggestClothing(weather, data.main.temp);
}

// === Forecast ===
function getForecast(city) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      const hourList = document.getElementById("hourList");
      const dayList = document.getElementById("dayList");
      hourList.innerHTML = "";
      dayList.innerHTML = "";

      for (let i = 0; i < 8; i++) {
        const item = data.list[i];
        const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        hourList.innerHTML += `
          <div class="hour-box">
            <p>${time}</p>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" width="40" />
            <p>${Math.round(item.main.temp)}°C</p>
          </div>`;
      }

      let days = {};
      data.list.forEach(item => {
        const day = item.dt_txt.split(" ")[0];
        if (!days[day]) days[day] = item;
      });

      Object.values(days).slice(1, 5).forEach(item => {
        const date = new Date(item.dt * 1000);
        dayList.innerHTML += `
          <div class="day-box">
            <p>${date.toDateString().split(" ")[0]}</p>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" width="40" />
            <p>${Math.round(item.main.temp)}°C</p>
          </div>`;
      });
    });
}

// === Air Quality Index ===
function getAQI(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      const aqi = data.list[0].main.aqi;
      const components = data.list[0].components;
      const levels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
      document.getElementById("aqiLevel").textContent = levels[aqi - 1];
      document.getElementById("co").textContent = components.co;
      document.getElementById("no2").textContent = components.no2;
      document.getElementById("o3").textContent = components.o3;
    });
}

// === Outfit Suggestion ===
function suggestClothing(condition, temp) {
  const text = document.getElementById("clothingText");
  const iconBox = document.getElementById("clothingIcons");
  iconBox.innerHTML = "";

  let query = "";
  let suggestion = "";

  if (condition.includes("rain")) {
    query = "raincoat or umbrella";
    suggestion = "Carry a raincoat or umbrella.";
  } else if (condition.includes("snow")) {
    query = "winter jackets";
    suggestion = "Wear warm jackets and boots.";
  } else if (condition.includes("clear") && temp > 28) {
    query = "cotton t-shirts";
    suggestion = "Light cotton clothes are best for hot days.";
  } else if (condition.includes("clear") && temp <= 15) {
    query = "sweaters for winter";
    suggestion = "It's a bit chilly, wear something warm.";
  } else if (condition.includes("cloud")) {
    query = "light jackets";
    suggestion = "It’s cloudy. A light jacket would be perfect.";
  } else {
    query = "comfortable casual wear";
    suggestion = "Dress comfortably for the weather.";
  }

  text.textContent = suggestion;
  addShopIcons(query);

  function addShopIcons(query) {
    const icon = document.createElement("a");
    icon.href = "#";
    icon.innerHTML = `<img src="https://img.icons8.com/fluency/48/clothes.png" alt="Clothing Icon" width="40" title="Click to shop">`;

    icon.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(`https://www.flipkart.com/search?q=${encodeURIComponent(query)}`, "_blank");
      window.open(`https://www.amazon.in/s?k=${encodeURIComponent(query)}`, "_blank");
    });

    iconBox.appendChild(icon);
  }
}

// === AccuWeather Links ===
function openAccuWeather(city) {
  if (city) {
    const formattedCity = encodeURIComponent(city);
    const url = `https://www.accuweather.com/en/search-locations?query=${formattedCity}`;
    window.open(url, "_blank");
  } else {
    alert("Please enter a city name first.");
  }
}

// === Get Input City ===
function getCityValue() {
  return document.getElementById("cityInput").value.trim();
}

// === Init on Load ===
document.addEventListener("DOMContentLoaded", () => {
  showToast("Welcome to SunDrift Weather App");

  document.getElementById("forecastLink").addEventListener("click", () => openAccuWeather(getCityValue()));
  document.getElementById("aqiLink").addEventListener("click", () => openAccuWeather(getCityValue()));
  document.getElementById("detailsLink").addEventListener("click", () => openAccuWeather(getCityValue()));
});
