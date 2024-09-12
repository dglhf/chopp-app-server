const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const app = express();
const port = 4004;

const DEFAULT_USER = {
    email: "a@a.a",
    fullName: "Ivan Pupkin",
    password: "11111111",
    phoneNumber: "8-989-898-98-98",
};

app.use(cors());
app.use(express.json());

// Middleware для логирования запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

let users = { [DEFAULT_USER.email]: DEFAULT_USER };

function generateTokens() {
    return {
        accessToken: crypto.randomBytes(16).toString("hex"),
        refreshToken: crypto.randomBytes(16).toString("hex"),
    };
}

app.post("/api/user/create", (req, res) => {
    const { email, password } = req.body;
    if (users[email]?.toLocaleLowerCase()) {
        res
            .status(400)
            .json({ errorMessage: "Пользователь с таким имейлом уже существует" });
    } else {
        res.status(200).json({ message: "OK" });
    }
});

app.post("/api/login", (req, res) => {
    const { login, password } = req.body;
    console.log('login, password: ', login, password)
    console.log('users: ', users[login.toLocaleLowerCase()]?.password?.toLocaleLowerCase(), password?.toLocaleLowerCase(), users[login.toLocaleLowerCase()]?.password?.toLocaleLowerCase() === password?.toLocaleLowerCase())

    if (users[login.toLocaleLowerCase()] && users[login.toLocaleLowerCase()]?.password?.toLocaleLowerCase() === password?.toLocaleLowerCase()) {
        const tokens = generateTokens();
        users[login.toLocaleLowerCase()] = { ...users[login.toLocaleLowerCase()], ...tokens };
        res.json(tokens);
    } else {
        res.status(401).json({ errorMessage: "Неверные учетные данные" });
    }
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

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});