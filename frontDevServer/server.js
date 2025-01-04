const { timeStamp } = require("console");
const crypto = require("crypto");
const http = require("http");
const { faker } = require("@faker-js/faker");
const { fakerRU } = require("@faker-js/faker");

const cors = require("cors");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const WebSocket = require("ws");

console.log(fakerRU.person.fullName(), fakerRU.location.streetAddress());

function generateUUID() {
  return uuidv4(); // Генерация уникального UUID
}

const COMMENTS = [
  "Пожалуйста, добавьте в заказ дополнительно пачку молока и хлеб.",
  "Доставку оставьте под дверью, оплату оставлю в почтовом ящике.",
  "Перезвоните мне за 10 минут до приезда, я буду на месте.",
  "Убедитесь, что все продукты свежие, особенно фрукты и овощи.",
  "Если яиц не окажется в наличии, замените их на молоко.",
  "Оставьте заказ у соседа, если меня не будет дома.",
  "Пожалуйста, не звоните в домофон, я сплю. Просто оставьте заказ у двери.",
  "Нужно больше пакетов, пожалуйста, упакуйте каждый вид продуктов отдельно.",
  "Пожалуйста, приложите чек наружу пакета.",
  "Привезите пожалуйста заказ после 18:00, до этого времени меня не будет дома.",
];

const app = express();
const port = 4004;

// Создаем HTTP сервер на базе приложения Express
const server = http.createServer(app);

// Инициализация WebSocket сервера на том же порту
const wss = new WebSocket.Server({ server });

const DEFAULT_USER = {
  id: "0",
  email: "a@a.a",
  fullName: "Иван Петров",
  password: "qqqqqqqq",
  phoneNumber: "89934479975",
  chatWithAdminId: "0000",
};

const DEFAULT_ADMIN = {
  id: "007",
  email: "admin@admin.ru",
  fullName: "Админ Админ",
  password: "11111111",
  phoneNumber: "8-989-898-98-98",
};

const generateUsers = () => {
  const users = {};
  // Добавление администратора
  users["admin@admin.ru"] = DEFAULT_ADMIN;
  users["89934479975"] = DEFAULT_USER;

  // Генерация 20 пользователей
  for (let i = 0; i < 20; i++) {
    const email = faker.internet.email();
    users[email] = {
      email: email,
      fullName: fakerRU.person.fullName(),
      password: faker.internet.password(),
      phoneNumber: "8-999-888-55-33",
      id: faker.number.float(),
    };
  }
  return users;
};

let users = generateUsers();

function handleCallHistoryStats(ws) {
  const statuses = [
    "idle",
    "processing",
    "accepted",
    "declined",
    "onTheWay",
    "onTheSpot",
    "completed",
    "canceled",
  ];
  const statusCounts = {};

  statuses.forEach((status) => {
    // Генерация случайного количества для каждого статуса от 1 до 100
    statusCounts[status] = Math.floor(Math.random() * 100) + 1;
  });

  const sendStats = () => {
    const response = {
      type: "callHistoryStats",
      payload: statusCounts,
    };
    ws.send(JSON.stringify(response));
  };

  // Отправка начальной статистики
  sendStats();

  // Создание интервала для регулярного обновления статистики
  const intervalId = setInterval(() => {
    Object.keys(statusCounts).forEach((key) => {
      statusCounts[key] += 1; // Увеличение счетчика каждого статуса на 1
    });
    sendStats();
  }, 5000);

  // Обработка закрытия соединения и очистка интервала
  ws.on("close", () => {
    clearInterval(intervalId);
    console.log("WebSocket connection closed and interval cleared.");
  });

  ws.on("error", () => {
    clearInterval(intervalId);
    console.log("WebSocket encountered an error and interval cleared.");
  });
}

function handleNewActivity(ws) {
  // Генерация случайной активности
  const generateActivity = () => {
    const userKeys = Object.keys(users);
    const userKey = userKeys[Math.floor(Math.random() * userKeys.length)];
    return {
      date: faker.date.recent(90).toISOString(),
      status: randomize([
        "processing",
        "accepted",
        "onTheWay",
        "onTheSpot",
        "completed",
        "canceled",
      ]),
      address: fakerRU.location.streetAddress(),
      comment: COMMENTS[Math.floor(Math.random() * COMMENTS.length)],
      id: faker.number.float(),
      userId: users[userKey].id,
      userFullName: users[userKey].fullName,
    };
  };

  let activityRecord = generateActivity();

  // Отправка активности
  const sendActivity = () => {
    const response = {
      type: "newActivity",
      payload: activityRecord,
    };
    ws.send(JSON.stringify(response));
  };

  setTimeout(sendActivity, 3000);

  // Обработка закрытия соединения и очистка интервала
  ws.on("close", () => {
    // clearInterval(intervalId);
    console.log("WebSocket connection closed and interval cleared.");
  });

  ws.on("error", () => {
    // clearInterval(intervalId);
    console.log("WebSocket encountered an error and interval cleared.");
  });
}

