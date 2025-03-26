import { Server } from "socket.io";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
// ✅ Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/chatDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const MessageSchema = new mongoose.Schema({
  messageId: { type: String, default: uuidv4 },
  senderId: String,
  receiverId: String,
  content: String,
  isRead: { type: Boolean, default: false }, // 🔥 Track if the message is read
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", MessageSchema);

const io = new Server(3500, {
  cors: { origin: "*" }
});

const users = {}; // Store userId -> socketId mapping

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // ✅ Store user ID when they join
  socket.on("registerUser", (userId) => {
    users[userId] = socket.id;
    console.log(`✅ User registered: ${userId} -> ${socket.id}`);
  });

  // ✅ Send message and store in database
  socket.on("sendMessage", async (data) => {
    console.log(`📩 Message from ${data.senderId} to ${data.receiverId}: ${data.content}`);

    // ✅ Save message in database
    const newMessage = new Message({
      messageId: data.messageId || uuidv4(),  
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
    });
    await newMessage.save();
    const responseMessage = newMessage;
    delete responseMessage._id;
    delete responseMessage.__v;
    // ✅ Send to recipient if online
    const receiverSocketId = users[data.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", newMessage);
      console.log(`📤 Message sent to ${data.receiverId} (${receiverSocketId})`);
      console.log(`${newMessage}`);
    } else {
      console.log(`❌ User ${data.receiverId} is not online.`);
    }
  });

  // ✅ Mark message as read
  socket.on("markAsRead", async ({ messageId }) => {
    await Message.findByIdAndUpdate(messageId, { isRead: true });
    console.log(`✅ Message ${messageId} marked as read`);
  });

  // ✅ Remove user when they disconnect
  socket.on("disconnect", () => {
    for (const userId in users) {
      if (users[userId] === socket.id) {
        console.log(`❌ User disconnected: ${userId}`);
        delete users[userId];
        break;
      }
    }
  });
});
