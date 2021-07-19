import * as yup from 'yup';
import axios from 'axios';
import parse from './parser.js';
import { ADD_FEED_STATE, TIME_TO_LIVE } from './constants.js';

const proxy = {
  get: (url) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(url)}`,
};

const baseSchema = yup.string()
  .required('addFeedProcess.errors.required')
  .url('addFeedProcess.errors.notValidUrl');

const validate = (url, state) => {
  const urls = state.feeds.map((feed) => feed.url);
  const schema = baseSchema.notOneOf(urls, 'addFeedProcess.errors.rssFeedExists');
  try {
    schema.validateSync(url, { abortEarly: true });
    return null;
  } catch (e) {
    return e.message;
  }
};

const generateId = () => `_${Math.random().toString(36).substr(2, 9)}`;

const normalize = ({
  title, description, url, posts,
}) => {
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

const getFeed = (url) => axios
  .get(proxy.get(url))
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
    try {
      return parse(response.data.contents);
    } catch (_) {
      throw new Error('addFeedProcess.errors.notValidRss');
    }
  })
  .then((parsedFeed) => normalize({ ...parsedFeed, url }));

export const startPolling = (state) => {
  const fetchFeeds = () => {
    const feedResponses = state.feeds.map((feed) => getFeed(feed.url));
    const postLinks = state.posts.map((post) => post.link);
    const hasNotInState = (post) => !postLinks.includes(post.link);
    Promise
      .all(feedResponses)
      .then((feeds) => feeds.flatMap((feed) => feed.posts))
      .then((posts) => posts.filter(hasNotInState))
      .then((posts) => { state.posts = [...posts, ...state.posts]; })
      .finally(() => startPolling(state));
  };
  setTimeout(fetchFeeds, TIME_TO_LIVE);
};

export const addFeed = (data, state) => {
  const error = validate(data.url, state);

  state.addFeedProcess.data = data;
  state.addFeedProcess.error = error;

  if (error) {
    state.addFeedProcess.validationState = ADD_FEED_STATE.INVALID;
    return;
  }

  state.addFeedProcess.validationState = ADD_FEED_STATE.VAILD;
  state.addFeedProcess.state = ADD_FEED_STATE.PROCESSING;

  getFeed(data.url)
    .then(({ feed, posts }) => {
      state.feeds = [feed, ...state.feeds];
      state.posts = [...posts, ...state.posts];
      state.addFeedProcess.state = ADD_FEED_STATE.PROCESSED;
    })
    .catch((err) => {
      state.addFeedProcess.error = err.message;
      state.addFeedProcess.state = ADD_FEED_STATE.FAILED;
    });
};

export const previewPost = (postId, state) => {
  state.uiState.activePostId = postId;
  state.uiState.seenPosts.add(postId);
};

export const clearActivePost = (state) => {
  state.uiState.activePostId = null;
};
