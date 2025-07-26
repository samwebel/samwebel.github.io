const QUERY = encodeURIComponent('Select *');

const SHEET_ID = '1NtEgXCUK2l95tw04zyHkHejwEGppVbJ53KAWKHhk06E';
const BASE = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?`;
const PROJECTS_SHEET = 'Projects';
const GALLERY_SHEET = 'Gallery';
const PROJECTS_URL = `${BASE}&sheet=${PROJECTS_SHEET}&tq=${QUERY}`;
const GALLERY_URL = `${BASE}&sheet=${GALLERY_SHEET}&tq=${QUERY}`;

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

const MONTHS = new Map([[1, "January"], [2, "February"], [3, "March"], [4, "April"], [5, "May"], [6, "June"], [7, "July"], [8, "August"], [9, "September"], [10, "October"], [11, "November"], [12, "December"]]);

let projects;
let gallery;

async function init() {
  let currentPage = (localStorage.currentPage != null) ? localStorage.currentPage : 'about';
  changePage(currentPage);

  await Promise.all([getProjects(), getGallery()]);
  makeProjects();
  makeGallery();
}
window.addEventListener('DOMContentLoaded', init);

// FETCH

async function getProjects() {
  await fetch(PROJECTS_URL).then((res) => res.text()).then((rep) => { projects = JSON.parse(rep.substring(47).slice(0,-2)).table.rows; });
}

async function getGallery() {
  await fetch(GALLERY_URL).then((res) => res.text()).then((rep) => { gallery = JSON.parse(rep.substring(47).slice(0,-2)).table.rows; });
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

  window.setTimeout(function() {
    obj.setAttribute('style', 'display: flex;');
  }, 500)

  window.setTimeout(function() {
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

// PROJECTS

function makeProjects() {
  let html = '';

  for (let i = 0; i < projects.length; i ++) {
    if (projects[i].c[PROJECTS_COLS.title] == null || projects[i].c[PROJECTS_COLS.show].v == false) { continue; }

    let type = '';
    if (projects[i].c[PROJECTS_COLS.type] != null) {
      type = projects[i].c[PROJECTS_COLS.type].v.replace(', ', ' ').toLowerCase();
    }

    html += `<li class="${type}"><div><h2>${projects[i].c[PROJECTS_COLS.title].v}</h2>`;
    if (projects[i].c[PROJECTS_COLS.at] != null) {
      html += `<div class="location">${projects[i].c[PROJECTS_COLS.at].v}</div>`;
    }
    if (projects[i].c[PROJECTS_COLS.date] != null) {
      let date = projects[i].c[PROJECTS_COLS.date].v.split('(')[1].split(')')[0].split(',');
      html += `<div class="date">${MONTHS.get(Number(date[1]) + 1)} ${date[2]}, ${date[0]}</div>`;
    }
    if (projects[i].c[PROJECTS_COLS.body] != null) {
      html += `<p>${projects[i].c[PROJECTS_COLS.body].v}</p>`
    }
    html += '</div>';

    if (projects[i].c[PROJECTS_COLS.image] != null) {
      let imgSrc = driveUrlToThumb(projects[i].c[PROJECTS_COLS.image].v);
      html += `<figure><img src="${imgSrc}"></figure>`;
    }
    html += '</li>';
  }

  document.getElementById('projects').innerHTML = html;
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
document.querySelectorAll('button.filter').forEach((el) => {
  el.addEventListener('click', (event) => { filterProjects(el.getAttribute('id').substring(7)); })
});

// GALLERY

function driveUrlToThumb(url) {
  return 'https://drive.google.com/thumbnail?id=' + url.substring(url.indexOf('/d/') + 3, url.indexOf('/view')) + '&sz=w1080';
}

function makeGallery() {
  let html = '';

  for (let i = 0; i < gallery.length; i ++) {
    if (gallery[i].c[GALLERY_COLS.image] == null || gallery[i].c[GALLERY_COLS.show].v == false) { continue; }

    let imgSrc = driveUrlToThumb(gallery[i].c[GALLERY_COLS.image].v);

    html += `<li><figure><img src="${imgSrc}"></figure></li>`;
  }
  
  document.querySelector('#gallery-content .gallery').innerHTML = html;
}