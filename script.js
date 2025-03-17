// Initialize AOS
AOS.init({
  duration: 800,
  easing: "ease-in-out",
  once: true,
});

const generateBtn = document.querySelector(".generate");
const refreshBtn = document.querySelector(".refresh");
const validateBtn = document.querySelector(".validate");
const revokeBtn = document.querySelector(".revoke");

document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const darkModeIcon = document.getElementById("darkModeIcon");
  const backToTopButton = document.getElementById("backToTop");
  const title = document.getElementById("title");
  const inputs = document.querySelectorAll("#form-generate");
  const refreshInputs = document.querySelectorAll("#form-refresh");
  const validateInputs = document.querySelectorAll("#form-validate");
  const revokeInputs = document.querySelectorAll("#form-revoke");

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

  // Mobile Menu dynamic icon
  const menuToggle = document.getElementById("menuToggle");
  const menuIcon = document.getElementById("menuIcon");
  const navMenu = document.getElementById("navMenu");
  const navbar = document.querySelector(".navbar");

  menuToggle.addEventListener("click", function () {
    if (navMenu.classList.contains("show")) {
      menuIcon.classList.replace("fa-xmark", "fa-bars");
    } else {
      menuIcon.classList.replace("fa-bars", "fa-xmark");
    }
  });

  navMenu.addEventListener("hidden.bs.collapse", function () {
    menuIcon.classList.replace("fa-xmark", "fa-bars");
  });

  navMenu.addEventListener("shown.bs.collapse", function () {
    menuIcon.classList.replace("fa-bars", "fa-xmark");
  });

  // Close menu when clicking outside
  document.addEventListener("click", function (event) {
    if (!navbar.contains(event.target) && navMenu.classList.contains("show")) {
      new bootstrap.Collapse(navMenu).hide();
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

  // Validate button disabled check
  function checkValidateInputs() {
    const allFilled = [...validateInputs].every(
      (input) => input.value.trim() !== ""
    );
    validateBtn.disabled = !allFilled;
  }

  validateInputs.forEach((input) =>
    input.addEventListener("input", checkValidateInputs)
  );

  // Revoke button disabled check
  function checkRevokeInputs() {
    const allFilled = [...revokeInputs].every(
      (input) => input.value.trim() !== ""
    );
    revokeBtn.disabled = !allFilled;
  }

  revokeInputs.forEach((input) =>
    input.addEventListener("input", checkRevokeInputs)
  );

  // Twitch Redirect URI
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

    const selectedScopes =
      JSON.parse(localStorage.getItem("selectedScopes")) || [];
    const scopeString = selectedScopes.join(" ");

    const encodedRedirectUri = encodeURIComponent(window.location.origin);
    const encodedScopes = encodeURIComponent(scopeString);

    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${encodedScopes}`;

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
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        }),
      });

      localStorage.removeItem("clientId");
      localStorage.removeItem("clientSecret");
      localStorage.removeItem("selectedScopes");
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

  // Validate Token
  validateBtn.addEventListener("click", async function () {
    const validateToken = document.querySelector(".validate-token").value;

    if (!validateToken) {
      alert("⚠️ Please enter a access token.");
      return;
    }

    try {
      const response = await fetch(
        `https://api.twitchtokentool.click/validate/${encodeURIComponent(
          validateToken
        )}`
      );

      const data = await response.json();

      showValidateModal(data);
    } catch (error) {
      console.error("Error validating token:", error);

      alert("❌ Error connecting to server.");
    }
  });

  // Revoke Token
  revokeBtn.addEventListener("click", async function () {
    const revokeToken = document.querySelector(".revoke-token").value;

    if (!revokeToken) {
      alert("⚠️ Please enter a access token.");
      return;
    }

    try {
      await fetch(
        `https://api.twitchtokentool.click/revoke/${encodeURIComponent(
          revokeToken
        )}`
      );

      showRevokeModal();
    } catch (error) {
      console.error("Error revoking token:", error);

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
      const copyIcon = document.getElementById(targetId + "Icon");

      navigator.clipboard.writeText(targetInput.value).then(() => {
        copyIcon.classList.replace("fa-check", "fa-copy");

        if (targetId === "accessToken") copiedAccess = true;
        if (targetId === "refreshToken") copiedRefresh = true;

        // Enable the "Done" button only if both are copied
        if (copiedAccess && copiedRefresh) {
          doneButton.disabled = false;
        }

        // Reset button text after a delay
        setTimeout(() => {
          copyIcon.classList.replace("fa-copy", "fa-check");
        }, 2000);
      });
    });
  });

  // Close modal on "Done" button click
  doneButton.addEventListener("click", function () {
    tokenModal.hide();
  });

  // Configure Scopes Modal
  function populateScopesTable() {
    const tableBody = document.getElementById("scopesTableBody");
    tableBody.innerHTML = "";

    fetch("./scopes.json")
      .then((response) => response.json())
      .then((scopes) => {
        scopes.forEach((scope) => {
          const row = document.createElement("tr");

          row.innerHTML = `
          <td>${scope.name}</td>
          <td>${scope.description}</td>
          <td>
            <input type="checkbox" class="scope-checkbox" value="${scope.name}">
          </td>
        `;

          tableBody.appendChild(row);
        });

        selectAll();
      });
  }

  // Store Selected Scopes and Apply them
  document.getElementById("applyScopes").addEventListener("click", () => {
    const selectedScopes = Array.from(
      document.querySelectorAll(".scope-checkbox:checked")
    ).map((checkbox) => checkbox.value);

    localStorage.setItem("selectedScopes", JSON.stringify(selectedScopes));

    document.getElementById("selectAll").checked = false;
  });

  // Select/Deselect All checkboxes
  function selectAll() {
    const selectAll = document.getElementById("selectAll");
    const checkboxes = document.querySelectorAll(".scope-checkbox");

    selectAll.addEventListener("change", () => {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = selectAll.checked;
      });
    });
  }

  // Run this when modal opens
  document
    .getElementById("scopesModal")
    .addEventListener("show.bs.modal", () => {
      populateScopesTable();
    });

  // Validate Modal
  function showValidateModal(data) {
    const validateModal = new bootstrap.Modal(
      document.getElementById("validateModal")
    );

    document.getElementById("clientId").value = data.client_id;
    document.getElementById("ownerName").value = data.login;
    document.getElementById("scopes").value = data.scopes;
    document.getElementById("expire").value = data.expires_in;

    validateModal.show();
  }

  // Revoke Modal
  function showRevokeModal() {
    const revokeModal = new bootstrap.Modal(
      document.getElementById("revokeModal")
    );

    revokeModal.show();
  }
});
