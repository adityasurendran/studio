jest.mock('../ai/genkit', () => ({
  ai: {
    defineTool: jest.fn(),
    definePrompt: jest.fn(),
    defineFlow: jest.fn(),
    generate: jest.fn(),
  },
}));
jest.mock('genkit', () => ({ z: require('zod') }));
jest.mock('../ai/flows/generate-image-for-sentence', () => ({
  generateImageForSentence: jest.fn(),
}));

import { cleanSentence } from '../ai/flows/generate-lesson';
import { createMockChildProfile } from './mocks/childProfile';

describe('cleanSentence', () => {
  it('capitalizes and adds period to lowercase sentence without punctuation', () => {
    expect(cleanSentence('hello world')).toBe('Hello world.');
  });

  it('leaves sentences ending with punctuation unchanged', () => {
    expect(cleanSentence('Hello world!')).toBe('Hello world!');
    expect(cleanSentence('Hi there.')).toBe('Hi there.');
  });
});
