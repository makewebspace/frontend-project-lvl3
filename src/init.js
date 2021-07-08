import 'bootstrap/dist/css/bootstrap.min.css';
import * as view from './view.js';

const initialState = {
  feeds: [],
  posts: [],
  addFeedProcess: {
    state: 'filling',
    validationState: 'valid',
    data: { url: '' },
    error: null,
  },
  uiState: {
    seenPosts: [],
  },
};

export default () => {
  view.init(initialState);
};
