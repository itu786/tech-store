document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const res = await fetch("http://localhost:3001/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include"
  });

  const data = await res.json();
  alert(data.message);
  if (res.ok) window.location.href = "login.html";
});
