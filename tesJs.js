const express = require("express");
const multer = require("multer");
const tesseract = require("node-tesseract-ocr");
const { createObjectCsvWriter } = require("csv-writer");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 7000;
const uploadFolder = "uploads";
const allowedExtensions = new Set(["png", "jpg", "jpeg", "bmp"]);

const upload = multer({ dest: uploadFolder });

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

// Ensure upload folder exists
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const allowedFile = (filename) => {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return allowedExtensions.has(ext);
};

const saveWordsToCSV = async (words, csvFilePath) => {
  const csvWriter = createObjectCsvWriter({
    path: csvFilePath,
    header: [{ id: "word", title: "Words" }],
  });
  const records = words.map((word) => ({ word }));
  await csvWriter.writeRecords(records);
};

const extractTextAndSave = async (imagePath, csvFilePath) => {
  try {
    const config = {
      lang: "eng",
      oem: 1,
      psm: 3,
    };
    const text = await tesseract.recognize(imagePath, config);
    const words = text.split(/\s+/);
    await saveWordsToCSV(words, csvFilePath);
    return {
      success: true,
      message: `Extracted text has been saved to ${csvFilePath}.`,
      csvFilePath,
    };
  } catch (error) {
    return {
      success: false,
      message: `An error occurred: ${error}`,
      csvFilePath: null,
    };
  }
};

app.get("/", (req, res) => {
  console.log("hellooo");
  // res.send("HEllllooo");
  res.render("index2");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file || !allowedFile(req.file.originalname)) {
    return res.redirect("/");
  }
  const filename = req.file.filename;
  const filePath = path.join(uploadFolder, filename);
  res.redirect(`/extract/${filename}`);
});

app.get("/extract/:filename", async (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(uploadFolder, filename);
  const csvFilename = path.basename(filename, path.extname(filename)) + ".csv";
  console.log(csvFilename);
  const csvFilePath = path.join(uploadFolder, csvFilename);
  const result = await extractTextAndSave(imagePath, csvFilePath);

  console.log(result);
  if (result.success) {
    res.render("success", { message: result.message, csvFile: csvFilePath });
  } else {
    res.render("error", { message: result.message });
  }
});

app.get("/download/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  console.log(filename);
  const filePath = path.join(uploadFolder, filename);
  console.log(filename);
  res.download(filePath);
});

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
