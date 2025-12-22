const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

/* =========================
   USER ID
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
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return div;
}

/* =========================
   TYPING EFFECT
   ========================= */
function typeText(el, text) {
  el.innerText = "";
  let i = 0;
  const speed = 18;

  function typing() {
    if (i < text.length) {
      el.innerText += text.charAt(i);
      i++;
      chatContainer.scrollTop = chatContainer.scrollHeight;
      setTimeout(typing, speed);
    }
  }

  typing();
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

  const botDiv = addMessage("Matrix lagi mikir...", "bot");

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

    // ⬇️ INI KUNCI NYA
    typeText(botDiv, data.reply);

  } catch (err) {
    botDiv.innerText = "❌ Matrix error. Coba lagi.";
  } finally {
    sendBtn.disabled = false;
  }
}
