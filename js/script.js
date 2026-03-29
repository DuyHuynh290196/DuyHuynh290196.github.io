const resumeFiles = {
  en: "data/resume.en.json",
  vi: "data/resume.vn.json",
};

const icons = {
  phone:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3c.5 0 .9.3 1 .7l.9 3.2c.1.4 0 .9-.3 1.2l-1.3 1.3a14.6 14.6 0 0 0 6.5 6.5l1.3-1.3c.3-.3.8-.4 1.2-.3l3.2.9c.4.1.7.5.7 1v3.5c0 .6-.5 1-1.1 1A17.6 17.6 0 0 1 3 5.1C3 4.5 3.4 4 4 4h2.6Z"></path></svg>',
  location:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 1 7 7c0 5.2-7 13-7 13S5 14.2 5 9a7 7 0 0 1 7-7Zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path></svg>',
  email:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2 8 5 8-5H4Zm16 10V9l-8 5-8-5v8h16Z"></path></svg>',
  download:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a1 1 0 0 1 1 1v8.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.4L11 12.6V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z"></path></svg>',
  github:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.9 9.6.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.6-1.1-1.6-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.5 2.4 1.1 3 .8.1-.6.4-1.1.7-1.4-2.2-.2-4.6-1.1-4.6-5 0-1.1.4-2 1-2.8-.1-.2-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 .8-.2 1.7-.3 2.5-.3.9 0 1.7.1 2.5.3 1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.5.1 2.7.7.8 1 1.8 1 2.8 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4-1.3 6.9-5.1 6.9-9.6C22 6.6 17.5 2 12 2Z"></path></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.9 8.3a1.7 1.7 0 1 1 0-3.3 1.7 1.7 0 0 1 0 3.3ZM5.4 9.6h3v9h-3v-9Zm4.9 0H13v1.2h.1c.4-.8 1.4-1.5 2.8-1.5 3 0 3.5 2 3.5 4.5v4.8h-3V14c0-1.1 0-2.4-1.5-2.4s-1.8 1.1-1.8 2.3v4.7h-3v-9Z"></path></svg>',
};

const state = {
  lang: "en",
  resumes: {},
};

function getInitialResume(lang) {
  const normalizedLang = String(lang ?? "").toLowerCase();
  const elementId = `initialResumeData${normalizedLang.charAt(0).toUpperCase()}${normalizedLang.slice(1)}`;
  const element = document.getElementById(elementId);

  if (!element?.textContent.trim()) {
    return null;
  }

  try {
    return JSON.parse(element.textContent);
  } catch (error) {
    console.error(`Failed to parse initial ${lang} resume data`, error);
    return null;
  }
}

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

function setText(id, text) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
}

function getResume() {
  return state.resumes[state.lang] ?? state.resumes.en ?? Object.values(state.resumes)[0];
}

function renderBars(level) {
  return `
    <div class="bars" aria-hidden="true">
      ${Array.from(
        { length: 5 },
        (_, index) => `<span class="bar${index < level ? " fill" : ""}"></span>`
      ).join("")}
    </div>
  `;
}

function renderIcon(name) {
  return `<span class="icon">${icons[name] ?? ""}</span>`;
}

function renderGrid(container, items) {
  container.innerHTML = items
    .map(
      (item) => `
        <div class="label">${escapeHtml(item.label)}</div>
        <div class="value">${escapeHtml(item.value)}</div>
      `
    )
    .join("");
}

function renderContactList(resume) {
  const contactList = document.getElementById("contactList");

  contactList.innerHTML = resume.contact
    .map((item) => {
      const href = sanitizeUrl(item.href);
      const content = href
        ? `<a class="contact-link" href="${escapeHtml(href)}">${escapeHtml(item.text)}</a>`
        : `<span>${escapeHtml(item.text)}</span>`;

      return `<li class="contact-item">${renderIcon(item.icon)}${content}</li>`;
    })
    .join("");
}

