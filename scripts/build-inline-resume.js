const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const indexPath = path.join(projectRoot, "index.html");

const inlineResumeConfigs = [
  {
    lang: "en",
    dataPath: path.join(projectRoot, "data", "resume.en.json"),
  },
  {
    lang: "vi",
    dataPath: path.join(projectRoot, "data", "resume.vn.json"),
  },
];

function formatJsonForHtml(value) {
  return JSON.stringify(value, null, 2).replace(/<\/script/gi, "<\\/script");
}

function buildInlineScriptTag({ lang, resume }) {
  const normalizedLang = String(lang ?? "").toLowerCase();
  const scriptId = `initialResumeData${normalizedLang.charAt(0).toUpperCase()}${normalizedLang.slice(1)}`;
  const formattedJson = formatJsonForHtml(resume)
    .split("\n")
    .map((line) => `      ${line}`)
    .join("\n");

  return [
    `    <script type="application/json" id="${scriptId}">`,
    formattedJson,
    "    </script>",
  ].join("\n");
}

function replaceBlock(html, { lang, resume }) {
  const startMarker = `<!-- resume:${lang}:start -->`;
  const endMarker = `<!-- resume:${lang}:end -->`;
  const pattern = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`);

  if (!pattern.test(html)) {
    throw new Error(`Could not find inline resume block for language: ${lang}`);
  }

  return html.replace(
    pattern,
    `${startMarker}\n${buildInlineScriptTag({ lang, resume })}\n    ${endMarker}`
  );
}

function run() {
  let html = fs.readFileSync(indexPath, "utf8");

  inlineResumeConfigs.forEach(({ lang, dataPath }) => {
    const resume = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    html = replaceBlock(html, { lang, resume });
  });

  fs.writeFileSync(indexPath, html);
  console.log("Updated inline resume data in index.html");
}

run();
