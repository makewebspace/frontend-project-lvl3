import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/js/dist/modal.js';
import i18next from 'i18next';
import initView from './view.js';
import resources from './locales';
import { ADD_FEED_STATE } from './service.js';

const initialState = {
  feeds: [],
  posts: [],
  addFeedProcess: {
    state: ADD_FEED_STATE.FILLING,
    validationState: ADD_FEED_STATE.VALID,
    data: { url: '' },
    error: null,
  },
  timerToken: null,
  uiState: {
    seenPosts: [],
    activePost: {},
  },
};

export default () => {
  const options = { lng: 'ru', resources };
  i18next.init(options).then(() => initView(initialState));
};
