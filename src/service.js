/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import axios from 'axios';
import parse from './parser.js';

const allOrigins = {
  get: (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`,
};

const schema = yup.string().required().url('Ссылка должна быть валидным URL');

const hasFeed = (url, state) => state.feeds.some((feed) => feed.url === url);

const validate = (url, state) => {
  try {
    schema.validateSync(url, { abortEarly: true });
  } catch (e) {
    return e.message;
  }
  if (hasFeed(url, state)) {
    return 'RSS уже существует';
  }
  return null;
};

const generateId = () => `_${Math.random().toString(36).substr(2, 9)}`;

const normalize = ({ title, description, url, posts }) => {
  const feed = {
    id: generateId(),
    url,
    title,
    description,
  };

  const normalizedPosts = posts.map((post) => ({
    id: generateId(),
    feedId: feed.id,
    ...post,
  }));

  return { feed, posts: normalizedPosts };
};

export const addFeed = (data, state, watchedState) => {
  const error = validate(data.url, state);
  const isNotValid = error !== null;

  watchedState.addFeedProcess.data = data;
  watchedState.addFeedProcess.error = error;

  if (isNotValid) {
    watchedState.addFeedProcess.validationState = 'invalid';
    return;
  }

  watchedState.addFeedProcess.validationState = 'valid';
  watchedState.addFeedProcess.state = 'processing';

  axios
    .get(allOrigins.get(data.url))
    .catch((err) => {
      if (err.response) {
        throw new Error('Сервис не доступен. Попробуйте позже...');
      }
      if (err.request) {
        throw new Error('Проблемы с сетью. Проверьте настройки сети!');
      }
      throw new Error(`Что-то пошло не так... Ошибка: ${err.message}`);
    })
    .then((response) => {
      if (response.data.status.http_code !== 200) {
        throw new Error('Ресурс не найден или не доступен...');
      }
      try {
        return parse(response.data.contents);
      } catch (_) {
        throw new Error('Ресурс не содержит валидный RSS');
      }
    })
    .then((parsedFeed) => normalize({ ...parsedFeed, url: data.url }))
    .then(({ feed, posts }) => {
      watchedState.feeds = [feed, ...state.feeds];
      watchedState.posts = [...posts, ...state.posts];
      watchedState.addFeedProcess.state = 'processed';
    })
    .catch((err) => {
      watchedState.addFeedProcess.error = err.message;
      watchedState.addFeedProcess.state = 'failed';
    });
};

export default { addFeed };
