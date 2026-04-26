const express = require("express");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});

app.use("/stk", limiter);

const formatPhone = (phone) => {
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("0")) return "254" + phone.slice(1);
  if (phone.startsWith("7")) return "254" + phone;
  return phone;
};

app.post("/stk", async (req, res) => {
  try {
    const { phones, amount, reference, description } = req.body;

    const phoneList = phones.split(",").map(p => formatPhone(p.trim()));
    const results = [];

    for (const phone of phoneList) {
      try {
const response = await axios({
  method: "POST",
  url: "https://api.smartpaypesa.com/v1/initiatestk",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": process.env.API_KEY // 👈 remove Bearer
  },
  data: {
    phone,
    amount: Number(amount),
    account_reference: reference,
    description,
  }
});
        results.push({ phone, success: true, data: response.data });
      } catch (err) {
        results.push({
          phone,
          success: false,
          error: err.response?.data || err.message,
        });
      }
    }

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
