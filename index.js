import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;

var location = "Vienna";
var iconOrigin = "";

const lightWeather = `linear-gradient(
  to bottom right,
  rgba(255, 232, 80, 1) 0%,
  rgba(32, 204, 220, 1) 69%
);`;
const darkWeather = `linear-gradient(
  to bottom right,
  rgba(0,27,133,1) 0%, rgba(0,198,217,1) 69%);`;
const noSunWeather = `linear-gradient(
  to bottom right,
  rgba(0,35,171,1) 0%, rgba(0,0,0,1) 69%);`;
const sandstormWeather = `linear-gradient(
  to bottom right,
  rgba(147,57,9,1) 0%, rgba(255,185,35,1) 69%);`;

var lat = "48.2065464431969";
var long = "16.38544200750982";
const API_URL_TEMP = getURL(lat, long, "temp");
const API_URL_CLOUDS = getURL(lat, long, "clouds");

const weatherInfo = {
  imgLink: "",
  text: "",
  bgColor: "",
};

function getURL(lat, long, type) {
  // Generate Timestamp

  var date = new Date();
  var actTime = new Date();

  var year = date.toLocaleString("default", { year: "numeric" });
  var month = date.toLocaleString("default", { month: "2-digit" });
  var day = date.toLocaleString("default", { day: "2-digit" });

  function to2Digits(time) {
    if (time < 10) {
      time = "0" + time;
    }
    return time;
  }
  var time =
    to2Digits(actTime.getHours()) +
    ":" +
    to2Digits(actTime.getMinutes()) +
    ":" +
    to2Digits(actTime.getSeconds());

  var formattedDate = year + "-" + month + "-" + day + "T" + time + "Z";
  if (type == "temp") {
    return `https://api.meteomatics.com/${formattedDate}/t_2m:C/${lat},${long}/json`;
  } else if (type == "clouds") {
    return `https://api.meteomatics.com/${formattedDate}/weather_symbol_1h:idx/${lat},${long}/json`;
  }
  // END Timestamp
}

// Headers
const username = "keine_sablattnig_marvin";
const password = "96cHRVl24g";
// End Headers

const token = `${username}:${password}`;
const encodedToken = Buffer.from(token).toString("base64");
let configGetWeather = [
  {
    method: "get",
    url: API_URL_TEMP,
    headers: { Authorization: "Basic " + encodedToken },
  },
  {
    method: "get",
    url: API_URL_CLOUDS,
    headers: { Authorization: "Basic " + encodedToken },
  },
];
app.use(express.static("public"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  lat = 48.2065464431969;
  long = 16.38544200750982;
  location = "Vienna";

  configGetWeather[0].url = getURL(lat, long, "temp");
  configGetWeather[1].url = getURL(lat, long, "clouds");

  var additionalClass = "appear";

  axios
    .all(configGetWeather.map((request) => axios(request)))
    .then(
      axios.spread((tempData, weatherData) => {
        console.log(
          "Data Temp: " +
            tempData.data.data[0].coordinates[0].dates[0] +
            " Data Cloud: " +
            weatherData.data.data[0]
        );
        var temp = tempData.data.data[0].coordinates[0].dates[0].value;
        var weatherInfo = getWeatherIcon(
          weatherData.data.data[0].coordinates[0].dates[0].value
        );

        res.render("index.ejs", {
          location: location,
          temp: temp,
          imgLink: weatherInfo.imgLink,
          additionalClass: additionalClass,
          bgColor: weatherInfo.bgColor,
        });
      })
    )
    .catch(function (error) {
      console.log("error");
      res.render("index.ejs", {
        location: "error",
        temp: "error",
        imgLink: "",
        additionalClass: "",
        bgColor: "lightWeather",
      });
    });
});

function getWeatherIcon(weatherData) {
  console.log(weatherData);
  if (weatherData >= 100) {
    weatherData = weatherData - 100;
    daylight = false;
    weatherInfo.text = "Night";
  } else {
    var daylight = true;
    weatherInfo.text = "Day";
  }
  console.log(daylight);
  switch (true) {
    case weatherData === 0:
      weatherInfo.imgLink = "404";
      weatherInfo.text = "Error";
      weatherInfo.bgColor = "lightWeather";
      return weatherInfo;
    case weatherData === 1:
      if (daylight) {
        weatherInfo.imgLink =
          "https://img.icons8.com/color-glass/96/sun--v1.png";
        weatherInfo.bgColor = "lightWeather";
        return weatherInfo;
      } else {
        weatherInfo.imgLink = "https://img.icons8.com/color-glass/96/moon.png";
        weatherInfo.bgColor = "darkWeather";
        return weatherInfo;
      }

    case weatherData > 1 && weatherData < 5:
      if (daylight) {
        weatherInfo.imgLink =
          "https://img.icons8.com/color-glass/96/partly-cloudy-day--v1.png";
        weatherInfo.bgColor = "noSunWeather";
        return weatherInfo;
      } else {
        weatherInfo.imgLink =
          "https://img.icons8.com/color-glass/96/partly-cloudy-night.png";
        weatherInfo.bgColor = "darkWeather";
        return weatherInfo;
      }

    case weatherData === 5 ||
      weatherData === 8 ||
      weatherData === 13 ||
      weatherData === 11 ||
      weatherData === 12 ||
      weatherData === 15:
      weatherInfo.imgLink =
        "https://img.icons8.com/color-glass/96/heavy-rain.png";
      weatherInfo.bgColor = "noSunWeather";
      return weatherInfo;
    case weatherData === 6 ||
      weatherData === 7 ||
      weatherData === 9 ||
      weatherData === 10:
      weatherInfo.imgLink =
        "https://img.icons8.com/color-glass/96/light-snow--v1.png";
      weatherInfo.bgColor = "noSunWeather";
      return weatherInfo;
    case weatherData === 14:
      weatherInfo.imgLink =
        "https://img.icons8.com/color-glass/96/cloud-lighting--v1.png";
      weatherInfo.bgColor = "noSunWeather";
      return weatherInfo;
    case weatherData === 16:
      weatherInfo.imgLink = "https://img.icons8.com/color-glass/96/tornado.png";
      weatherInfo.bgColor = "sandstormWeather";
      return weatherInfo;
    default:
      console.log("Default");
      return "not identify-able";
      break;
  }
}
app.post("/temp", async (req, res) => {
  const content = req.body.location.split(",");

  lat = content[0];
  long = content[1];
  location = content[2];

  configGetWeather[0].url = getURL(lat, long, "temp");
  configGetWeather[1].url = getURL(lat, long, "clouds");

  var additionalClass = "appear";

  axios
    .all(configGetWeather.map((request) => axios(request)))
    .then(
      axios.spread((tempData, weatherData) => {
        console.log(
          "Data Temp: " +
            tempData.data.data[0].coordinates[0].dates[0] +
            " Data Cloud: " +
            weatherData.data.data[0]
        );
        var temp = tempData.data.data[0].coordinates[0].dates[0].value;
        var weatherInfo = getWeatherIcon(
          weatherData.data.data[0].coordinates[0].dates[0].value
        );

        res.render("index.ejs", {
          location: location,
          temp: temp,
          imgLink: weatherInfo.imgLink,
          additionalClass: additionalClass,
          bgColor: weatherInfo.bgColor,
        });
      })
    )
    .catch(function (error) {
      console.log("error");
      res.render("index.ejs", {
        location: "error",
        temp: "error",
        imgLink: "",
        additionalClass: "",
        bgColor: "lightWeather",
      });
    });
});
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
