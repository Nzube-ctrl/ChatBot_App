const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("node:http");
const { join } = require("node:path");

const app = express();
const server = createServer(app);
const io = new Server(server, { connectionStateRecovery: {} });

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

const Orders = {
  2: "Hamburgers $5.00",
  3: "Pizza $4.00",
  4: "Chicken Meat-Pie $3.00",
};

let orderHistory = [];
let currentOrder = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  const showOptions = () => {
    socket.emit(
      "chat message",
      `Welcome! What would you like to Order?\n
  Select 1 to Place an order\n
  Select 99 to checkout order\n
  Select 98 to see order history\n
  Select 97 to see current order\n
  Select 0 to cancel order`
    );
  };

  showOptions();

  socket.on("chat message", (msg) => {
    switch (msg.trim()) {
      case "1":
        socket.emit(
          "chat message",
          `Here are the items you can order:\n
  2. ${Orders[2]}\n
  3. ${Orders[3]}\n
  4. ${Orders[4]}\n
  Please enter the number of the item you want to add to your order.`
        );
        break;
      case "99":
        if (currentOrder.length > 0) {
          orderHistory.push([...currentOrder]);
          currentOrder = [];
          socket.emit(
            "chat message",
            "Order placed! You can place a new order if you wish."
          );
        } else {
          socket.emit(
            "chat message",
            "No order to place. You can place a new order."
          );
        }
        break;
      case "98":
        if (orderHistory.length > 0) {
          const history = orderHistory
            .map((order, index) => `Order ${index + 1}: ${order.join(", ")}`)
            .join("\n");
          socket.emit("chat message", `Order history:\n${history}`);
        } else {
          socket.emit("chat message", "No order history available.");
        }
        break;
      case "97":
        if (currentOrder.length > 0) {
          socket.emit(
            "chat message",
            `Current order: ${currentOrder.join(", ")}`
          );
        } else {
          socket.emit("chat message", "No current order.");
        }
        break;
      case "0":
        if (currentOrder.length > 0) {
          currentOrder = [];
          socket.emit("chat message", "Order cancelled.");
        } else {
          socket.emit("chat message", "No order to cancel.");
        }
        break;
      default:
        const item = Orders[msg.trim()];
        if (item) {
          currentOrder.push(item);
          socket.emit("chat message", `${item} added to your order.`);
        } else {
          socket.emit("chat message", "Invalid selection. Please try again.");
        }
        break;
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "Page Not Found " });
});

server.listen(4000, () => {
  console.log(`Server is running on http://localhost:4000`);
});
