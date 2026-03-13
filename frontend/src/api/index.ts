import api from './client';

export const register = (username: string, password: string) =>
  api.post('/users/register', { username, password });

export const login = (username: string, password: string) =>
  api.post('/users/login', { username, password });

export const getMe = () => api.get('/users/me');

export const getWordBanks = () => api.get('/words/banks');

export const getWord = (wordId: number) => api.get(`/words/${wordId}`);

export const startNewWords = (wordBankId?: number, customWords?: string[]) =>
  api.post('/learning/new', { word_bank_id: wordBankId, custom_words: customWords });

export const startNewSingleWord = (word: string) =>
  api.post('/learning/new', { custom_words: [word] });

export const checkWords = (words: string[]) =>
  api.post('/learning/check-words', { words });

export const getTodayReview = () => api.get('/learning/review/today');

export const getTodayReviewCount = () => api.get('/learning/review/today/count');

export const getQuiz = (wordId: number, quizType?: string) =>
  api.get(`/learning/quiz/${wordId}`, { params: quizType ? { quiz_type: quizType } : {} });

export const confirmDone = (wordIds: number[]) =>
  api.post('/learning/confirm', { word_ids: wordIds });

export const getRecentWords = () => api.get('/learning/words/recent');

export const getLearningWords = () => api.get('/learning/words/learning');

export const getMasteredWords = () => api.get('/learning/words/mastered');

export const getLearningStats = () => api.get('/learning/stats');

export const getRecentGroups = () => api.get('/learning/groups/recent');

export const getLearningGroups = () => api.get('/learning/groups/learning');

export const getGroupWords = (groupId: number) => api.get(`/learning/groups/${groupId}/words`);
