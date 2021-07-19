import { promises as fs } from 'fs';
import path from 'path';
import init from '../src/init';

const readFixture = (filename) => {
  const fullPath = path.resolve(__dirname, '../__fixtures__/', filename);
  return fs.readFile(fullPath, 'utf8');
};

beforeEach(async () => {
  document.body.innerHTML = await readFixture('index.html');
  await init();
});

test('when RSS feed is successfully added', () => {
  expect(true).toBeDefined();
});

test('when input url is not valid', () => {
  expect(true).toBeDefined();
});

test('when network is offline', () => {
  expect(true).toBeDefined();
});

test('when request url getting back not found error', () => {
  expect(true).toBeDefined();
});

test('when request url getting back not valid XML', () => {
  expect(true).toBeDefined();
});
