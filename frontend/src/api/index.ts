import api from './client';

export const register = (username: string, password: string) =>
  api.post('/users/register', { username, password });

export const login = (username: string, password: string) =>
  api.post('/users/login', { username, password });

export const getMe = () => api.get('/users/me');

export const getWordBanks = () => api.get('/words/banks');

export const getBankWords = (bankId: number) => api.get(`/words/bank/${bankId}`);

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

export const getTodayReview = (includeReviewed = false) =>
  api.get('/learning/review/today', { params: includeReviewed ? { include_reviewed: true } : {} });

export const getTodayReviewCount = () => api.get('/learning/review/today/count');

export const getQuiz = (wordId: number, quizType?: string) =>
  api.get(`/learning/quiz/${wordId}`, { params: quizType ? { quiz_type: quizType } : {} });

export const confirmDone = (wordIds: number[], totalQuestions = 0, correctAnswers = 0, spellingCorrect = 0, createGroup = true) =>
  api.post('/learning/confirm', { word_ids: wordIds, total_questions: totalQuestions, correct_answers: correctAnswers, spelling_correct: spellingCorrect, create_group: createGroup });

export const getRecentWords = () => api.get('/learning/words/recent');

export const getLearningWords = (bankId?: number) =>
  api.get('/learning/words/learning', { params: bankId ? { bank_id: bankId } : {} });

export const getMasteredWords = (bankId?: number) =>
  api.get('/learning/words/mastered', { params: bankId ? { bank_id: bankId } : {} });

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
