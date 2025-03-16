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
  const clientSecret = document.querySelector(".client-secret").value;

  if (!clientId || !clientSecret) {
    alert("⚠️ Please enter both Client ID and Client Secret.");
    return;
  }

  localStorage.setItem("clientId", clientId);
  localStorage.setItem("clientSecret", clientSecret);

  const encodedRedirectUri = encodeURIComponent(window.location.origin);
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code`;

  window.location.href = authUrl;
});

async function generateToken(code) {
  const clientId = localStorage.getItem("clientId");
  const clientSecret = localStorage.getItem("clientSecret");

  if (!clientId || !clientSecret) {
    alert("⚠️ Please enter both Client ID and Client Secret.");
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

    showTokenModal(
      "Token Successfully Generated!",
      "Make sure to store these somewhere and keep them safe.",
      data.access_token,
      data.refresh_token
    );

    await fetch("https://api.twitchtokentool.click/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: data.refresh_token,
      }),
    });

    localStorage.removeItem("clientId");
    localStorage.removeItem("clientSecret");
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
    alert("⚠️ Please enter a refresh token.");
    return;
  }

  try {
    const response = await fetch(
      `https://api.twitchtokentool.click/refresh/${encodeURIComponent(
        refreshToken
      )}`
    );

    const data = await response.json();

    showTokenModal(
      "Token Refreshed!",
      "Your access token has been refreshed. Make sure to store them somewhere safe.",
      data.access_token,
      data.refresh_token
    );
  } catch (error) {
    console.error("Error refreshing token:", error);

    alert("❌ Error connecting to server.");
  }
});

// Model handle
const tokenModal = new bootstrap.Modal(document.getElementById("tokenModal"));
const doneButton = document.getElementById("doneButton");
let copiedAccess = false,
  copiedRefresh = false;

// Function to show modal with token values
function showTokenModal(title, description, accessToken, refreshToken) {
  document.getElementById("tokenModalLabel").textContent = title;
  document.getElementById("modalDescription").textContent = description;
  document.getElementById("accessToken").value = accessToken;
  document.getElementById("refreshToken").value = refreshToken;

  copiedAccess = false;
  copiedRefresh = false;
  doneButton.disabled = true;

  tokenModal.show();
}

// Copy button functionality
document.querySelectorAll(".copy-btn").forEach((button) => {
  button.addEventListener("click", function () {
    const targetId = this.getAttribute("data-target");
    const targetInput = document.getElementById(targetId);

    navigator.clipboard.writeText(targetInput.value).then(() => {
      this.textContent = "Copied!";
      this.classList.add("btn-success");

      if (targetId === "accessToken") copiedAccess = true;
      if (targetId === "refreshToken") copiedRefresh = true;

      // Enable the "Done" button only if both are copied
      if (copiedAccess && copiedRefresh) {
        doneButton.disabled = false;
      }

      // Reset button text after a delay
      setTimeout(() => {
        this.textContent = "Copy";
        this.classList.remove("btn-success");
      }, 2000);
    });
  });
});

// Close modal on "Done" button click
doneButton.addEventListener("click", function () {
  tokenModal.hide();
});
