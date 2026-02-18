import * as sdb from "https://cdn.jsdelivr.net/gh/cjeffreybda/sheets-db@v0.0.2/sheets-db.js";

let documents = {
  main: "1NtEgXCUK2l95tw04zyHkHejwEGppVbJ53KAWKHhk06E",
};

let sheets = {
  projects: {
    name: "Projects",
    document: "main",
    fields: ["title", "date", "type", "at", "body", "image", "show"],
  },
  gallery: {
    name: "Gallery",
    document: "main",
    fields: ["image", "caption", "show"],
  },
  injections: {
    name: "Injections",
    document: "main",
    fields: ["selector", "attribute", "value", "type", "apply"],
  },
  portfolio: {
    name: "Portfolio",
    document: "main",
    fields: ["name", "download", "image", "show"],
  },
};

sdb.setReferences(documents, sheets);

async function init() {
  let currentPage =
    localStorage.currentPage != null ? localStorage.currentPage : "about";
  changePage(currentPage);

  sdb.fetchSheet("injections", makeInjections);
  sdb.fetchSheet("portfolio", makePortfolio);
  sdb.fetchSheet("projects", makeProjects);
  sdb.fetchSheet("gallery", makeGallery);
}
window.addEventListener("DOMContentLoaded", init);

// CHANGE PAGES

function changePage(target) {
  document.querySelectorAll(".content").forEach((el) => {
    el.classList.add("hidden");
  });

  let obj = document.getElementById(target + "-content");
  document.querySelectorAll(".nav").forEach((el) => {
    el.classList.remove("selected");
    if (el.getAttribute("href") == target) {
      el.classList.add("selected");
    }
  });
  localStorage.currentPage = target;

  window.setTimeout(function () {
    obj.setAttribute("style", "display: flex;");
  }, 500);

  window.setTimeout(function () {
    document.querySelectorAll(".content").forEach((el) => {
      if (el.getAttribute("id") != target + "-content") {
        el.setAttribute("style", "display: none;");
      }
    });
    obj.classList.remove("hidden");
  }, 525);
}
document.querySelectorAll(".nav").forEach((el) => {
  el.addEventListener("click", (event) => changePage(el.getAttribute("href")));
});

// PROJECTS

function makeProjects() {
  let projectMap = new Map();

  for (let i = 0; i < sdb.numRecords("projects"); i++) {
    if (
      sdb.anyCellNull("projects", i, ["title", "date"]) ||
      sdb.getCell("projects", i, "show") == false
    ) {
      continue;
    }
    let utc = sdb.dateToUTC(sdb.getCell("projects", i, "date"));
    projectMap.set(utc, i);
  }

  let projectDates = Array.from(projectMap.keys()).sort().reverse();
  let projIdxSorted = [];
  for (let i = 0; i < projectDates.length; i++) {
    projIdxSorted.push(projectMap.get(projectDates[i]));
  }

  let filters = new Set();
  let html = "";

  for (let i = 0; i < projIdxSorted.length; i++) {
    let type = "";
    if (sdb.getCell("projects", projIdxSorted[i], "type") != null) {
      let types = sdb
        .getCell("projects", projIdxSorted[i], "type")
        .replace(", ", " ");
      types.split(" ").forEach((el) => {
        filters.add(el);
      });
      type = types.toLowerCase();
    }

    html += `<li class="${type}"><div><h2>${sdb.getCell("projects", projIdxSorted[i], "title")}</h2>`;
    if (sdb.getCell("projects", projIdxSorted[i], "at") != null) {
      html += `<div class="location">${sdb.getCell("projects", projIdxSorted[i], "at")}</div>`;
    }
    if (sdb.getCell("projects", projIdxSorted[i], "date") != null) {
      let date = sdb.getCell("projects", projIdxSorted[i], "date");
      html += `<div class="date">${sdb.dateToString(date, ["Mmmm", "d", "yyyy"])}</div>`;
    }
    if (sdb.getCell("projects", projIdxSorted[i], "body") != null) {
      html += sdb.textToParagraph(
        sdb.getCell("projects", projIdxSorted[i], "body"),
      );
    }
    html += "</div>";

    if (sdb.getCell("projects", projIdxSorted[i], "image") != null) {
      let imgSrc = sdb.driveUrlToThumb(
        sdb.getCell("projects", projIdxSorted[i], "image"),
      );
      html += `<figure><img src="${imgSrc}"></figure>`;
    }
    html += "</li>";
  }

  document.getElementById("projects").innerHTML = html;

  filters = Array.from(filters).sort();
  let filtersHTML =
    '<li><button id="filter-all" class="filter selected">All</button></li>';
  filters.forEach((el) => {
    filtersHTML += `<li><button id="filter-${el.toLowerCase()}" class="filter">${el}</button></li>`;
  });

  document.getElementById("project-filters").innerHTML = filtersHTML;
  document.querySelectorAll("button.filter").forEach((el) => {
    el.addEventListener("click", (event) => {
      filterProjects(el.getAttribute("id").substring(7));
    });
  });
}