const generateChatHistory = (chatId) => {
  const length = 20;
  return Array.from({ length }, (_, i, arr) => ({
    timeStamp: new Date().valueOf() - (100000 - i * 5000),
    text: fakerRU.lorem.sentence(),
    messageId: generateUUID(),
    wasReadBy:
      i < length - 3 ? [DEFAULT_USER.id] : [DEFAULT_ADMIN.id, DEFAULT_USER.id],
    senderId: i % 2 ? DEFAULT_ADMIN.id : DEFAULT_USER.id,
    // receiverId: i % 2 ? DEFAULT_USER.id : DEFAULT_ADMIN.id,
    chatId,
  }));
};

function sendRandomMessage(ws) {
  // для проверки админа
  const randomMessage = {
    timeStamp: Date.now(),
    text: fakerRU.lorem.sentence(),
    messageId: generateUUID(),
    wasReadBy: [DEFAULT_USER.id],
    senderId: DEFAULT_USER.id,
    chatId: "0000",
  };

  // для проверки юзера
  // const randomMessage = {
  //   timeStamp: Date.now(),
  //   text: faker.lorem.sentence(),
  //   messageId: generateUUID(),
  //   wasReadBy: [DEFAULT_ADMIN.id],
  //   senderId: DEFAULT_ADMIN.id,
  //   chatId: "0000",
  // };

  const response = { type: "message", payload: randomMessage };

  // Отправляем сообщение через WebSocket
  ws.send(JSON.stringify(response));
}

app.use(cors());
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

function generateTokens() {
  return {
    accessToken: crypto.randomBytes(16).toString("hex"),
    refreshToken: crypto.randomBytes(16).toString("hex"),
  };
}

const sendOrderStatuses = (ws) => {
  ws.send(
    JSON.stringify({
      type: "orderStatus",
      payload: { status: "processing", timeStamp: new Date().valueOf() },
    })
  );

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: "orderStatus",
        payload: { status: "accepted", timeStamp: new Date().valueOf() },
      })
    );
  }, 1000);

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: "orderStatus",
        payload: { status: "onTheWay", timeStamp: new Date().valueOf() },
      })
    );
  }, 3000);

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: "orderStatus",
        payload: { status: "onTheSpot", timeStamp: new Date().valueOf() },
      })
    );
  }, 5000);

  setTimeout(() => {
    ws.send(
      JSON.stringify({
        type: "orderStatus",
        payload: { status: "completed", timeStamp: new Date().valueOf() },
      })
    );
  }, 7000);
};

// Обработчик WebSocket соединений
wss.on("connection", function connection(ws) {
  console.log("WebSocket connection established");

  sendOrderStatuses(ws);

  // Отправка приветственного сообщения сразу после подключения
  ws.send(
    JSON.stringify({
      type: "connection",
      message: "Connection successful",
    })
  );

  ws.on("message", function incoming(message) {
    // Обработка входящего сообщения и ответ в зависимости от содержимого
    const receivedData = JSON.parse(message);

    if (receivedData.type === "ping") {
      ws.send(
        JSON.stringify({
          type: "pong",
          message: "Pong!",
        })
      );
    }

    if (receivedData.type === "callStatus") {
      ws.send(
        JSON.stringify({
          type: "callStatus",
          message: "idle",
          timeStamp: new Date().valueOf(),
        })
      );
    }

    if (receivedData.type === "getNewActivity") {
      handleNewActivity(ws);
    }
  });

  const messageInterval = setInterval(() => {
    sendRandomMessage(ws);
  }, 10000); // Интервал 10 секунд

  ws.on("close", function () {
    console.log("WebSocket connection closed");
    clearInterval(messageInterval);

    // Отправка сообщения о закрытии соединения
    ws.send(
      JSON.stringify({
        type: "disconnection",
        message: "Disconnected",
        timeStamp: new Date().valueOf(),
      })
    );
  });

  ws.on("error", function (error) {
    clearInterval(messageInterval);

    console.log("WebSocket error:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "An error occurred",
      })
    );
  });
});

// REST API endpoints
app.post("/api/auth/registration", (req, res) => {
  const { email, password } = req.body;
  if (users[email]?.toLocaleLowerCase()) {
    res
      .status(400)
      .json({ message: "Пользователь с таким имейлом уже существует" });
  } else {
    const tokens = generateTokens();
    users[email] = { ...DEFAULT_USER, email, password, tokens };
    res.status(200).json({ message: "OK" });
  }
});

app.get("/api/currentUser", (req, res) => {
  res.json(DEFAULT_ADMIN);
});

