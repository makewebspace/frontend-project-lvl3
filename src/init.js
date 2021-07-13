import i18n from 'i18next';
import initView from './view.js';
import resources from './locales';
import { ADD_FEED_STATE } from './service.js';

export default () => {
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
      seenPosts: new Set(),
      activePostId: null,
    },
  };
  const options = { lng: 'ru', resources };
  const i18nInstance = i18n.createInstance();
  const initApp = () => initView(initialState, i18nInstance);
  return i18nInstance.init(options).then(initApp);
};
