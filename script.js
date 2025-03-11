// Initialize AOS
AOS.init({
  duration: 800,
  easing: "ease-in-out",
  once: true,
});

const generateBtn = document.querySelector(".generate");
const refreshBtn = document.querySelector(".refresh");

document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const darkModeIcon = document.getElementById("darkModeIcon");
  const backToTopButton = document.getElementById("backToTop");
  const title = document.getElementById("title");
  const inputs = document.querySelectorAll("#form-generate");
  const refreshInputs = document.querySelectorAll("#form-refresh");

  // Check Dark Mode Preference
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeIcon.classList.replace("fa-moon", "fa-sun");
  }

  // Dark Mode Toggle
  darkModeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("darkMode", "enabled");
      darkModeIcon.classList.replace("fa-moon", "fa-sun");
    } else {
      localStorage.setItem("darkMode", "disabled");
      darkModeIcon.classList.replace("fa-sun", "fa-moon");
    }
  });

  // Back to Top Button Visibility
  window.addEventListener("scroll", function () {
    if (window.scrollY > 300) {
      backToTopButton.style.display = "block";
    } else {
      backToTopButton.style.display = "none";
    }
  });

  // Title href
  title.addEventListener("click", function () {
    window.location.href = "#home";
  });

  // Smooth Scroll to Top
  backToTopButton.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Generate button disabled check
  function checkInputs() {
    const allFilled = [...inputs].every((input) => input.value.trim() !== "");
    generateBtn.disabled = !allFilled;
  }

  inputs.forEach((input) => input.addEventListener("input", checkInputs));

  // Refersh button disabled check
  function checkRefreshInputs() {
    const allFilled = [...refreshInputs].every(
      (input) => input.value.trim() !== ""
    );
    refreshBtn.disabled = !allFilled;
  }

  refreshInputs.forEach((input) =>
    input.addEventListener("input", checkRefreshInputs)
  );
});

const redirectUri = "https://twitchtokentool.click";

// Generate Token
generateBtn.addEventListener("click", function () {
  const clientId = document.querySelector(".client-id").value;
  const encodedRedirectUri = encodeURIComponent(window.location.origin);

  if (!clientId) {
    alert("Please enter a Client ID.");
    return;
  }

  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code`;

  window.location.href = authUrl;
});

async function generateToken(code) {
  const clientId = document.querySelector(".client-id").value;
  const clientSecret = document.querySelector(".client-secret").value;

  console.log(clientSecret);

  if (!clientId || !clientSecret) {
    alert("Please enter both Client ID and Client Secret.");
    return;
  }

  const tokenUrl = "https://id.twitch.tv/oauth2/token";
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const data = await response.json();

    alert(
      `✅ Successfully Generated!\n- Access Token: ${data.access_token}\n- Refresh Token: ${data.refresh_token}`
    );
  } catch (error) {
    console.error("Error fetching token:", error);

    alert("❌ Failed to generate a token! Please try again later.");
  }
}

// Check if there's a code in the URL and process it
const urlParams = new URLSearchParams(window.location.search);
const authCode = urlParams.get("code");

if (authCode) {
  generateToken(authCode);
}

// Refresh Token
refreshBtn.addEventListener("click", async function () {
  const refreshToken = document.querySelector(".client-refresh").value;

  if (!refreshToken) {
    alert("❌ Please enter a refresh token.");
    return;
  }

  try {
    const response = await fetch(
      `https://api.twitchtokentool.click/refresh/${encodeURIComponent(
        refreshToken
      )}`
    );

    const data = await response.json();

    if (data.access_token) {
      alert(
        `✅ Access Token Refreshed!\n- New Access Token: ${data.access_token}` +
          data.refresh_token
          ? `\n- New Refresh Token: ${data.refresh_token}`
          : ""
      );
    } else {
      alert("❌ Failed to refresh your token! Please try again later.");
    }
  } catch (error) {
    alert("❌ Error connecting to server.");
  }
});
