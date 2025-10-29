const QUERY = encodeURIComponent('Select *');

const SHEET_ID = '1NtEgXCUK2l95tw04zyHkHejwEGppVbJ53KAWKHhk06E';
const BASE = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?`;
const PROJECTS_SHEET = 'Projects';
const GALLERY_SHEET = 'Gallery';
const INJECTIONS_SHEET = 'Injections';
const PROJECTS_URL = `${BASE}&sheet=${PROJECTS_SHEET}&tq=${QUERY}`;
const GALLERY_URL = `${BASE}&sheet=${GALLERY_SHEET}&tq=${QUERY}`;
const INJECTIONS_URL = `${BASE}&sheet=${INJECTIONS_SHEET}&tq=${QUERY}`;

const PROJECTS_COLS = {
  "title": 0,
  "date": 1,
  "type": 2,
  "at": 3,
  "body": 4,
  "image": 5,
  "show": 6
}

const GALLERY_COLS = {
  "image": 0,
  "caption": 1,
  "show": 2
}

const INJECTIONS_COLS = {
  "selector": 0,
  "attribute": 1,
  "value": 2,
  "type": 3,
  "apply": 4
}

const MONTHS = new Map([[1, "January"], [2, "February"], [3, "March"], [4, "April"], [5, "May"], [6, "June"], [7, "July"], [8, "August"], [9, "September"], [10, "October"], [11, "November"], [12, "December"]]);

let projects;
let gallery;
let injections;

async function init() {
  let currentPage = (localStorage.currentPage != null) ? localStorage.currentPage : 'about';
  changePage(currentPage);

  await Promise.all([getProjects(), getGallery(), getInjections()]);
  makeProjects();
  makeGallery();
  makeInjections();
}
window.addEventListener('DOMContentLoaded', init);

// FETCH

async function getProjects() {
  await fetch(PROJECTS_URL).then((res) => res.text()).then((rep) => { projects = JSON.parse(rep.substring(47).slice(0, -2)).table.rows; });
}

async function getGallery() {
  await fetch(GALLERY_URL).then((res) => res.text()).then((rep) => { gallery = JSON.parse(rep.substring(47).slice(0, -2)).table.rows; });
}

async function getInjections() {
  await fetch(INJECTIONS_URL).then((res) => res.text()).then((rep) => { injections = JSON.parse(rep.substring(47).slice(0, -2)).table.rows; });
}

// CHANGE PAGES

function changePage(target) {
  document.querySelectorAll('.content').forEach((el) => {
    el.classList.add('hidden');
  });

  let obj = document.getElementById(target + '-content');
  document.querySelectorAll('.nav').forEach((el) => {
    el.classList.remove('selected');
    if (el.getAttribute('href') == target) {
      el.classList.add('selected');
    }
  })
  localStorage.currentPage = target;

  window.setTimeout(function () {
    obj.setAttribute('style', 'display: flex;');
  }, 500)

  window.setTimeout(function () {
    document.querySelectorAll('.content').forEach((el) => {
      if (el.getAttribute('id') != (target + '-content')) {
        el.setAttribute('style', 'display: none;');
      }
    });
    obj.classList.remove('hidden');
  }, 525);
}
document.querySelectorAll('.nav').forEach((el) => {
  el.addEventListener('click', (event) => changePage(el.getAttribute('href')));
});

// UTILITY

function driveUrlToId(url) {
  return url.substring(url.indexOf('/d/') + 3, url.indexOf('/view'));
}

function driveUrlToThumb(url) {
  return `https://drive.google.com/thumbnail?id=${driveUrlToId(url)}&sz=w1080`;
}

function driveUrlToDownload(url) {
  return `https://drive.google.com/uc?export=download&id=${driveUrlToId(url)}`;
}

function textToParagraph(text) {
  let paras = text.split('\n\n');
  let html = '';
  paras.forEach((el) => {
    html += `<p>${el}</p>`;
  });
  return html;
}

// PROJECTS

