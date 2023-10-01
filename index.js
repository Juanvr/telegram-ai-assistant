require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const { message } = require('telegraf/filters');
const OpenAI = require('openai');

const numberOfPreviousMessagesToUse = 10; // Number of previous messages to use to generate the next message

// Default to port 3000 if PORT is not set
const port = Number(process.env.PORT) || 3000;

// Assert and refuse to start bot if token or webhookDomain is not passed
if (!process.env.BOT_TOKEN) {
  throw new Error('"BOT_TOKEN" env var is required!');
}
if (!process.env.WEBHOOK_DOMAIN) {
  throw new Error('"WEBHOOK_DOMAIN" env var is required!');
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error('"OPENAI_API_KEY" env var is required!');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());

bot.start((ctx) => ctx.reply('Welcome'));

let chatHistory = [];

bot.on('message', async (ctx) => {
  // Add the current message to the chat history
  chatHistory.push({ role: 'user', content: ctx.message.text });

  // Get the last X messages from the chat history
  const lastMessages = chatHistory.slice(-numberOfPreviousMessagesToUse);

  // Generate a response using the GPT model and the last X messages
  const chatCompletion = await openai.chat.completions.create({
    messages: lastMessages,
    model: 'gpt-3.5-turbo',
  });

  const responseMessage = chatCompletion.choices[0].message;

  // Add the model's response to the chat history
  chatHistory.push(responseMessage);

  // Send the response back to the chat group
  ctx.reply(responseMessage.content);
});


bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));