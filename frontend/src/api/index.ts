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

export const pickNewWords = (wordBankId: number) =>
  api.post('/learning/new-pick', { word_bank_id: wordBankId });

export const completeWord = (wordId: number) =>
  api.post(`/learning/complete/${wordId}`);

export const completeBatch = (wordIds: number[]) =>
  api.post('/learning/complete-batch', { word_ids: wordIds });

export const startNewSingleWord = (word: string) =>
  api.post('/learning/new', { custom_words: [word] });

export const checkWords = (words: string[]) =>
  api.post('/learning/check-words', { words });

export const getTodayReview = () => api.get('/learning/review/today');

export const getTodayReviewCount = () => api.get('/learning/review/today/count');

export const getQuiz = (wordId: number, quizType?: string) =>
  api.get(`/learning/quiz/${wordId}`, { params: quizType ? { quiz_type: quizType } : {} });

export const confirmDone = (wordIds: number[], totalQuestions = 0, correctAnswers = 0, spellingCorrect = 0) =>
  api.post('/learning/confirm', { word_ids: wordIds, total_questions: totalQuestions, correct_answers: correctAnswers, spelling_correct: spellingCorrect });

export const getRecentWords = () => api.get('/learning/words/recent');

export const getLearningWords = () => api.get('/learning/words/learning');

export const getMasteredWords = () => api.get('/learning/words/mastered');

export const getLearningStats = () => api.get('/learning/stats');

export const getRecentGroups = () => api.get('/learning/groups/recent');

export const getLearningGroups = () => api.get('/learning/groups/learning');

export const getMasteredGroups = () => api.get('/learning/groups/mastered');

export const getGroupWords = (groupId: number) => api.get(`/learning/groups/${groupId}/words`);

export const getGrowthStats = () => api.get('/growth/stats');

export const getHeatmap = (days = 90) => api.get(`/growth/heatmap?days=${days}`);

export const getEnergyCurve = (days = 30) => api.get(`/growth/imprint-curve?days=${days}`);

export const getAchievements = () => api.get('/growth/achievements');

export const getWordAudio = (word: string) => `/api/audio/${encodeURIComponent(word)}`;
