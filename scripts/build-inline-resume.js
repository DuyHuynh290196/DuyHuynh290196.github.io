const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const indexPath = path.join(projectRoot, "index.html");

const inlineResumeConfigs = [
  {
    lang: "en",
    dataPath: path.join(projectRoot, "data", "resume.en.json"),
  },
];

const icons = {
  phone:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3c.5 0 .9.3 1 .7l.9 3.2c.1.4 0 .9-.3 1.2l-1.3 1.3a14.6 14.6 0 0 0 6.5 6.5l1.3-1.3c.3-.3.8-.4 1.2-.3l3.2.9c.4.1.7.5.7 1v3.5c0 .6-.5 1-1.1 1A17.6 17.6 0 0 1 3 5.1C3 4.5 3.4 4 4 4h2.6Z"></path></svg>',
  location:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 1 7 7c0 5.2-7 13-7 13S5 14.2 5 9a7 7 0 0 1 7-7Zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path></svg>',
  email:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2 8 5 8-5H4Zm16 10V9l-8 5-8-5v8h16Z"></path></svg>',
  download:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a1 1 0 0 1 1 1v8.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.4L11 12.6V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z"></path></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.9 8.3a1.7 1.7 0 1 1 0-3.3 1.7 1.7 0 0 1 0 3.3ZM5.4 9.6h3v9h-3v-9Zm4.9 0H13v1.2h.1c.4-.8 1.4-1.5 2.8-1.5 3 0 3.5 2 3.5 4.5v4.8h-3V14c0-1.1 0-2.4-1.5-2.4s-1.8 1.1-1.8 2.3v4.7h-3v-9Z"></path></svg>',
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function sanitizeUrl(value) {
  const normalizedValue = String(value ?? "").trim();

  if (/^(https?:\/\/|mailto:|tel:)/i.test(normalizedValue)) {
    return normalizedValue;
  }

  return "";
}

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

function renderBars(level) {
  return [
    '          <div class="bars" aria-hidden="true">',
    ...Array.from(
      { length: 5 },
      (_, index) => `            <span class="bar${index < level ? " fill" : ""}"></span>`
    ),
    "          </div>",
  ].join("\n");
}

function renderIcon(name) {
  return `<span class="icon">${icons[name] ?? ""}</span>`;
}

function renderGrid(items, indent = "            ") {
  return items
    .map(
      (item) =>
        `${indent}<div class="label">${escapeHtml(item.label)}</div>\n${indent}<div class="value">${escapeHtml(item.value)}</div>`
    )
    .join("\n");
}

function renderContactList(resume) {
  return resume.contact
    .map((item) => {
      const href = sanitizeUrl(item.href);
      const content = href
        ? `<a class="contact-link" href="${escapeHtml(href)}">${escapeHtml(item.text)}</a>`
        : `<span>${escapeHtml(item.text)}</span>`;

      return `              <li class="contact-item">${renderIcon(item.icon)}${content}</li>`;
    })
    .join("\n");
}

function renderSkillList(resume) {
  return resume.skills
    .map(
      (skill) =>
        [
          '            <div class="skill">',
          `              <div class="skill-name">${escapeHtml(skill.name)}</div>`,
          renderBars(skill.level),
          "            </div>",
        ].join("\n")
    )
    .join("\n");
}

function renderLanguageList(resume) {
  return resume.languages
    .map(
      (language) =>
        [
          '            <div class="language">',
          `              <div class="language-name">${escapeHtml(language.name)}</div>`,
          renderBars(language.level),
          "            </div>",
        ].join("\n")
    )
    .join("\n");
}

function renderSummary(resume) {
  return resume.summary
    .map((paragraph) => `            <p>${escapeHtml(paragraph)}</p>`)
    .join("\n");
}

function renderExperienceJobs(resume) {
  return resume.experience
    .map((job) => {
      const bullets = job.bullets
        .map((bullet) => `                <li>${escapeHtml(bullet)}</li>`)
        .join("\n");

      return [
        '            <div class="job">',
        `              <div class="job-title">${escapeHtml(job.title)}</div>`,
        `              <div class="job-dates">${escapeHtml(job.dates)}</div>`,
        `              <div class="job-type">${escapeHtml(job.type)}</div>`,
        '              <ul class="job-bullets">',
        bullets,
        "              </ul>",
        "            </div>",
      ].join("\n");
    })
    .join("\n");
}

function renderCertificates(resume) {
  return resume.certificates
    .map(
      (certificate) =>
        [
          '            <div class="certificate-item">',
          `              <div class="certificate">${escapeHtml(certificate.title)}</div>`,
          `              <div class="certificate-meta">${escapeHtml(certificate.source)}</div>`,
          `              <div class="certificate-meta">${escapeHtml(certificate.period)}</div>`,
          "            </div>",
        ].join("\n")
    )
    .join("\n");
}

function renderSocialLinks(resume) {
  return resume.socialLinks
    .map((item) => {
      const href = sanitizeUrl(item.href);

      if (href) {
        return [
          `              <a class="social-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">`,
          `                ${renderIcon(item.icon)}`,
          `                <span>${escapeHtml(item.label)}</span>`,
          "              </a>",
        ].join("\n");
      }

      return [
        '              <span class="social-link social-link--placeholder">',
        `                ${renderIcon(item.icon)}`,
        `                <span>${escapeHtml(item.label)}</span>`,
        "              </span>",
      ].join("\n");
    })
    .join("\n");
}

function renderContactCta(icon, label, href) {
  if (!href) {
    return [
      '              <span class="cta-button cta-button--disabled" aria-disabled="true">',
      `                ${renderIcon(icon)}`,
      `                <span>${escapeHtml(label)}</span>`,
      "              </span>",
    ].join("\n");
  }

  return [
    `              <a class="cta-button" href="${escapeHtml(href)}">`,
    `                ${renderIcon(icon)}`,
    `                <span>${escapeHtml(label)}</span>`,
    "              </a>",
  ].join("\n");
}

function renderCtas(resume) {
  const email = resume.contact.find((item) => item.icon === "email");
  const phone = resume.contact.find((item) => item.icon === "phone");

  return [
    '            <button type="button" class="cta-button" id="downloadButton">',
    `              <span class="cta-icon">${renderIcon("download")}</span>`,
    '              <span class="cta-loader" aria-hidden="true"></span>',
    `              <span>${escapeHtml(resume.cta.download)}</span>`,
    "            </button>",
    renderContactCta("email", resume.cta.email, sanitizeUrl(email?.href)),
    renderContactCta("phone", resume.cta.call, sanitizeUrl(phone?.href)),
  ].join("\n");
}

function renderMainPage(resume) {
  const hasPlaceholder = resume.socialLinks.some((item) => !sanitizeUrl(item.href));

  return [
    '      <main class="page">',
    '        <aside class="sidebar">',
    '          <section class="profile">',
    '            <div class="avatar" aria-label="Profile photo">',
    '              <img',
    '                src="assets/avatar.jpg"',
    `                alt="${escapeHtml(resume.name)}"`,
    '                width="256"',
    '                height="256"',
    '              />',
    '            </div>',
    '            <div class="name-card">',
    `              <h1 class="name">${escapeHtml(resume.name)}</h1>`,
    `              <div class="role" id="roleText">${escapeHtml(resume.role)}</div>`,
    "            </div>",
    "          </section>",
    "",
    '          <section class="section section--cta">',
    `            <div class="cta-row cta-row--sidebar" id="ctaRow">\n${renderCtas(resume)}\n            </div>`,
    "          </section>",
    "",
    '          <section class="section section--contact">',
    `            <h2 class="section-title" id="contactTitle">${escapeHtml(resume.sections.contact)}</h2>`,
    `            <ul class="contact-list" id="contactList">\n${renderContactList(resume)}\n            </ul>`,
    "          </section>",
    "",
    '          <section class="section section--personal">',
    `            <h2 class="section-title" id="personalTitle">${escapeHtml(resume.sections.personal)}</h2>`,
    `            <div class="profile-grid" id="personalProfile">\n${renderGrid(resume.personalProfile)}\n            </div>`,
    "          </section>",
    "",
    '          <section class="section section--skills">',
    `            <h2 class="section-title" id="skillsTitle">${escapeHtml(resume.sections.skills)}</h2>`,
    `            <div id="skillList">\n${renderSkillList(resume)}\n            </div>`,
    "          </section>",
    "",
    '          <section class="section section--languages">',
    `            <h2 class="section-title" id="languagesTitle">${escapeHtml(resume.sections.languages)}</h2>`,
    `            <div id="languageList">\n${renderLanguageList(resume)}\n            </div>`,
    "          </section>",
    "",
    '          <section class="section section--desired">',
    `            <h2 class="section-title" id="desiredJobTitle">${escapeHtml(resume.sections.desiredJob)}</h2>`,
    `            <div class="desired-job-grid" id="desiredJobList">\n${renderGrid(resume.desiredJob)}\n            </div>`,
    "          </section>",
    "",
    '          <section class="section section--social">',
    `            <h2 class="section-title" id="socialTitle">${escapeHtml(resume.sections.social)}</h2>`,
    `            <div class="social-links" id="socialLinks">\n${renderSocialLinks(resume)}\n            </div>`,
    `            <p class="social-note" id="socialNote">${hasPlaceholder ? escapeHtml(resume.socialNote) : ""}</p>`,
    "          </section>",
    "        </aside>",
    "",
    '        <section class="main">',
    `          <div class="summary" id="summary">\n${renderSummary(resume)}\n          </div>`,
    "",
    '          <section class="section">',
    `            <h2 class="section-title-main" id="experienceTitle">${escapeHtml(resume.sections.experience)}</h2>`,
    `            <div class="kv-grid" id="experienceMeta">\n${renderGrid(resume.experienceMeta)}\n            </div>`,
    `            <div id="experienceJobs">\n${renderExperienceJobs(resume)}\n            </div>`,
    "          </section>",
    "",
    '          <section class="section">',
    `            <h2 class="section-title-main" id="educationTitle">${escapeHtml(resume.sections.education)}</h2>`,
    `            <div class="kv-grid" id="educationMeta">\n${renderGrid(resume.educationMeta)}\n            </div>`,
    `            <div class="edu-school" id="educationSchool">${escapeHtml(resume.educationSchool)}</div>`,
    `            <div class="kv-grid" id="educationDetails">\n${renderGrid(resume.educationDetails)}\n            </div>`,
    "          </section>",
    "",
    '          <section class="section">',
    `            <h2 class="section-title-main" id="certificatesTitle">${escapeHtml(resume.sections.certificates)}</h2>`,
    `            <div class="certificate-list" id="certificateList">\n${renderCertificates(resume)}\n            </div>`,
    "          </section>",
    "        </section>",
    "      </main>",
  ].join("\n");
}

function replaceMainBlock(html, resume) {
  const pattern = /      <main class="page">[\s\S]*?      <\/main>/;

  if (!pattern.test(html)) {
    throw new Error("Could not find main page block in index.html");
  }

  return html.replace(pattern, renderMainPage(resume));
}

function replaceInlineResumeBlock(html, { lang, resume }) {
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

    if (lang === "en") {
      html = replaceMainBlock(html, resume);
    }

    html = replaceInlineResumeBlock(html, { lang, resume });
  });

  fs.writeFileSync(indexPath, html);
  console.log("Updated prerendered resume HTML and inline data in index.html");
}

run();