app.get("/api/chats/:id/messages", (req, res) => {
  const chatId = req.params.id;

  const mockChatHistory = [
    {
      timeStamp: new Date().setMinutes(new Date().getMinutes() - 10),
      text: "Здравствуйте, мой заказ опоздывает? Ожидаю уже больше часа.",
      messageId: generateUUID(),
      wasReadBy: [DEFAULT_ADMIN.id],
      senderId: DEFAULT_USER.id,
      chatId: chatId,
    },
    {
      timeStamp: new Date().setMinutes(new Date().getMinutes() - 9),
      text: "Здравствуйте! Позвольте мне проверить статус вашего заказа.",
      messageId: generateUUID(),
      wasReadBy: [],
      senderId: DEFAULT_ADMIN.id,
      chatId: chatId,
    },
    {
      timeStamp: new Date().setMinutes(new Date().getMinutes() - 8),
      text: "Ваш заказ уже в пути. К сожалению, возникла задержка из-за пробок на дороге. Желаете продолжить ожидание или отменить заказ?",
      messageId: generateUUID(),
      wasReadBy: ["user_id"],
      senderId: DEFAULT_ADMIN.id,
      chatId: chatId,
    },
    {
      timeStamp: new Date().setMinutes(new Date().getMinutes() - 6),
      text: "Продолжу ожидать, спасибо. Пожалуйста, сообщите, как только курьер будет рядом.",
      messageId: generateUUID(),
      wasReadBy: ["dispatcher_id"],
      senderId: DEFAULT_USER.id,
      chatId: chatId,
    },
    {
      timeStamp: new Date().setMinutes(new Date().getMinutes() - 5),
      text: "Конечно, мы уведомим вас за 10 минут до прибытия курьера. Благодарим за терпение!",
      messageId: generateUUID(),
      wasReadBy: ["user_id"],
      senderId: DEFAULT_ADMIN.id,
      chatId: chatId,
    },
  ];

  res.json(mockChatHistory);
});

app.get("/api/chats/:chatId/stats", (req, res) => {
  const chatId = req.params.chatId; // Extracting the chat ID from the URL parameter

  // Mock data for chat statistics
  const chatStats = {
    total: Math.floor(Math.random() * 100),
    read: Math.floor(Math.random() * 50),
    unRead: Math.floor(Math.random() * 50),
  };

  // You might want to check if such a chat exists or if the user has the right to view these stats
  // For now, we assume the chat ID is valid and the user can view the stats
  res.json(chatStats);
});

// Новый REST API эндпоинт для получения статистики чатов
app.get("/api/chats", (req, res) => {
  // Статистика для подсчета количества прочитанных и непрочитанных сообщений

  const user2Id = generateUUID();
  const data = [
    {
      chatId: "0000",
      users: [DEFAULT_USER.id, DEFAULT_ADMIN.id],
      fullName: DEFAULT_USER.fullName,
      hasNewMessages: true,
      lastMessage: {
        timeStamp: Date.now(),
        text: "Спасибо, оставайтесь на связи.",
        messageId: generateUUID(),
        wasReadBy: [DEFAULT_USER.id],
        senderId: DEFAULT_ADMIN.id,
        chatId: "0000",
      },
    },
    {
      chatId: "1111",
      users: [user2Id, DEFAULT_ADMIN.id],
      fullName: "Алексей Иванов",
      hasNewMessages: true,
      lastMessage: {
        timeStamp: Date.now(),
        text: "Группа выехала на место, ожидайте.",
        messageId: generateUUID(),
        wasReadBy: [user2Id],
        senderId: DEFAULT_ADMIN.id,
        receiverId: DEFAULT_USER.id,
      },
    },
  ];

  res.json(data);
});

app.post("/api/user/create", (req, res) => {
  const { email, password } = req.body;
  if (users[email]?.toLocaleLowerCase()) {
    res
      .status(400)
      .json({ errorMessage: "Пользователь с таким имейлом уже существует" });
  } else {
    const tokens = generateTokens();
    users[email] = { ...DEFAULT_USER, email, password, tokens };
    res.status(200).json({ message: "OK" });
  }
});

app.get("/api/users", (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    sort = "fullName",
    order = "asc",
  } = req.query;

  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 10;

  const filteredUsers = Object.values(users).filter((user) =>
    Object.values(user).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  const sortedUsers = filteredUsers.sort((a, b) => {
    const valueA = a[sort] ? String(a[sort]).toLowerCase() : "";
    const valueB = b[sort] ? String(b[sort]).toLowerCase() : "";
    return order === "asc"
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });

  const startIndex = (pageNumber - 1) * limitNumber;
  const endIndex = startIndex + limitNumber;
  const usersOnPage = sortedUsers.slice(startIndex, endIndex);

  res.json({
    items: usersOnPage,
    pageNumber,
    totalPages: Math.ceil(sortedUsers.length / limitNumber),
    totalRecords: sortedUsers.length,
  });
});

