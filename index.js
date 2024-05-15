import express from "express";
import { engine } from "express-handlebars";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
import bodyParser from "body-parser";
import { translate } from "bing-translate-api";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

io.on("connection", (socket) => {
    console.log("new connection", socket.id);
    socket.on("translateQ", async (data) => {
        const { text, from, to } = data;
        try {
            let response = await translate(text, from, to);
            socket.emit("translateA", { transcript: response.translation });
        } catch (e) {
            socket.emit("translateError", { error: e.message });
        }
    });

    socket.on("audio", (data) => {
        console.log(data.chunks);
    });
});

app.get("/", (req, res) => {
    let roomId = uuid();
    console.log(roomId);
    res.render("home", { roomId: roomId });
});

app.get("/room/:roomId", (req, res) => {
    let roomId = req.params.roomId;
    res.render("room", { roomId: roomId });
});

app.post("/createRoom", (req, res) => {
    const { roomId, displayName } = req.body;
    if (!displayName) {
        res.status(400).json({ error: "DisplayName is required" });
        return;
    }
    res.status(200).json({ roomId: roomId });
});

app.post("/joinRoom", (req, res) => {
    const { roomId, displayName } = req.body;
    if (!roomId || !displayName) {
        res.status(400).json({ error: "RoomId and DisplayName are required" });
        return;
    }
    res.status(200).json({ roomId: roomId });
});

server.listen(3000);