function renderSkillList(resume) {
  const skillList = document.getElementById("skillList");

  skillList.innerHTML = resume.skills
    .map(
      (skill) => `
        <div class="skill">
          <div class="skill-name">${escapeHtml(skill.name)}</div>
          ${renderBars(skill.level)}
        </div>
      `
    )
    .join("");
}

function renderLanguageList(resume) {
  const languageList = document.getElementById("languageList");

  languageList.innerHTML = resume.languages
    .map(
      (language) => `
        <div class="language">
          <div class="language-name">${escapeHtml(language.name)}</div>
          ${renderBars(language.level)}
        </div>
      `
    )
    .join("");
}

function renderSummary(resume) {
  const summary = document.getElementById("summary");

  summary.innerHTML = resume.summary
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function renderExperienceJobs(resume) {
  const jobs = document.getElementById("experienceJobs");

  jobs.innerHTML = resume.experience
    .map(
      (job) => `
        <div class="job">
          <div class="job-title">${escapeHtml(job.title)}</div>
          <div class="job-dates">${escapeHtml(job.dates)}</div>
          <div class="job-type">${escapeHtml(job.type)}</div>
          <ul class="job-bullets">
            ${job.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
          </ul>
        </div>
      `
    )
    .join("");
}

function renderCertificates(resume) {
  const certificateList = document.getElementById("certificateList");

  certificateList.innerHTML = resume.certificates
    .map(
      (certificate) => `
        <div class="certificate-item">
          <div class="certificate">${escapeHtml(certificate.title)}</div>
          <div class="certificate-meta">${escapeHtml(certificate.source)}</div>
          <div class="certificate-meta">${escapeHtml(certificate.period)}</div>
        </div>
      `
    )
    .join("");
}

function renderSocialLinks(resume) {
  const socialLinks = document.getElementById("socialLinks");
  const socialNote = document.getElementById("socialNote");
  const hasPlaceholder = resume.socialLinks.some((item) => !sanitizeUrl(item.href));

  socialLinks.innerHTML = resume.socialLinks
    .map((item) => {
      const href = sanitizeUrl(item.href);

      if (href) {
        return `
          <a class="social-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
            ${renderIcon(item.icon)}
            <span>${escapeHtml(item.label)}</span>
          </a>
        `;
      }

      return `
        <span class="social-link social-link--placeholder">
          ${renderIcon(item.icon)}
          <span>${escapeHtml(item.label)}</span>
        </span>
      `;
    })
    .join("");

  socialNote.textContent = hasPlaceholder ? resume.socialNote : "";
}

function renderCtas(resume) {
  const ctaRow = document.getElementById("ctaRow");
  const email = resume.contact.find((item) => item.icon === "email");
  const phone = resume.contact.find((item) => item.icon === "phone");
  const emailHref = sanitizeUrl(email?.href);
  const phoneHref = sanitizeUrl(phone?.href);
  const renderContactCta = (icon, label, href) => {
    if (!href) {
      return `
        <span class="cta-button cta-button--disabled" aria-disabled="true">
          ${renderIcon(icon)}
          <span>${escapeHtml(label)}</span>
        </span>
      `;
    }

    return `
      <a class="cta-button" href="${escapeHtml(href)}">
        ${renderIcon(icon)}
        <span>${escapeHtml(label)}</span>
      </a>
    `;
  };

  ctaRow.innerHTML = `
    <button type="button" class="cta-button" id="downloadButton">
      <span class="cta-icon">${renderIcon("download")}</span>
      <span class="cta-loader" aria-hidden="true"></span>
      <span>${escapeHtml(resume.cta.download)}</span>
    </button>
    ${renderContactCta("email", resume.cta.email, emailHref)}
    ${renderContactCta("phone", resume.cta.call, phoneHref)}
  `;

  document.getElementById("downloadButton").addEventListener("click", async (event) => {
    const button = event.currentTarget;

    if (button.disabled) {
      return;
    }

    button.disabled = true;
    button.classList.add("is-loading");

    try {
      await window.ResumePrint.exportResumePdf({
        resume,
        lang: state.lang,
      });
    } finally {
      button.disabled = false;
      button.classList.remove("is-loading");
    }
  });
}

function renderStaticText(resume) {
  setText("availabilityText", resume.availability);
  setText("heroTitle", resume.heroTitle);
  setText("roleText", resume.role);
  setText("contactTitle", resume.sections.contact);
  setText("personalTitle", resume.sections.personal);
  setText("skillsTitle", resume.sections.skills);
  setText("languagesTitle", resume.sections.languages);
  setText("desiredJobTitle", resume.sections.desiredJob);
  setText("socialTitle", resume.sections.social);
  setText("experienceTitle", resume.sections.experience);
  setText("educationTitle", resume.sections.education);
  setText("certificatesTitle", resume.sections.certificates);
}

function updateLanguageButtons() {
  document.querySelectorAll(".language-button").forEach((button) => {
    const isActive = button.dataset.lang === state.lang;
    const isAvailable = Boolean(state.resumes[button.dataset.lang]);

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.disabled = !isAvailable;
    button.setAttribute("aria-disabled", String(!isAvailable));
  });
}

function renderPage() {
  const resume = getResume();

  if (!resume) {
    return;
  }

  document.documentElement.lang = state.lang === "vi" ? "vi" : "en";
  document.title = `${resume.name} | ${resume.role}`;

  renderStaticText(resume);
  renderCtas(resume);
  renderContactList(resume);
  renderGrid(document.getElementById("personalProfile"), resume.personalProfile);
  renderSkillList(resume);
  renderLanguageList(resume);
  renderGrid(document.getElementById("desiredJobList"), resume.desiredJob);
  renderSocialLinks(resume);
  renderSummary(resume);
  renderGrid(document.getElementById("experienceMeta"), resume.experienceMeta);
  renderExperienceJobs(resume);
  renderGrid(document.getElementById("educationMeta"), resume.educationMeta);
  document.getElementById("educationSchool").textContent = resume.educationSchool;
  renderGrid(document.getElementById("educationDetails"), resume.educationDetails);
  renderCertificates(resume);
  updateLanguageButtons();
}

function renderLoadError() {
  document.documentElement.lang = "en";
  document.title = "Resume data failed to load";
  setText("availabilityText", "Resume data could not be loaded");
  setText("heroTitle", "Open this project through a local server to load JSON content.");
  document.getElementById("summary").innerHTML =
    "<p>JSON files are blocked in many browsers when the page is opened with file://. Run a small local server and open the page from http://localhost instead.</p>";
  document.getElementById("ctaRow").innerHTML = "";
}

async function loadResumeFile(lang, path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  return [lang, await response.json()];
}

async function loadResumeFiles() {
  const missingEntries = Object.entries(resumeFiles).filter(([lang]) => !state.resumes[lang]);

  if (!missingEntries.length) {
    return;
  }

  const results = await Promise.allSettled(
    missingEntries.map(([lang, path]) => loadResumeFile(lang, path))
  );

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      const [lang, resume] = result.value;

      state.resumes[lang] = resume;
      return;
    }

    console.error(result.reason);
  });

  if (!Object.keys(state.resumes).length) {
    throw new Error("No resume data could be loaded");
  }

  if (!state.resumes[state.lang]) {
    state.lang = Object.keys(state.resumes)[0];
  }
}

function setLanguage(lang) {
  if (!state.resumes[lang]) {
    return;
  }

  state.lang = lang;
  renderPage();
}

async function init() {
  const initialEnResume = getInitialResume("en");

  if (initialEnResume) {
    state.resumes.en = initialEnResume;
    renderPage();
  } else {
    updateLanguageButtons();
  }

  document.querySelectorAll(".language-button").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.lang !== state.lang) {
        setLanguage(button.dataset.lang);
      }
    });
  });

  try {
    await loadResumeFiles();

    if (!initialEnResume || !state.resumes.en) {
      renderPage();
    } else {
      updateLanguageButtons();
    }
  } catch (error) {
    console.error(error);
    renderLoadError();
  }
}

init();