// New fetchCallHistory endpoint with mock data
app.get("/api/users/:userId/callHistory", (req, res) => {
  const { userId } = req.params;
  const {
    page = 1,
    limit = 10,
    search = "",
    sort = "date",
    order = "asc",
  } = req.query;

  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 10;

  // Mock call history data
  const callHistory = Array.from({ length: 20 }).map((_, index) => {
    const userIndex = Math.round(
      Math.random() * (Object.values(users).length - 1)
    );

    const userKey = Object.keys(users)[userIndex];

    return {
      date: faker.date.recent(90).toISOString(),
      status: randomize([
        "processing",
        "accepted",
        "onTheWay",
        "onTheSpot",
        "completed",
        "canceled",
      ]),
      address: fakerRU.location.streetAddress(),
      comment: COMMENTS[Math.floor(Math.random() * COMMENTS.length)],
      id: faker.number.float(),
      userId: users[userKey].id, // Связываем каждый вызов с ID пользователя
      userFullName: users[userKey].fullName,
    };
  });

  // Apply search and sort filters
  const filteredHistory = callHistory
    .filter((entry) =>
      entry.comment.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const valueA = a[sort] || "";
      const valueB = b[sort] || "";
      return order === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });

  // Paginate the results
  const startIndex = (pageNumber - 1) * limitNumber;
  const endIndex = startIndex + limitNumber;
  const historyForPage = filteredHistory.slice(startIndex, endIndex);

  res.json({
    items: historyForPage,
    pageNumber,
    totalPages: Math.ceil(filteredHistory.length / limitNumber),
    totalRecords: filteredHistory.length,
  });
});

app.get("/api/users/currentUser", (req, res) => {
  res.json(DEFAULT_USER);
});

app.get("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const user = Object.values(users).find((user) => user.id.toString() === id);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ errorMessage: "User not found" });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { phoneNumber, password } = req.body;
  if (
    users[phoneNumber.toLocaleLowerCase()] &&
    users[phoneNumber.toLocaleLowerCase()].password.toLocaleLowerCase() ===
      password.toLocaleLowerCase()
  ) {
    const tokens = generateTokens();
    users[phoneNumber.toLocaleLowerCase()] = {
      ...users[phoneNumber.toLocaleLowerCase()],
      ...tokens,
    };
    res.json(tokens);
  } else {
    res.status(401).json({ errorMessage: "Неверные учетные данные" });
  }
});

app.put("/api/user", (req, res) => {
  const { email, fullName, password, phoneNumber } = req.body;
  if (users[DEFAULT_USER.email]) {
    users[DEFAULT_USER.email] = {
      ...users[DEFAULT_USER.email],
      email: email || users[DEFAULT_USER.email].email,
      fullName: fullName || users[DEFAULT_USER.email].fullName,
      password: password || users[DEFAULT_USER.email].password,
      phoneNumber: phoneNumber || users[DEFAULT_USER.email].phoneNumber,
    };
    res.json(users[DEFAULT_USER.email]);
  } else {
    res.status(404).json({ errorMessage: "Пользователь не найден" });
  }
});

app.patch("/api/call/:id", (req, res) => {
  res.status(200).json({ message: "OK" });
});

app.post("/api/refresh", (req, res) => {
  const { refreshToken } = req.body;
  const user = Object.values(users).find(
    (user) => user.refreshToken === refreshToken
  );
  if (user) {
    const tokens = generateTokens();
    Object.keys(users).forEach((key) => {
      if (users[key].refreshToken === refreshToken) {
        users[key] = { ...users[key], ...tokens };
      }
    });
    res.json(tokens);
  } else {
    res.status(403).json({ errorMessage: "Неверный refresh token" });
  }
});

app.get("/api/orders", (req, res) => {
  // Функция для создания случайных заказов
  const generateOrders = (count = 10) => {
    const orders = [];
    for (let i = 0; i < count; i++) {
      const status = randomize([
        "processing",
        "accepted",
        "onTheWay",
        "onTheSpot",
        "completed",
        "canceled",
      ]);
      orders.push({
        id: generateUUID(),
        address: fakerRU.location.streetAddress(),
        orderComment: COMMENTS[Math.floor(Math.random() * COMMENTS.length)],
        createdAt: faker.date.recent(90).getTime(),
        statusData: {
          status: status,
          timeStamp: new Date().getTime() - (100000 - i * 10000), // Ставим случайные метки времени для статуса
        },
      });
    }
    return orders;
  };

  // Генерация массива заказов
  const orders = generateOrders();
  res.json(orders);
});

// Запуск сервера
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function randomize(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Please provide a non-empty array.");
  }
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}
