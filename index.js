// declare global variables
let prayerTimings = null;
let countdownInterval = null;

const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const countryInput = document.getElementById('countryInput');
const solatSection = document.getElementById('solatSection');

// live malaysia clock
function updateMalaysiaClock() {
  const now = new Date();
  const dateOptions = { timeZone: 'Asia/Kuala_Lumpur', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }; // structure date display
  const timeOptions = { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }; // structure time display 
  document.getElementById('currentDate').innerText = now.toLocaleDateString('en-MY', dateOptions);
  document.getElementById('currentTime').innerText = now.toLocaleTimeString('en-MY', timeOptions);
}
setInterval(updateMalaysiaClock, 1000); // run func every 1000miliseconds (= 1 second)
updateMalaysiaClock();

function getTodayDateString() {
  const today = new Date();
  // get current date, .padStart -> add 0 to 1 digit number, .getMonth +1 bcs js counts january as 0, .getYear -> get 4 digit year (full)
  return `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
}

function hidePrayerSection() {
  solatSection.style.display = 'none';
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function displayPrayerData(data, city, country) { // stores all data inside prayertimings so other func can use, esp countdown
  prayerTimings = data.timings; // data from prayer API, timings accesses prayer timing info

  document.getElementById('displayLocation').innerText = `${city}, ${country}`;
  document.getElementById('gregorianDate').innerText = `${data.date.gregorian.date}`;
  document.getElementById('hijriDate').innerText = `${data.date.hijri.date} AH`; // AH = in the year of the Hijrah

  const prayerNames = ['Imsak', 'Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  prayerNames.forEach(name => {
    document.getElementById(`time${name}`).innerText = prayerTimings[name];
  })

  solatSection.style.display = 'block';
  startCountdown(); // call func countdown to next prayer time (calculcation)
}

// check & fetch city and country, if exist, continue with prayer API. if not, error message will appear 
async function fetchSolatTimes(city, country) {
  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&format=json&limit=1`; // location @ street map API URL
    const geoRes = await fetch(geoUrl, {
      headers: { 'User-Agent': 'SolatTimeApp/1.0' } // identify app when sending a req to loc service
    });
    const geoData = await geoRes.json(); // create variable to store loc search results, await = waits until conversion is completed

    // if the location does not exist
    if (!geoData || geoData.length == 0) { // 0 = zero results 
      hidePrayerSection();
      alert(`Error: Location "${city}, ${country}" does not exist! Please enter a valid city and country!`);
      return;
    }

    // if location exist, fetch prayer times using latitude & longitude for 100% accuracy
    const lat = geoData[0].lat; // variable store latitude (north-south)
    const lon = geoData[0].lon; // variable store longitude (easet-west)
    const dateStr = getTodayDateString();
    const apiUrl = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=17`; // al-Adhan API URL, method 17 (jakim's calculation method in this API)
    const res = await fetch(apiUrl); // req prayer times from al-Adhan API
    const result = await res.json(); //convert API to JSON data, and accessible to JS. 

    if (result.code == 200 && result.data) { // 200 = successful req and response contains prayer information
      displayPrayerData(result.data, city, country);

      // stores info in browser's local storage
      localStorage.setItem('savedCity', city);
      localStorage.setItem('savedCountry', country);

    } else {
      hidePrayerSection();
      alert('Error: Could not retrieve prayer times for this location.'); // al-Adhan does not return valid prayer data
    }
  } catch (err) { // handles error that occur inside try block 
    console.error(err);
    hidePrayerSection();
    alert('Failed to connect to the network. Please try again.'); // internet fail
  }
}

function updateSuggestions(nextPrayerName) {
  let suggestion = "";

  if (nextPrayerName.includes("Fajr")) {
    suggestion = "It's near Fajr time. <br>Recommended activity: <br>Perform Tahajjud or Qabliyah Subuh prayer and read morning Azkar.";
  } else if (nextPrayerName.includes("Dhuhr")) {
    suggestion = "Midday approach, its's Dhuhr time. <br>Recommended activity: <br>Take a short Qailullah rest if possible and perform Sunnah Rawatib before Dhuhr.";
  } else if (nextPrayerName.includes("Asr")) {
    suggestion = "Afternoon phase, its's Asr time. <br>Recommended activity: <br>Recite Quran and prepare for evening remembrance (Evening Azkar).";
  } else if (nextPrayerName.includes("Maghrib")) {
    suggestion = "Sunset approach, Maghrib is calling. <br>Recommended activity: <br>Make sincere supplication (Dua's) before Maghrib and stay in remembrance.";
  } else if (nextPrayerName.includes("Isha")) {
    suggestion = "Night has arrived, time to settle down and Isha. <br>Recommended activity: <br>Perform Sunnah prayers (Witr) after Isha, read Surah Al-Mulk, and Ayatul Kursi before sleeping.";
  } else {
    suggestion = "Engage in continuous Dhikr, charity, and seeking beneficial knowledge.";
  }

  document.getElementById('suggestionText').innerHTML = suggestion;
}

// calculation until next prayer times 
function startCountdown() { // start countdown timer
  if (countdownInterval) clearInterval(countdownInterval); // check cdInterval exist or not. if yes, stop existing interval to prevent multiple coundown run simulatenously
  tickCountdown();
  countdownInterval = setInterval(tickCountdown, 1000);
}

function tickCountdown() { // calculate func immediately, remaining time until next prayer 
  if (!prayerTimings) return; // !pT, timing unavailable 
  const now = new Date(); // creates date object contains current date & time, store inside now to calc remain time until next prayer
  
  const prayers = [
    { name: 'Fajr (Subuh)', time: prayerTimings.Fajr },
    { name: 'Dhuhr (Zohor)', time: prayerTimings.Dhuhr },
    { name: 'Asr (Asar)', time: prayerTimings.Asr },
    { name: 'Maghrib', time: prayerTimings.Maghrib },
    { name: 'Isha (Isyak)', time: prayerTimings.Isha }
  ];

  let targetPrayer = null; // stores actual date & time of next prayer
  let targetDate = null;

  for (let p of prayers) { // loop "for" checking each prayer time to identify next upcoming prayer
    const [h, m] = p.time.split(':'); // separate prayer times into hours and minutes, so JS can use in calculation
    const pDate = new Date(); // new Date object to adjusted to represent current prayer shceduled time
    // refer date Object, hour.minutes.second.milisecond, convert str hour to int, convert str minute to int, set both data to 0 
    pDate.setHours(parseInt(h), parseInt(m), 0, 0);

    if (pDate > now) { 
      targetPrayer = p; // assign current prayer object to targetprayer, stores next upcoming prayer
      targetDate = pDate; // assign prayer date to targetdate, stored scheduled date & time of next prayer
      break;
    }
  }

  if (!targetPrayer) {
    targetPrayer = prayers[0]; // 0 - first item in array (Fajr) bcs all prayer times have passed
    const [h, m] = targetPrayer.time.split(':'); // split hours and minutes
    targetDate = new Date(); // new Date object
    targetDate.setDate(targetDate.getDate() + 1); // + 1 day, date changes to tomorrow 
    targetDate.setHours(parseInt(h), parseInt(m), 0, 0); // target date to tomorrow fajr time
  }

  // calculation formula for the countdown next prayer 
  const diff = targetDate - now;
  const totalSecs = Math.floor(diff / 1000); // remaining time in milisec / milisec into dtudents
  const hrs = Math.floor(totalSecs / 3600); // 3600, converts sec into hours 
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60; // gets remaining sec after removing complete minutes

  const pad = n => String(n).padStart(2, '0'); // countdown always displays 2 digits 
  document.getElementById('nextPrayerName').innerText = targetPrayer.name; // name of next prayer
  document.getElementById('nextPrayerTime').innerText = targetPrayer.time; // time of next prayer 
  document.getElementById('countdownTimer').innerText = `${pad(hrs)}h ${pad(mins)}m ${pad(secs)}s`; // displays countdown in hours, minutes and seconds

  updateSuggestions(targetPrayer.name);
}

searchForm.addEventListener('submit', (e) => { // allow user input loc  
  e.preventDefault(); // prevent web reload when search loc 
  fetchSolatTimes(cityInput.value.trim(), countryInput.value.trim()); // trim -> remove white spaces
});

window.addEventListener('DOMContentLoaded', () => { // html doc ready -> execute code inside 
  const savedCity = localStorage.getItem('savedCity');
  const savedCountry = localStorage.getItem('savedCountry');
  
  if (savedCity) cityInput.value = savedCity; // if close when loc KL, then open loc also KL 
  if (savedCountry) countryInput.value = savedCountry;
});