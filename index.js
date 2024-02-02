// app.js
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mongoose = require("mongoose");

const app = express();
const port = 3000;

// Set up MongoDB connection
mongoose.connect("mongodb://localhost:27017/resumeApp");

// Create a Resume model
const Resume = mongoose.model("Resume", {
  name: String,
  email: String,
  phone: String,
  content: String,
});

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const buffer = req.file.buffer;
    const data = await pdfParse(buffer);
    const resumeData = {
      name: extractName(data.text),
      email: extractEmail(data.text),
      phone: extractPhone(data.text),
      content: data.text,
    };

    // Save the extracted data to MongoDB
    const savedResume = await new Resume(resumeData).save();

    res.json({ success: true, resume: savedResume });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function extractName(text) {
  const nameRegex = /([a-zA-Z]+[a-zA-Z\s]+)/;
  const match = text.match(nameRegex);
  return match ? match[0] : "";
}

function extractEmail(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : "";
}

function extractPhone(text) {
  const phoneRegex = /(\+\d{1,2}\s?)?(\d{10,})/;
  const match = text.match(phoneRegex);
  return match ? match[0] : "";
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
