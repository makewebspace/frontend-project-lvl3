import onChange from 'on-change';
import { ADD_FEED_STATE } from './constants.js';

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

const toPostElement = (state, i18n, post) => {
  const container = createElement('li', [
    'list-group-item',
    'd-flex',
    'justify-content-between',
    'align-items-start',
    'border-0',
    'border-end-0',
  ]);
  const isSeenPost = state.uiState.seenPosts.has(post.id);
  const classNames = isSeenPost ? ['fw-normal', 'link-secondary'] : ['fw-bold'];
  const title = createElement('a', classNames, post.title);

  title.dataset.id = post.id;
  title.setAttribute('href', post.link);
  title.setAttribute('target', '_blank');
  title.setAttribute('rel', 'noopener noreferrer');

  const button = createElement('button', ['btn', 'btn-outline-primary', 'btn-sm'], i18n.t('show'));

  button.dataset.id = post.id;
  button.dataset.bsToggle = 'modal';
  button.dataset.bsTarget = '#modal';

  container.appendChild(title);
  container.appendChild(button);

  return container;
};

const renderFeeds = (state, i18n, elements) => {
  elements.feeds.innerHTML = '';

  const fragment = document.createDocumentFragment();

  state.feeds.map(toFeedElement).forEach(appendTo(fragment));

  const container = createWrapper(i18n.t('feeds'), fragment);

  elements.feeds.appendChild(container);
};

const renderPosts = (state, i18n, elements) => {
  elements.posts.innerHTML = '';

  const fragment = document.createDocumentFragment();

  state.posts.map(toPostElement.bind(null, state, i18n)).forEach(appendTo(fragment));

  const container = createWrapper(i18n.t('posts'), fragment);

  elements.posts.appendChild(container);
};

const clearError = (elements) => {
  elements.feedback.innerHTML = '';
  elements.feedback.classList.remove('text-success', 'text-danger');
  elements.urlInput.classList.remove('is-invalid');
};

const renderSuccess = (i18n, elements) => {
  clearError(elements);
  elements.urlInput.value = '';
  elements.urlInput.removeAttribute('readonly');
  elements.urlInput.focus();
  elements.submitBtn.disabled = false;
  elements.feedback.classList.add('text-success');
  elements.feedback.textContent = i18n.t('addFeedProcess.processed');
};

const renderError = (state, i18n, elements) => {
  clearError(elements);
  elements.feedback.classList.add('text-danger');
  elements.feedback.textContent = i18n.t(state.addFeedProcess.error);
  elements.urlInput.classList.add('is-invalid');
};

const renderProcessing = (elements) => {
  clearError(elements);
  elements.submitBtn.disabled = true;
  elements.urlInput.setAttribute('readonly', true);
};

const renderFailed = (elements) => {
  elements.submitBtn.disabled = false;
  elements.urlInput.removeAttribute('readonly');
};

const renderModal = (state, elements) => {
  const postId = state.uiState.activePostId;
  const activePost = state.posts.find((post) => post.id === postId) || {};
  const { title, description, link } = activePost;
  elements.modal.querySelector('.modal-title').textContent = title;
  elements.modal.querySelector('.modal-body').textContent = description;
  elements.modal.querySelector('.full-article').setAttribute('href', link);
};

const render = (state, i18n, elements) => (path, value) => {
  if (path === 'feeds' && value.length) renderFeeds(state, i18n, elements);
  if (path === 'posts' && value.length) renderPosts(state, i18n, elements);
  if (path === 'uiState.seenPosts') renderPosts(state, i18n, elements);
  if (path === 'uiState.activePostId') renderModal(state, elements);
  if (path === 'addFeedProcess.error') renderError(state, i18n, elements);
  if (path === 'addFeedProcess.state') {
    if (value === ADD_FEED_STATE.PROCESSING) renderProcessing(elements);
    if (value === ADD_FEED_STATE.PROCESSED) renderSuccess(i18n, elements);
    if (value === ADD_FEED_STATE.FAILED) renderFailed(elements);
  }
};

export default (state, i18n, service) => {
  const { addFeed, clearActivePost, previewPost } = service;

  const elements = {
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
    feedback: document.querySelector('.feedback'),
    addFeedForm: document.querySelector('.rss-form'),
    submitBtn: document.querySelector('.rss-form button[type="submit"]'),
    urlInput: document.getElementById('url-input'),
    modal: document.getElementById('modal'),
  };

  const watchedState = onChange(state, render(state, i18n, elements));

  elements.addFeedForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = { url: formData.get('url').trim().toLowerCase() };
    addFeed(data, watchedState);
  });

  elements.modal.addEventListener('hidden.bs.modal', () => {
    clearActivePost(watchedState);
  });

  elements.posts.addEventListener('click', (event) => {
    if (!event.target.dataset.id) return;
    const postId = event.target.dataset.id;
    previewPost(postId, watchedState);
  });

  return watchedState;
};
