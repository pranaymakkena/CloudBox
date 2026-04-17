const fs = require("fs");
const path = require("path");

const packageDir = path.join(__dirname, "..", "node_modules", "docx-preview", "dist");

const files = [
  "docx-preview.js",
  "docx-preview.min.js",
  "docx-preview.mjs",
  "docx-preview.min.mjs",
];

const sourceMapPattern = /\n\/\/# sourceMappingURL=.*$/m;

for (const file of files) {
  const filePath = path.join(packageDir, file);

  if (!fs.existsSync(filePath)) {
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const updated = content.replace(sourceMapPattern, "");

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, "utf8");
  }
}

console.log("docx-preview source map references stripped");
