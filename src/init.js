import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import initView from './view.js';
import resources from './locales';
import { ADD_FEED_PROCESS } from './service.js';

const initialState = {
  feeds: [],
  posts: [],
  addFeedProcess: {
    state: ADD_FEED_PROCESS.FILLING,
    validationState: ADD_FEED_PROCESS.VALID,
    data: { url: '' },
    error: null,
  },
  uiState: {
    seenPosts: [],
  },
};

export default () => {
  const options = { lng: 'ru', resources };
  i18next.init(options).then(() => initView(initialState));
};