function makeProjects() {
  let projectMap = new Map();

  for (let i = 0; i < projects.length; i++) {
    if (projects[i].c[PROJECTS_COLS.title] == null || projects[i].c[PROJECTS_COLS.date] == null || projects[i].c[PROJECTS_COLS.show].v == false) { continue; }
    let date = projects[i].c[PROJECTS_COLS.date].v.split('(')[1].split(')')[0].split(',');
    let utc = Date.UTC(date[0], date[1], date[2]);
    projectMap.set(utc, i);
  }

  let projectDates = Array.from(projectMap.keys()).sort().reverse();
  let sortedProjects = [];
  for (let i = 0; i < projectDates.length; i++) {
    sortedProjects.push(projects[projectMap.get(projectDates[i])]);
  }

  let filters = new Set();
  let html = '';

  for (let i = 0; i < sortedProjects.length; i++) {
    let type = '';
    if (sortedProjects[i].c[PROJECTS_COLS.type] != null) {
      let types = sortedProjects[i].c[PROJECTS_COLS.type].v.replace(', ', ' ');
      types.split(' ').forEach((el) => {
        filters.add(el);
      });
      type = types.toLowerCase();
    }

    html += `<li class="${type}"><div><h2>${sortedProjects[i].c[PROJECTS_COLS.title].v}</h2>`;
    if (sortedProjects[i].c[PROJECTS_COLS.at] != null) {
      html += `<div class="location">${sortedProjects[i].c[PROJECTS_COLS.at].v}</div>`;
    }
    if (sortedProjects[i].c[PROJECTS_COLS.date] != null) {
      let date = sortedProjects[i].c[PROJECTS_COLS.date].v.split('(')[1].split(')')[0].split(',');
      html += `<div class="date">${MONTHS.get(Number(date[1]) + 1)} ${date[2]}, ${date[0]}</div>`;
    }
    if (sortedProjects[i].c[PROJECTS_COLS.body] != null) {
      html += textToParagraph(sortedProjects[i].c[PROJECTS_COLS.body].v);
    }
    html += '</div>';

    if (sortedProjects[i].c[PROJECTS_COLS.image] != null) {
      let imgSrc = driveUrlToThumb(sortedProjects[i].c[PROJECTS_COLS.image].v);
      html += `<figure><img src="${imgSrc}"></figure>`;
    }
    html += '</li>';
  }

  document.getElementById('projects').innerHTML = html;

  filters = Array.from(filters).sort();
  let filtersHTML = '<li><button id="filter-all" class="filter selected">All</button></li>';
  filters.forEach((el) => {
    filtersHTML += `<li><button id="filter-${el.toLowerCase()}" class="filter">${el}</button></li>`;
  });

  document.getElementById('project-filters').innerHTML = filtersHTML;
  document.querySelectorAll('button.filter').forEach((el) => {
    el.addEventListener('click', (event) => { filterProjects(el.getAttribute('id').substring(7)); })
  });
}

function filterProjects(type) {
  let allProjects = document.querySelectorAll('#projects > li');

  allProjects.forEach((el) => {
    el.style.display = 'none';
    if (type == 'all' || el.classList.contains(type) == true) {
      el.style.display = 'flex';
    }
  });

  let allFilters = document.querySelectorAll('#project-filters button.filter');

  allFilters.forEach((el) => {
    el.classList.remove('selected');
    if (el.getAttribute('id').substring(7) == type) {
      el.classList.add('selected');
    }
  });
}

// GALLERY

function makeGallery() {
  let html = '';

  for (let i = 0; i < gallery.length; i++) {
    if (gallery[i].c[GALLERY_COLS.image] == null || gallery[i].c[GALLERY_COLS.show].v == false) { continue; }

    let imgSrc = driveUrlToThumb(gallery[i].c[GALLERY_COLS.image].v);

    html += `<li><figure><img src="${imgSrc}"></figure></li>`;
  }

  document.querySelector('#gallery-content .gallery').innerHTML = html;
}

// INJECTIONS

function makeInjections() {
  for (let i = 0; i < injections.length; i++) {
    if (injections[i].c[INJECTIONS_COLS.selector] == null || injections[i].c[INJECTIONS_COLS.attribute] == null || injections[i].c[INJECTIONS_COLS.value] == null || injections[i].c[INJECTIONS_COLS.type] == null || injections[i].c[INJECTIONS_COLS.apply].v == false) { continue; }

    let value = injections[i].c[INJECTIONS_COLS.value].v;

    switch (injections[i].c[INJECTIONS_COLS.type].v) {
      case 'Paragraphs':
        value = textToParagraph(injections[i].c[INJECTIONS_COLS.value].v);
        break;
      case 'Image':
        value = driveUrlToThumb(injections[i].c[INJECTIONS_COLS.value].v);
        break;
      case 'Download':
        value = driveUrlToDownload(injections[i].c[INJECTIONS_COLS.value].v);
        break;
      default:
        break;
    }

    let elements = document.querySelectorAll(injections[i].c[INJECTIONS_COLS.selector].v);

    if (injections[i].c[INJECTIONS_COLS.attribute].v == 'innerHTML') {
      elements.forEach((el) => {
        el.innerHTML = value;
      });
    }
    else {
      elements.forEach((el) => {
        el.setAttribute(injections[i].c[INJECTIONS_COLS.attribute].v, value);
      });
    }
  }
}