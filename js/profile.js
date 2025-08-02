document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("http://localhost:3001/profile", {
    method: "GET",
    credentials: "include"
  });

  const profileInfo = document.getElementById("profileInfo");
  const data = await res.json();

  if (res.ok) {
    profileInfo.innerHTML = `<p><strong>Email:</strong> ${data.email}</p>`;
  } else {
    profileInfo.innerHTML = `<p>You are not logged in.<br><a href="login.html">Login here</a></p>`;
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("http://localhost:3001/logout", {
    method: "POST",
    credentials: "include"
  });
  window.location.href = "login.html";
});
