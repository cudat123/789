const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");

const PORT = 10000;

// ================== BIẾN ==================
let latestResult = {
  Ket_qua: "Chưa có kết quả",
  Phien: 0,
  Tong: 0,
  Xuc_xac_1: 0,
  Xuc_xac_2: 0,
  Xuc_xac_3: 0,
  id: "@tiendataox"
};

let lastEventId = 19;

// ================== WEBSOCKET ==================
const WS_URL = "wss://websocket.atpman.net/websocket";

const LOGIN_MESSAGE = [
  1,
  "MiniGame",
  "wanglin2019aaand",
  "WamgLin2091",
  {
    info: "{\"ipAddress\":\"113.185.45.88\"}",
    signature: "55A3202A0554F20C01D09CD018386265"
  }
];

const SUBSCRIBE_TX_RESULT = [6, "MiniGame", "taixiuUnbalancedPlugin", { cmd: 2000 }];
const SUBSCRIBE_LOBBY = [6, "MiniGame", "lobbyPlugin", { cmd: 10001 }];

function startWebSocket() {
  console.log("🔄 Đang kết nối WebSocket...");

  const ws = new WebSocket(WS_URL, {
    headers: {
      Origin: "https://play.789club.sx",
      "User-Agent": "Mozilla/5.0"
    }
  });

  ws.on("open", () => {
    console.log("✅ Đã kết nối WebSocket");
    ws.send(JSON.stringify(LOGIN_MESSAGE));

    setTimeout(() => {
      ws.send(JSON.stringify(SUBSCRIBE_TX_RESULT));
      ws.send(JSON.stringify(SUBSCRIBE_LOBBY));
    }, 1000);

    // Ping mỗi 10s
    setInterval(() => {
      ws.send("2");
      ws.send(JSON.stringify(SUBSCRIBE_TX_RESULT));
      ws.send(JSON.stringify([7, "Simms", lastEventId, 0, { id: 0 }]));
    }, 10000);
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (Array.isArray(data)) {
        // update lastEventId
        if (
          data.length >= 3 &&
          data[0] === 7 &&
          data[1] === "Simms" &&
          typeof data[2] === "number"
        ) {
          lastEventId = data[2];
        }

        if (data.length >= 2 && typeof data[1] === "object") {
          const msg = data[1];

          if (msg.cmd === 2006) {
            const sid = msg.sid;
            const d1 = msg.d1 || 0;
            const d2 = msg.d2 || 0;
            const d3 = msg.d3 || 0;

            const tong = d1 + d2 + d3;
            const ketqua = tong >= 11 ? "Tài" : "Xỉu";

            latestResult = {
              Ket_qua: ketqua,
              Phien: sid,
              Tong: tong,
              Xuc_xac_1: d1,
              Xuc_xac_2: d2,
              Xuc_xac_3: d3,
              id: "@tiendataox"
            };

            console.log("🎲 CẬP NHẬT:", latestResult);
          }
        }
      }
    } catch (err) {
      console.log("❌ Lỗi parse:", err.message);
    }
  });

  ws.on("close", () => {
    console.log("🔌 WebSocket đóng. Kết nối lại sau 5s...");
    setTimeout(startWebSocket, 5000);
  });

  ws.on("error", (err) => {
    console.log("❌ WebSocket lỗi:", err.message);
  });
}

// ================== HTTP SERVER ==================
const app = express();
app.use(cors());

app.get("/taixiu", (req, res) => {
  res.json(latestResult);
  console.log("🌐 API /taixiu được gọi");
});

app.listen(PORT, () => {
  console.log(`🌐 Server chạy tại http://localhost:${PORT}/taixiu`);
});

// ================== RUN ==================
startWebSocket();
