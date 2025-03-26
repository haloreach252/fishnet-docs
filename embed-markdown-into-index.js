const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const README_PATH = path.join(__dirname, 'CombinedDocs.md');
const OUTPUT_PATH = path.join(__dirname, 'index_test.html');

const markdown = fs.readFileSync(README_PATH, 'utf8');
const htmlContent = marked(markdown);

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>FishNet Docs</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 2rem;
      max-width: 900px;
      margin: auto;
      line-height: 1.6;
    }
    pre {
      background: #f4f4f4;
      padding: 1rem;
      overflow-x: auto;
    }
    code {
      font-family: Consolas, monospace;
    }
    h1, h2, h3 {
      margin-top: 2rem;
    }
    hr {
      margin: 3rem 0;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>
`;

fs.writeFileSync(OUTPUT_PATH, htmlTemplate, 'utf8');
console.log('✅ Markdown successfully embedded into index.html');
