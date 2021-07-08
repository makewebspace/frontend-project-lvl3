import onChange from 'on-change';
import { addFeed } from './service.js';

const elements = {};

const appendTo = (fragment) => (element) => fragment.appendChild(element);

const createElement = (tagName, classList = [], textContent = '') => {
  const element = document.createElement(tagName);
  element.classList.add(...classList);
  element.textContent = textContent;
  return element;
};

const createWrapper = (title, fragment) => {
  const container = createElement('div', ['card', 'border-0']);
  const titleContainer = createElement('div', ['card-body']);
  const titleElement = createElement('h2', ['card-title', 'h4'], title);

  titleContainer.appendChild(titleElement);
  container.appendChild(titleContainer);

  const listContainer = createElement('ul', ['list-group', 'border-0', 'rounded-0']);

  listContainer.appendChild(fragment);
  container.appendChild(listContainer);

  return container;
};

const toFeedElement = (feed) => {
  const container = createElement('li', ['list-group-item', 'border-0', 'border-end-0']);
  const title = createElement('h3', ['h6', 'm-0'], feed.title);
  const description = createElement('p', ['m-0', 'small', 'text-black-50'], feed.description);
  container.appendChild(title);
  container.appendChild(description);
  return container;
};

const toPostElement = (post) => {
  const container = createElement('li', [
    'list-group-item',
    'd-flex',
    'justify-content-between',
    'align-items-start',
    'border-0',
    'border-end-0',
  ]);
  const title = createElement('a', ['fw-bold'], post.title);

  title.dataset.id = post.id;
  title.setAttribute('href', post.link);
  title.setAttribute('_target', '_blank');
  title.setAttribute('rel', 'noopener noreferrer');

  const button = createElement('button', ['btn', 'btn-outline-primary', 'btn-sm'], 'Просмотр');

  button.dataset.id = post.id;
  button.dataset.bsToggle = 'modal';
  button.dataset.bsTarget = '#modal';

  container.appendChild(title);
  container.appendChild(button);

  return container;
};

const renderFeeds = (state) => {
  elements.feeds.innerHTML = '';

  const fragment = document.createDocumentFragment();

  state.feeds.map(toFeedElement).forEach(appendTo(fragment));

  const container = createWrapper('Фиды', fragment);

  elements.feeds.appendChild(container);
};

const renderPosts = (state) => {
  elements.posts.innerHTML = '';

  const fragment = document.createDocumentFragment();

  state.posts.map(toPostElement).forEach(appendTo(fragment));

  const container = createWrapper('Посты', fragment);

  elements.posts.appendChild(container);
};

const clearForm = () => {
  elements.urlInput.value = '';
  elements.urlInput.focus();
};

const clearError = () => {
  elements.feedback.innerHTML = '';
  elements.feedback.classList.remove('text-success', 'text-danger');
  elements.urlInput.classList.remove('is-invalid');
};

const renderSuccess = () => {
  clearForm();
  clearError();
  elements.feedback.classList.add('text-success');
  elements.feedback.textContent = 'RSS успешно загружен';
};

const renderError = (state) => {
  clearError();
  elements.feedback.classList.add('text-danger');
  elements.feedback.textContent = state.addFeedProcess.error;
  elements.urlInput.classList.add('is-invalid');
};

const render = (state) => (path, value) => {
  if (path === 'feeds') renderFeeds(state);
  if (path === 'posts') renderPosts(state);
  if (path === 'addFeedProcess.error') renderError(state);
  if (path === 'addFeedProcess.state') {
    if (value === 'processing') clearError();
    if (value === 'processed') renderSuccess();
  }
};

const init = (state) => {
  const watchedState = onChange(state, render(state));

  elements.feeds = document.querySelector('.feeds');
  elements.posts = document.querySelector('.posts');
  elements.feedback = document.querySelector('.feedback');
  elements.addFeedForm = document.querySelector('.rss-form');
  elements.urlInput = document.getElementById('url-input');

  elements.addFeedForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = { url: formData.get('url').trim().toLowerCase() };
    addFeed(data, state, watchedState);
  });
};

export default { init };