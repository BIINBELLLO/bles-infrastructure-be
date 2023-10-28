const express = require("express");
var cors = require("cors");
const app = express();
const axios = require("axios");
const PORT = 8000;
var usersRouter = require("./routes/user_routes");
const swStats = require("swagger-stats");
var swaggerUi = require("swagger-ui-express");
var swaggerDocument = require("./docs/swagger.json");

const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

app.use(swStats.getMiddleware({ swaggerSpec: swaggerDocument }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//connecting to db
var connection = require("./middlewares/connection")
  .then((db) => {
    if (db != undefined) {
      console.log("Connection Success");

      //initializing admin bro
      var adminBroRouter = require("./routes/admin_bro");
      //setting up admin bro
      app.use("/admin", adminBroRouter);
    } else {
      console.log("Connection Failed");
    }
  })
  .catch((err) => {
    console.log("connection failed due to " + err);
  });

async function query(data) {
  const response = await fetch(
    "https://quickipay-flowise-llm-engine.onrender.com/api/v1/prediction/700d6b0b-9d73-486f-82c8-7f4153b4b50c",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );
  const result = await response.json();
  return result;
}

bot.command("start", (ctx) => {
  console.log(ctx);
  bot.telegram.sendMessage(
    ctx.chat.id,
    "Hello there! Welcome to the CardHub Telegram bot.\nI can help you with any question about the CardHolder System, and also help you perform certain actions",
    {}
  );
});

bot.command("ethereum", (ctx) => {
  var rate;
  console.log(ctx.from);
  axios
    .get(
      `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`
    )
    .then((response) => {
      console.log(response.data);
      rate = response.data.ethereum;
      const message = `Hello, today the ethereum price is ${rate.usd}USD`;
      bot.telegram.sendMessage(ctx.chat.id, message, {});
    });
});

bot.on("text", (ctx) => {
  console.log(ctx.update.message.text);
  query({ question: ctx.update.message.text }).then((response) => {
    // console.log(response);
    ctx.reply(response);
  });
});

//setting up swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

console.log("Swagger running at port 8000 at /api-docs");
//setting up route for user related API's
app.use("/api/v1/users", usersRouter);

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});

bot.launch();

module.exports = app;
