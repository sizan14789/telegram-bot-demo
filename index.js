import "dotenv/config";
import { session, Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import fs from "fs";

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(
  session({
    defaultSession: () => ({}),
  })
);

let users = [];

try {
  users = JSON.parse(fs.readFileSync("./user.json"));
} catch (error) {
  console.log("error");
}

const saveToFile = (object) => {
  users.push(object);
  fs.writeFileSync("user.json", JSON.stringify(users));
};

bot.start((ctx) => {
  ctx.session.state = "awaiting_name";
  ctx.reply(`Hello there, what's your name?`);
});

bot.help((ctx) => {
  ctx.reply(
    `This is a demo bot created for learning purposes. Available commands are /start, /menu, /help`
  );
});

bot.command("play", (ctx) => {
  ctx.reply("Choose an option", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Even", callback_data: "even" }],
        [{ text: "Odd", callback_data: "odd" }],
      ],
    },
  });
});

// bot.command("play", (ctx) => {
//   ctx.reply("Choose an option", {
//     reply_markup: {
//       keyboard: [[{ text: "Even" }, { text: "Odd" }]],
//       one_time_keyboard: true,
//       resize_keyboard: true,
//     },
//   });
// });

bot.on("callback_query", async (ctx) => {
  const user_choice = ctx.callbackQuery.data;

  if (user_choice === "disabled") {
    await ctx.answerCbQuery();
    return;
  }

  const random_number = Math.floor(Math.random() * 100);
  const isEven = random_number % 2 === 0 ? "even" : "odd";

  await ctx.answerCbQuery();
  // await ctx.editMessageText(`You choose ${user_choice}`);
  await ctx.editMessageReplyMarkup({
    inline_keyboard: [
      [
        {
          text: "Even" + (isEven === "even" ? " ✅" : " ❌"),
          callback_data: "disabled",
        },
      ],
      [
        {
          text: "Odd" + (isEven === "even" ? " ❌" : " ✅"),
          callback_data: "disabled",
        },
      ],
    ],
  });

  return ctx.reply(
    `The random number was ${random_number}, which is ${isEven}. Your guess was ${
      isEven === user_choice ? "correct" : "incorrect"
    }`
  );
});

bot.on(message("text"), (ctx) => {
  const state = ctx.session.state;
  const userReply = ctx.message.text;

  if (state === "awaiting_name") {
    //check if <name></name> can be taken. true for demo

    // code to save the name temporarily
    ctx.session.name = userReply;

    ctx.session.state = "awaiting_email";
    return ctx.reply(`Thanks ${userReply}. What's your email?`);
  }

  if (state === "awaiting_email") {
    //check if email can be taken. true for demo

    // code to save the name and email
    saveToFile({ name: ctx.session.name, email: userReply });

    ctx.session.state = null;
    return ctx.reply(
      `Thanks for providing your email. Your name and email are saved`
    );
  }

  return ctx.reply(
    `Hello ${
      ctx.session.name || ctx.from.first_name || "there"
    }. You said ${userReply}`
  );
});

// doesn't support
bot.on(message("photo"), (ctx) => ctx.reply("Sorry, I only support texts"));
bot.on(message("video"), (ctx) => ctx.reply("Sorry, I only support texts"));
bot.on(message("document"), (ctx) => ctx.reply("Sorry, I only support texts"));
bot.on(message("sticker"), (ctx) => ctx.reply("Sorry, I only support texts"));

await bot.telegram.setMyCommands([
  { command: "start", description: "Starts the bot" },
  { command: "play", description: "Starts odd even guess game" },
  { command: "help", description: "To know details" },
]);

// catch and launch
bot.catch((err) => console.error("Bot error:", err));
bot.launch({ polling: true });