function filterProjects(type) {
  let allProjects = document.querySelectorAll("#projects > li");

  allProjects.forEach((el) => {
    el.style.display = "none";
    if (type == "all" || el.classList.contains(type) == true) {
      el.style.display = "flex";
    }
  });

  let allFilters = document.querySelectorAll("#project-filters button.filter");

  allFilters.forEach((el) => {
    el.classList.remove("selected");
    if (el.getAttribute("id").substring(7) == type) {
      el.classList.add("selected");
    }
  });
}

// GALLERY

function makeGallery() {
  let html = "";

  for (let i = 0; i < sdb.numRecords("gallery"); i++) {
    if (
      sdb.getCell("gallery", i, "image") == null ||
      sdb.getCell("gallery", i, "show") == false
    ) {
      continue;
    }

    let imgSrc = sdb.driveUrlToThumb(sdb.getCell("gallery", i, "image"));

    html += `<li><figure><img src="${imgSrc}"></figure></li>`;
  }

  document.querySelector("#gallery-content .gallery").innerHTML = html;
}

function makePortfolio() {
  let html = "";
  for (let i = 0; i < sdb.numRecords("portfolio"); i++) {
    if (
      sdb.anyCellNull("portfolio", i, ["name", "download"]) ||
      sdb.getCell("portfolio", i, "show") == false
    ) {
      continue;
    }

    let imgSrc;
    if (sdb.getCell("portfolio", i, "image") != null) {
      imgSrc = sdb.driveUrlToThumb(sdb.getCell("portfolio", i, "image"));
    } else {
      imgSrc = sdb.driveUrlToThumb(sdb.getCell("portfolio", i, "download"));
    }

    html += `<li class="document"><figure><img src="${imgSrc}"></figure><div><h2>${sdb.getCell("portfolio", i, "name")}</h2><a download="${sdb.getCell("portfolio", i, "name")} - Sam Webel" href="${sdb.driveUrlToDownload(sdb.getCell("portfolio", i, "download"))}">Download</a></div></li>`;
  }

  document.querySelector("#portfolio-documents").innerHTML = html;
}

// INJECTIONS

function makeInjections() {
  for (let i = 0; i < sdb.numRecords("injections"); i++) {
    if (
      sdb.anyCellNull("injections", i, [
        "selector",
        "attribute",
        "value",
        "type",
      ]) ||
      sdb.getCell("injections", i, "apply") == false
    ) {
      continue;
    }

    let value = sdb.getCell("injections", i, "value");

    switch (sdb.getCell("injections", i, "type")) {
      case "Paragraphs":
        value = sdb.textToParagraph(sdb.getCell("injections", i, "value"));
        break;
      case "Image":
        value = sdb.driveUrlToThumb(sdb.getCell("injections", i, "value"));
        break;
      case "Download":
        value = sdb.driveUrlToDownload(sdb.getCell("injections", i, "value"));
        break;
      default:
        break;
    }

    let elements = document.querySelectorAll(
      sdb.getCell("injections", i, "selector"),
    );

    if (sdb.getCell("injections", i, "attribute") == "innerHTML") {
      elements.forEach((el) => {
        el.innerHTML = value;
      });
    } else {
      elements.forEach((el) => {
        el.setAttribute(sdb.getCell("injections", i, "attribute"), value);
      });
    }
  }
}
