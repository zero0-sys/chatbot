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

  chatContainer.scrollTop = chatContainer.scrollHeight;
  return div;
}

/* =========================
   TYPING EFFECT
   ========================= */
function typeText(element, text) {
  let i = 0;
  const speed = 18; // makin kecil makin cepat

  function typing() {
    if (i < text.length) {
      element.innerText += text.charAt(i);
      i++;
      chatContainer.scrollTop = chatContainer.scrollHeight;
      setTimeout(typing, speed);
    }
  }

  typing();
}

/* =========================
   SEND MESSAGE (STREAMING)
   ========================= */
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";
  sendBtn.disabled = true;

  // bubble bot kosong (buat streaming)
  const botDiv = document.createElement("div");
  botDiv.className = "message bot";
  botDiv.innerText = "";
  chatContainer.appendChild(botDiv);

  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const res = await fetch("https://chatbot-production-84b4.up.railway.app/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        userId: userId
      })
    });

    // STREAM READER
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;

      if (value) {
        const chunk = decoder.decode(value);
        typeText(botDiv, chunk);
      }
    }

  } catch (err) {
    botDiv.innerText = "❌ Matrix error. Coba lagi.";
  } finally {
    sendBtn.disabled = false;
  }
}
