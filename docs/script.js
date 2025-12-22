const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

/* =========================
   USER ID (MEMORY PER USER)
   ========================= */
let userId = localStorage.getItem("matrix_user_id");

if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem("matrix_user_id", userId);
}

/* =========================
   EVENT
   ========================= */
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

/* =========================
   ADD MESSAGE
   ========================= */
function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerText = text;
  chatContainer.appendChild(div);

  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth"
  });
}

/* =========================
   SEND MESSAGE
   ========================= */

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  sendBtn.disabled = true;

  const typing = document.createElement("div");
  typing.className = "message bot";
  typing.innerText = "Matrix lagi mikir...";
  chatContainer.appendChild(typing);

  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth"
  });

  try {
    const res = await fetch("https://chatbot-production-84b4.up.railway.app/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        userId: userId
      })
    });

    const data = await res.json();
    typing.remove();
    addMessage(data.reply, "bot");

  } catch (err) {
    typing.remove();
    addMessage("❌ Gagal terhubung ke server", "bot");
  } finally {
    sendBtn.disabled = false;
  }
}