const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");

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
    addMessage(data.reply || "…", "bot");

  } catch (err) {
    typing.remove();
    addMessage("❌ Gagal terhubung ke server", "bot");
  } finally {
    sendBtn.disabled = false;
  }
}

/* =========================
   🎤 PUSH TO TALK (VOICE)
   ========================= */
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "id-ID";
  recognition.interimResults = false;
  recognition.continuous = false;

  micBtn.addEventListener("click", () => {
    recognition.start();
    micBtn.innerText = "⏺️";
  });

  recognition.onresult = (event) => {
    const voiceText = event.results[0][0].transcript;
    userInput.value = voiceText;
    sendMessage();
  };

  recognition.onend = () => {
    micBtn.innerText = "🎤";
  };

} else {
  micBtn.disabled = true;
  micBtn.innerText = "❌";
}
