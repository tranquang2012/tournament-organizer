const { chat } = require('../service/chat.service');

class ChatController {
  async chat(req, res, next) {
    try {
      const { reply, durationMs } = await chat(req.body?.messages);
      res.status(200).json({ success: true, data: { reply, durationMs } });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ChatController();
