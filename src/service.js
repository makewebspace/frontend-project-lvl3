/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import axios from 'axios';
import parse from './parser.js';

export const ADD_FEED_STATE = {
  FILLING: 'filling',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed',
  VAILD: 'valid',
  INVALID: 'invalid',
};

const allOrigins = {
  get: (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`,
};

const schema = yup.string().required().url('addFeedProcess.errors.notValidUrl');

const hasFeed = (url, state) => state.feeds.some((feed) => feed.url === url);

const validate = (url, state) => {
  try {
    schema.validateSync(url, { abortEarly: true });
  } catch (e) {
    return e.message;
  }
  if (hasFeed(url, state)) {
    return 'addFeedProcess.errors.rssFeedExists';
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
    watchedState.addFeedProcess.validationState = ADD_FEED_STATE.INVALID;
    return;
  }

  watchedState.addFeedProcess.validationState = ADD_FEED_STATE.VAILD;
  watchedState.addFeedProcess.state = ADD_FEED_STATE.PROCESSING;

  axios
    .get(allOrigins.get(data.url))
    .catch((err) => {
      if (err.response) {
        throw new Error('addFeedProcess.errors.notAvailableService');
      }
      if (err.request) {
        throw new Error('addFeedProcess.errors.netWorkProblem');
      }
      throw new Error('addFeedProcess.errors.unexpected');
    })
    .then((response) => {
      if (response.data.status.http_code !== 200) {
        throw new Error('addFeedProcess.errors.notFound');
      }
      try {
        return parse(response.data.contents);
      } catch (_) {
        throw new Error('addFeedProcess.errors.notValidRss');
      }
    })
    .then((parsedFeed) => normalize({ ...parsedFeed, url: data.url }))
    .then(({ feed, posts }) => {
      watchedState.feeds = [feed, ...state.feeds];
      watchedState.posts = [...posts, ...state.posts];
      watchedState.addFeedProcess.state = ADD_FEED_STATE.PROCESSED;
    })
    .catch((err) => {
      watchedState.addFeedProcess.error = err.message;
      watchedState.addFeedProcess.state = ADD_FEED_STATE.FAILED;
    });
};

export default { addFeed };
