import React, { useState, useEffect, useRef } from 'https://esm.sh/react@18.2.0';
// Fix: Import ReactDOM to resolve 'Cannot find name 'ReactDOM'' error.
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
import { GoogleGenAI } from 'https://cdn.jsdelivr.net/npm/@google/genai/dist/index.esm.js';

// --- GLOBAL TYPES ---
declare global {
    interface Window {
        GEMINI_API_KEY?: string;
    }
}

// --- DATA TYPES ---
type Client = {
  id: string;
  name: string;
  birthDate: string;
};

type TestResult = {
  id: string;
  clientId: string;
  testKey: string;
  date: string;
  answers: number[];
  scores: Record<string, number>;
  interpretation: Record<string, string>;
  aiInterpretation?: string;
};

type Report = {
  id: string;
  clientId: string;
  date: string;
  testResultIds: string[];
  summary: string;
};

type ScreenState = {
  name: string;
  clientId?: string | null;
  testKey?: string;
  resultId?: string;
  reportId?: string;
};

// --- ICONS ---
const HomeIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" }));
const UsersIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" }));
const SettingsIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" }), React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }));
const PlusIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }));
const ChevronLeftIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" }, React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }));
const SaveIcon = () => React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 mr-2", viewBox: "0 0 20 20", fill: "currentColor" }, React.createElement('path', { d: "M8 2a2 2 0 00-2 2v12a2 2 0 002 2h4a2 2 0 002-2V4a2 2 0 00-2-2H8z" }), React.createElement('path', { d: "M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" }));

// --- UTILS ---
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('ru-RU');
  } catch (e) {
    return dateString; // Return original if invalid
  }
};

const downloadAsTxt = (filename: string, text: string) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};


// --- HOOKS ---
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// --- API SERVICE ---
class GeminiAIService {
    private ai: GoogleGenAI | null = null;

    constructor() {
        // Prioritize environment variable, then fallback to config file.
        const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
            || (window.GEMINI_API_KEY && window.GEMINI_API_KEY !== "ВАШ_КЛЮЧ_API_СЮДА" ? window.GEMINI_API_KEY : null);

        if (apiKey) {
            try {
                this.ai = new GoogleGenAI({ apiKey });
            } catch (error) {
                console.error("Error initializing Gemini AI Service:", error);
                this.ai = null;
            }
        } else {
            console.warn("Gemini API Key is not configured. AI features will be unavailable.");
            this.ai = null;
        }
    }

    isAvailable(): boolean {
        return this.ai !== null;
    }

    async getTestInterpretation(testName: string, scores: Record<string, number>, standardInterpretation: string): Promise<string> {
        if (!this.ai) {
            throw new Error("AI Service is not available.");
        }
        const prompt = `
            Ты — профессиональный клинический психолог.
            Проанализируй следующие результаты психологического теста.
            Предоставь подробную, структурированную и эмпатичную интерпретацию на основе баллов.
            Не повторяй стандартную интерпретацию дословно; расширь и дополни её.
            Объясни, что эти баллы могут означать с точки зрения эмоционального состояния, когнитивных функций и потенциальных проблемных областей.
            Предложи возможные следующие шаги или темы для обсуждения с терапевтом.
            Твой ответ должен быть на русском языке.

            Название теста: ${testName}
            Баллы: ${JSON.stringify(scores)}
            Стандартная интерпретация: ${standardInterpretation}

            Начинай свою подробную интерпретацию.
        `;
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    }
    
    async getConsolidatedInterpretation(client: Client, testResults: TestResult[]): Promise<string> {
        if (!this.ai) {
            throw new Error("AI Service is not available.");
        }
        const resultsSummary = testResults.map(tr => {
            const test = TESTS[tr.testKey as keyof typeof TESTS];
            return `
                Тест: ${test.name} (проведен ${formatDate(tr.date)})
                Баллы: ${JSON.stringify(tr.scores)}
                Стандартная интерпретация: ${Object.values(tr.interpretation).join(' ')}
            `;
        }).join('\n---\n');

        const prompt = `
            Ты — эксперт в области клинической психологии, анализирующий несколько результатов тестов одного клиента.
            Имя клиента: ${client.name}
            Дата рождения клиента: ${formatDate(client.birthDate)}

            Вот результаты нескольких диагностических тестов:
            ${resultsSummary}

            Основываясь на этих сводных данных, предоставь целостный анализ. Твой анализ должен:
            1. Определить совпадения и расхождения в результатах разных тестов.
            2. Сформулировать всеобъемлющий психологический профиль клиента.
            3. Выделить потенциальные первичные и вторичные проблемы.
            4. Предложить предварительную диагностическую гипотезу, если это применимо.
            5. Дать рекомендации по терапевтическому вмешательству, включая возможные подходы (например, КПТ, психодинамический) и области для фокусировки.
            6. Сохранять профессиональный, эмпатичный и клинический тон.
            Твой ответ должен быть полностью на русском языке.

            Начинай свой сводный анализ.
        `;

        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using a more powerful model for complex analysis
            contents: prompt,
        });
        return response.text;
    }
}

const aiService = new GeminiAIService();

// --- TEST CONFIG ---
const TESTS = {
    mmse: {
        name: "Mini-Mental State Examination (MMSE)",
        questions: [
            // Orientation (Time)
            { text: "Какой сейчас год?", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Какое сейчас время года?", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Какой сейчас месяц?", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Какое сегодня число?", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Какой сегодня день недели?", options: ["Правильно", "Неправильно"], points: [1, 0] },
            // Orientation (Place)
            { text: "Где мы находимся? (Страна)", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Где мы находимся? (Область/Регион)", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Где мы находимся? (Город)", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Как называется это место (клиника/больница)?", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "На каком этаже мы находимся?", options: ["Правильно", "Неправильно"], points: [1, 0] },
            // Registration
            { text: "Назовите 3 слова: Яблоко, Стол, Монета. (повторил 1-е)", options: ["Да", "Нет"], points: [1, 0] },
            { text: "Назовите 3 слова: Яблоко, Стол, Монета. (повторил 2-е)", options: ["Да", "Нет"], points: [1, 0] },
            { text: "Назовите 3 слова: Яблоко, Стол, Монета. (повторил 3-е)", options: ["Да", "Нет"], points: [1, 0] },
            // Attention and Calculation
            { text: "Отнимите от 100 семь (93).", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Еще раз отнимите семь (86).", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Еще раз отнимите семь (79).", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Еще раз отнимите семь (72).", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Еще раз отнимите семь (65).", options: ["Правильно", "Неправильно"], points: [1, 0] },
            // Recall
            { text: "Вспомните 3 слова, которые я просил вас запомнить. (Яблоко)", options: ["Да", "Нет"], points: [1, 0] },
            { text: "Вспомните 3 слова, которые я просил вас запомнить. (Стол)", options: ["Да", "Нет"], points: [1, 0] },
            { text: "Вспомните 3 слова, которые я просил вас запомнить. (Монета)", options: ["Да", "Нет"], points: [1, 0] },
            // Language
            { text: "Покажите карандаш и часы, попросите назвать их. (Назвал карандаш)", options: ["Да", "Нет"], points: [1, 0] },
            { text: "Покажите карандаш и часы, попросите назвать их. (Назвал часы)", options: ["Да", "Нет"], points: [1, 0] },
            { text: "Попросите повторить фразу: 'Никаких если, и или но'.", options: ["Правильно", "Неправильно"], points: [1, 0] },
            { text: "Выполните команду из 3-х частей: 'Возьмите лист бумаги правой рукой, сложите его пополам и положите на пол'. (Взял правой рукой)", options: ["Да", "Нет"], points: [1, 0] },
            { text: "Выполните команду из 3-х частей. (Сложил пополам)", options: ["Да", "Нет"], points: [1, 0] },
            { text: "Выполните команду из 3-х частей. (Положил на пол)", options: ["Да", "Нет"], points: [1, 0] },
            { text: "Напишите 'Закройте глаза'. Попросите выполнить. (Выполнил)", options: ["Да", "Нет"], points: [1, 0] },
            { text: "Попросите написать предложение. (Написал осмысленное предложение)", options: ["Да", "Нет"], points: [1, 0] },
            // Visuospatial
            { text: "Попросите скопировать рисунок (два пересекающихся пятиугольника). (Скопировал)", options: ["Да", "Нет"], points: [1, 0] },
        ],
        calculate: (answers: number[]) => {
            const total = answers.reduce((sum, val) => sum + val, 0);
            return { total };
        },
        interpret: (scores: Record<string, number>) => {
            const score = scores.total;
            let interpretation = "Нет когнитивных нарушений.";
            if (score >= 28 && score <= 30) {
                interpretation = "Нет когнитивных нарушений.";
            } else if (score >= 24 && score <= 27) {
                interpretation = "Преддементные когнитивные нарушения.";
            } else if (score >= 20 && score <= 23) {
                interpretation = "Деменция легкой степени выраженности.";
            } else if (score >= 11 && score <= 19) {
                interpretation = "Деменция умеренной степени выраженности.";
            } else if (score >= 0 && score <= 10) {
                interpretation = "Тяжелая деменция.";
            }
            return { cognitive_status: interpretation };
        },
    },
    hads: {
        name: "Hospital Anxiety and Depression Scale (HADS)",
        questions: [
            // Anxiety Subscale Questions (odd-numbered)
            { text: "Я испытываю напряжение, мне не по себе", options: ["Все время", "Часто", "Время от времени", "Совсем не испытываю"], points: [3, 2, 1, 0] }, // Q1
            { text: "Я испытываю страх, кажется, что что-то ужасное может вот-вот случиться", options: ["Определенно это так, и страх очень велик", "Да, это так, но страх не очень велик", "Иногда, но это меня не беспокоит", "Совсем не испытываю"], points: [3, 2, 1, 0] }, // Q3
            { text: "Беспокойные мысли крутятся у меня в голове", options: ["Постоянно", "Большую часть времени", "Время от времени", "Только иногда"], points: [3, 2, 1, 0] }, // Q5
            { text: "Я легко могу присесть и расслабиться", options: ["Определенно, это так", "Наверное, это так", "Лишь изредка, это так", "Совсем не могу"], points: [0, 1, 2, 3] }, // Q7 (reversed)
            { text: "Я испытываю внутреннее напряжение или дрожь", options: ["Совсем не испытываю", "Иногда", "Часто", "Очень часто"], points: [0, 1, 2, 3] }, // Q9
            { text: "Я не могу усидеть на месте, словно мне постоянно нужно двигаться", options: ["Определенно, это так", "Наверное, это так", "Лишь в некоторой степени, это так", "Вовсе нет"], points: [3, 2, 1, 0] }, // Q11
            { text: "У меня бывает внезапное чувство паники", options: ["Очень часто", "Довольно часто", "Не так уж часто", "Совсем не бывает"], points: [3, 2, 1, 0] }, // Q13
            // Depression Subscale Questions (even-numbered)
            { text: "То, что приносило мне большое удовольствие, и сейчас вызывает у меня такое же чувство", options: ["Определенно, это так", "Наверное, это так", "Лишь в очень малой степени, это так", "Практически нет"], points: [0, 1, 2, 3] }, // Q2 (reversed)
            { text: "Я способен рассмеяться и увидеть в том или ином событии смешное", options: ["Определенно, это так", "Наверное, это так", "Лишь в очень малой степени, это так", "Совсем не способен"], points: [0, 1, 2, 3] }, // Q4 (reversed)
            { text: "Я испытываю бодрость", options: ["Совсем не испытываю", "Очень редко", "Иногда", "Практически все время"], points: [3, 2, 1, 0] }, // Q6
            { text: "Я стал медлительным", options: ["Практически все время", "Часто", "Иногда", "Совсем нет"], points: [3, 2, 1, 0] }, // Q8
            { text: "Я стал следить за своей внешностью", options: ["Я слежу за собой как следует", "Может быть, я не так много трачу на это времени", "Возможно, я стал меньше на это обращать внимания", "Определенно, я перестал за собой следить"], points: [0, 1, 2, 3] }, // Q10 (reversed)
            { text: "Я считаю, что мои дела (занятия, увлечения) могут принести мне чувство удовлетворения", options: ["Точно так же, как и обычно", "Пожалуй, меньше, чем обычно", "Значительно меньше, чем обычно", "Совсем так не считаю"], points: [0, 1, 2, 3] }, // Q12 (reversed)
            { text: "Я могу получить удовольствие от хорошей книги, радио- или телепрограммы", options: ["Часто", "Иногда", "Редко", "Очень редко"], points: [0, 1, 2, 3] }, // Q14 (reversed)
        ],
        calculate: (answers: number[]) => {
            const anxietyScore = answers[0] + answers[2] + answers[4] + answers[6] + answers[8] + answers[10] + answers[12];
            const depressionScore = answers[1] + answers[3] + answers[5] + answers[7] + answers[9] + answers[11] + answers[13];
            return { anxiety: anxietyScore, depression: depressionScore };
        },
        interpret: (scores: Record<string, number>) => {
            const { anxiety, depression } = scores;
            let anxietyResult = "Норма.";
            if (anxiety >= 0 && anxiety <= 7) anxietyResult = "Норма (отсутствие достоверно выраженных симптомов тревоги).";
            else if (anxiety >= 8 && anxiety <= 10) anxietyResult = "Субклинически выраженная тревога.";
            else if (anxiety >= 11) anxietyResult = "Клинически выраженная тревога.";

            let depressionResult = "Норма.";
            if (depression >= 0 && depression <= 7) depressionResult = "Норма (отсутствие достоверно выраженных симптомов депрессии).";
            else if (depression >= 8 && depression <= 10) depressionResult = "Субклинически выраженная депрессия.";
            else if (depression >= 11) depressionResult = "Клинически выраженная депрессия.";

            return { anxiety: `Anxiety: ${anxietyResult}`, depression: `Depression: ${depressionResult}` };
        },
    },
    zung: {
        name: "Шкала самооценки депрессии Цунга (Zung Self-Rating Depression Scale)",
        questions: [
            // Directly scored items
            { text: "Я чувствую подавленность", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [1, 2, 3, 4] },
            { text: "Утром я чувствую себя лучше всего", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [4, 3, 2, 1] }, // Reversed
            { text: "У меня бывают периоды плача или желание плакать", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [1, 2, 3, 4] },
            { text: "У меня плохой ночной сон", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [1, 2, 3, 4] },
            { text: "Аппетит у меня не хуже, чем обычно", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [4, 3, 2, 1] }, // Reversed
            { text: "Мне приятно смотреть на привлекательных женщин/мужчин, разговаривать с ними", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [4, 3, 2, 1] }, // Reversed
            { text: "Я замечаю, что теряю вес", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [1, 2, 3, 4] },
            { text: "Меня беспокоят запоры", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [1, 2, 3, 4] },
            { text: "Мое сердце бьется быстрее, чем обычно", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [1, 2, 3, 4] },
            { text: "Я устаю без всякой причины", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [1, 2, 3, 4] },
            { text: "Я мыслю так же ясно, как всегда", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [4, 3, 2, 1] }, // Reversed
            { text: "Мне легко делать то, что я умею", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [4, 3, 2, 1] }, // Reversed
            { text: "Чувствую беспокойство и не могу усидеть на месте", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [1, 2, 3, 4] },
            { text: "У меня есть надежды на будущее", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [4, 3, 2, 1] }, // Reversed
            { text: "Я более раздражителен, чем обычно", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [1, 2, 3, 4] },
            { text: "Мне легко принимать решения", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [4, 3, 2, 1] }, // Reversed
            { text: "Я чувствую, что полезен и нужен", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [4, 3, 2, 1] }, // Reversed
            { text: "Я живу достаточно полной жизнью", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [4, 3, 2, 1] }, // Reversed
            { text: "Я чувствую, что другим людям станет лучше, если я умру", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [1, 2, 3, 4] },
            { text: "Меня до сих пор радует то, что радовало всегда", options: ["Никогда или редко", "Иногда", "Часто", "Постоянно или почти постоянно"], points: [4, 3, 2, 1] }, // Reversed
        ],
        calculate: (answers: number[]) => {
            const total = answers.reduce((sum, val) => sum + val, 0);
            return { total };
        },
        interpret: (scores: Record<string, number>) => {
            const score = scores.total;
            let interpretation = "Состояние без депрессии.";
            if (score <= 49) {
                interpretation = "Нормальное состояние, депрессия отсутствует.";
            } else if (score >= 50 && score <= 59) {
                interpretation = "Легкая депрессия ситуативного или невротического генеза.";
            } else if (score >= 60 && score <= 69) {
                interpretation = "Субдепрессивное состояние или маскированная депрессия.";
            } else if (score >= 70) {
                interpretation = "Истинное депрессивное состояние (тяжелая депрессия).";
            }
            return { depression_level: interpretation };
        },
    },
};

// --- UI COMPONENTS ---
const Card: React.FC<{ children?: React.ReactNode; className?: string; onClick?: () => void; }> = ({ children, className, onClick }) => {
  return React.createElement('div', { onClick, className: `bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 ${className || ''}` }, children);
};

const Button: React.FC<{ onClick?: () => void; children?: React.ReactNode; className?: string; type?: 'button' | 'submit', disabled?: boolean }> = ({ onClick, children, className, type = 'button', disabled }) => {
  return React.createElement('button', { type, onClick, disabled, className: `bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-colors duration-200 ${className || ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}` }, children);
};

const AppHeader: React.FC<{ title: string; onBack?: () => void }> = ({ title, onBack }) => {
  return React.createElement('header', { className: "bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center" },
    onBack && React.createElement('button', { onClick: onBack, className: "mr-4 text-gray-600 dark:text-gray-300 hover:text-primary-600" }, React.createElement(ChevronLeftIcon)),
    React.createElement('h1', { className: "text-xl font-bold text-gray-800 dark:text-gray-200" }, title)
  );
};

// --- SCREENS ---
const HomeScreen: React.FC<{ setScreen: (screen: ScreenState) => void }> = ({ setScreen }) => {
  return React.createElement('div', null,
    React.createElement(AppHeader, { title: "PsychoSuite" }),
    React.createElement('main', { className: "p-4 grid grid-cols-1 md:grid-cols-2 gap-4" },
      React.createElement(Card, { className: "cursor-pointer hover:shadow-lg transition-shadow", onClick: () => setScreen({ name: 'clientList' }) },
        React.createElement(UsersIcon),
        React.createElement('h2', { className: "text-lg font-bold mt-2" }, "Клиенты"),
        React.createElement('p', { className: "text-gray-600 dark:text-gray-400" }, "Просмотр и управление базой клиентов")
      ),
      React.createElement(Card, { className: "cursor-pointer hover:shadow-lg transition-shadow", onClick: () => setScreen({ name: 'settings' }) },
        React.createElement(SettingsIcon),
        React.createElement('h2', { className: "text-lg font-bold mt-2" }, "Настройки"),
        React.createElement('p', { className: "text-gray-600 dark:text-gray-400" }, "Импорт и экспорт данных")
      )
    )
  );
};

const ClientListScreen: React.FC<{
  clients: Client[];
  setScreen: (screen: ScreenState) => void;
}> = ({ clients, setScreen }) => {
  return React.createElement('div', null,
    React.createElement(AppHeader, { title: "Список клиентов", onBack: () => setScreen({ name: 'home' }) }),
    React.createElement('main', { className: "p-4" },
      React.createElement(Button, { onClick: () => setScreen({ name: 'clientForm', clientId: null }), className: "mb-4 flex items-center" },
        React.createElement(PlusIcon, { className: "mr-2" }), "Добавить клиента"
      ),
      React.createElement('div', { className: "space-y-2" },
        clients.length > 0 ? clients.map(client =>
          React.createElement(Card, {
            key: client.id,
            className: "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700",
            onClick: () => setScreen({ name: 'clientDetail', clientId: client.id })
          },
            React.createElement('h3', { className: "font-bold text-lg" }, client.name),
            React.createElement('p', { className: "text-sm text-gray-500" }, `Дата рождения: ${formatDate(client.birthDate)}`)
          )
        ) : React.createElement('p', null, "Список клиентов пуст.")
      )
    )
  );
};

const ClientForm: React.FC<{
  clients: Client[];
  setClients: (clients: Client[]) => void;
  setScreen: (screen: ScreenState) => void;
  clientId?: string | null;
}> = ({ clients, setClients, setScreen, clientId }) => {
  const client = clientId ? clients.find(c => c.id === clientId) : null;
  const [name, setName] = useState(client?.name || '');
  const [birthDate, setBirthDate] = useState(client?.birthDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (client) {
      setClients(clients.map(c => c.id === clientId ? { ...c, name, birthDate } : c));
    } else {
      setClients([...clients, { id: Date.now().toString(), name, birthDate }]);
    }
    setScreen({ name: 'clientList' });
  };

  return React.createElement('div', null,
    React.createElement(AppHeader, { title: client ? "Редактировать клиента" : "Новый клиент", onBack: () => setScreen({ name: 'clientList' }) }),
    React.createElement('main', { className: "p-4" },
      React.createElement('form', { onSubmit: handleSubmit, className: "space-y-4" },
        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'name', className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "ФИО"),
          React.createElement('input', {
            type: 'text', id: 'name', value: name, onChange: e => setName(e.target.value),
            required: true, className: "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { htmlFor: 'birthDate', className: "block text-sm font-medium text-gray-700 dark:text-gray-300" }, "Дата рождения"),
          React.createElement('input', {
            type: 'date', id: 'birthDate', value: birthDate, onChange: e => setBirthDate(e.target.value),
            required: true, className: "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          })
        ),
        React.createElement(Button, { type: 'submit' }, "Сохранить")
      )
    )
  );
};

const ClientDetailScreen: React.FC<{
  setScreen: (screen: ScreenState) => void;
  clientId: string;
  clients: Client[];
  testResults: TestResult[];
  reports: Report[];
}> = ({ setScreen, clientId, clients, testResults, reports }) => {
    const client = clients.find(c => c.id === clientId);
    const clientTestResults = testResults.filter(tr => tr.clientId === clientId);
    const clientReports = reports.filter(r => r.clientId === clientId);

    if (!client) {
        return React.createElement('div', null, 'Клиент не найден.');
    }

    return React.createElement('div', null,
        React.createElement(AppHeader, { title: client.name, onBack: () => setScreen({ name: 'clientList' }) }),
        React.createElement('main', { className: "p-4 space-y-6" },
            React.createElement(Card, null,
                React.createElement('h2', { className: "text-lg font-bold mb-2" }, "Информация о клиенте"),
                React.createElement('p', null, `Дата рождения: ${formatDate(client.birthDate)}`),
                React.createElement(Button, { onClick: () => setScreen({ name: 'clientForm', clientId: client.id }), className: "mt-4 text-sm" }, "Редактировать")
            ),
            React.createElement(Card, null,
                React.createElement('h2', { className: "text-lg font-bold mb-2" }, "Начать новое обследование"),
                React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" },
                    Object.keys(TESTS).map(key =>
                        React.createElement(Button, {
                            key: key,
                            onClick: () => setScreen({ name: 'test', clientId: client.id, testKey: key }),
                            className: "w-full text-center"
                        }, TESTS[key as keyof typeof TESTS].name)
                    )
                )
            ),
             React.createElement(Card, null,
                React.createElement('h2', { className: "text-lg font-bold mb-4" }, "История обследований"),
                React.createElement('div', { className: "space-y-2" },
                    clientTestResults.length > 0 ? clientTestResults.map(tr =>
                        React.createElement('div', {
                            key: tr.id,
                            className: "p-3 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600",
                            onClick: () => setScreen({ name: 'testResult', resultId: tr.id })
                        },
                            React.createElement('p', { className: "font-semibold" }, TESTS[tr.testKey as keyof typeof TESTS].name),
                            React.createElement('p', { className: "text-sm text-gray-500" }, `Дата: ${formatDate(tr.date)}`)
                        )
                    ) : React.createElement('p', null, "Нет пройденных тестов.")
                )
            ),
             React.createElement(Card, null,
                React.createElement('h2', { className: "text-lg font-bold mb-4" }, "Сводные отчеты"),
                React.createElement(Button, { onClick: () => setScreen({ name: 'report', clientId: client.id }), className: "mb-4" }, "Создать новый сводный отчет"),
                 React.createElement('div', { className: "space-y-2" },
                    clientReports.length > 0 ? clientReports.map(report =>
                        React.createElement('div', {
                            key: report.id,
                            className: "p-3 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600",
                             onClick: () => setScreen({ name: 'report', clientId: client.id, reportId: report.id })
                        },
                            React.createElement('p', { className: "font-semibold" }, `Отчет от ${formatDate(report.date)}`),
                            React.createElement('p', { className: "text-sm text-gray-500" }, `Тестов в отчете: ${report.testResultIds.length}`)
                        )
                    ) : React.createElement('p', null, "Нет сохраненных отчетов.")
                )
            )
        )
    );
};

const TestScreen: React.FC<{
  setScreen: (screen: ScreenState) => void;
  clientId: string;
  testKey: string;
  testResults: TestResult[];
  setTestResults: (results: TestResult[]) => void;
}> = ({ setScreen, clientId, testKey, testResults, setTestResults }) => {
  const test = TESTS[testKey as keyof typeof TESTS];
  const [answers, setAnswers] = useState(Array(test.questions.length).fill(null));

  const handleAnswer = (qIndex: number, pIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = test.questions[qIndex].points[pIndex];
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const scores = test.calculate(answers.map(a => a ?? 0));
    const interpretation = test.interpret(scores);
    const newResult: TestResult = {
      id: Date.now().toString(),
      clientId,
      testKey,
      date: new Date().toISOString(),
      answers,
      scores,
      interpretation
    };
    setTestResults([...testResults, newResult]);
    setScreen({ name: 'testResult', resultId: newResult.id });
  };

  const isComplete = answers.every(a => a !== null);

  return React.createElement('div', null,
    React.createElement(AppHeader, { title: test.name, onBack: () => setScreen({ name: 'clientDetail', clientId }) }),
    React.createElement('main', { className: "p-4" },
      React.createElement('div', { className: "space-y-6" },
        test.questions.map((q, qIndex) =>
          React.createElement(Card, { key: qIndex },
            React.createElement('p', { className: "font-semibold mb-3" }, `${qIndex + 1}. ${q.text}`),
            React.createElement('div', { className: "flex flex-wrap gap-2" },
              q.options.map((opt, pIndex) =>
                React.createElement('button', {
                  key: pIndex,
                  onClick: () => handleAnswer(qIndex, pIndex),
                  className: `px-3 py-1.5 text-sm rounded-md border transition-colors ${answers[qIndex] === test.questions[qIndex].points[pIndex] ? 'bg-primary-600 text-white border-primary-600' : 'bg-transparent border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`
                }, opt)
              )
            )
          )
        ),
        React.createElement(Button, { onClick: handleSubmit, disabled: !isComplete }, "Завершить тест и посмотреть результаты")
      )
    )
  );
};

const TestResultScreen: React.FC<{
    setScreen: (screen: ScreenState) => void;
    resultId: string;
    clients: Client[];
    testResults: TestResult[];
    setTestResults: (results: TestResult[]) => void;
}> = ({ setScreen, resultId, clients, testResults, setTestResults }) => {
    const result = testResults.find(tr => tr.id === resultId);
    const [isLoading, setIsLoading] = useState(false);

    if (!result) {
        return React.createElement('div', null, 'Результат теста не найден.');
    }

    const client = clients.find(c => c.id === result.clientId);
    const test = TESTS[result.testKey as keyof typeof TESTS];

    const getAIInterpretation = async () => {
        if (!aiService.isAvailable()) {
            alert("Сервис AI недоступен. Проверьте ключ API в файле config.js.");
            return;
        }
        setIsLoading(true);
        try {
            const standardInterpretationText = Object.entries(result.interpretation)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
            const interpretation = await aiService.getTestInterpretation(test.name, result.scores, standardInterpretationText);
            const updatedResults = testResults.map(tr => tr.id === resultId ? { ...tr, aiInterpretation: interpretation } : tr);
            setTestResults(updatedResults);
        } catch (error) {
            console.error(error);
            alert("Произошла ошибка при получении интерпретации от AI.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const generateTxtReport = () => {
        let reportText = `ПРОТОКОЛ ОБСЛЕДОВАНИЯ\n=========================\n\n`;
        reportText += `Клиент: ${client?.name || 'N/A'}\n`;
        reportText += `Дата рождения: ${formatDate(client?.birthDate || '')}\n\n`;
        reportText += `Тест: ${test.name}\n`;
        reportText += `Дата проведения: ${formatDate(result.date)}\n\n`;
        reportText += `ОТВЕТЫ\n-------------------------\n`;
        test.questions.forEach((q, index) => {
            const answerIndex = q.points.indexOf(result.answers[index]);
            const answerText = answerIndex !== -1 ? q.options[answerIndex] : "Нет ответа";
            reportText += `${index + 1}. ${q.text}: ${answerText} (${result.answers[index]} балл(ов))\n`;
        });
        reportText += `\nИТОГОВЫЕ РЕЗУЛЬТАТЫ\n-------------------------\n`;
        Object.entries(result.scores).forEach(([key, value]) => {
            reportText += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
        });
        reportText += `\nСтандартная интерпретация:\n`;
        Object.values(result.interpretation).forEach(value => {
            reportText += `- ${value}\n`;
        });
        if (result.aiInterpretation) {
            reportText += `\nAI ИНТЕРПРЕТАЦИЯ\n-------------------------\n`;
            reportText += result.aiInterpretation;
        }
        
        downloadAsTxt(`Протокол_${client?.name}_${test.name}_${formatDate(result.date)}.txt`, reportText);
    };

    return React.createElement('div', null,
        React.createElement(AppHeader, { title: "Результаты теста", onBack: () => setScreen({ name: 'clientDetail', clientId: result.clientId }) }),
        React.createElement('main', { className: "p-4 space-y-6" },
            React.createElement('div', { className: "flex justify-end" },
                React.createElement(Button, { onClick: generateTxtReport, className: "flex items-center" }, React.createElement(SaveIcon), "Сохранить протокол (.txt)")
            ),
            React.createElement(Card, null,
                React.createElement('h2', { className: "text-lg font-bold mb-4" }, "Протокол обследования"),
                React.createElement('div', { className: "grid grid-cols-2 gap-4 mb-6" },
                    React.createElement('div', null, React.createElement('p', {className: "text-sm text-gray-500"}, "Клиент"), React.createElement('p', {className: "font-semibold"}, client?.name)),
                    React.createElement('div', null, React.createElement('p', {className: "text-sm text-gray-500"}, "Дата рождения"), React.createElement('p', {className: "font-semibold"}, formatDate(client?.birthDate || ''))),
                    React.createElement('div', null, React.createElement('p', {className: "text-sm text-gray-500"}, "Тест"), React.createElement('p', {className: "font-semibold"}, test.name)),
                    React.createElement('div', null, React.createElement('p', {className: "text-sm text-gray-500"}, "Дата проведения"), React.createElement('p', {className: "font-semibold"}, formatDate(result.date)))
                ),
                React.createElement('h3', { className: "text-md font-bold mb-2 border-t pt-4" }, "Итоговые результаты"),
                 React.createElement('div', { className: "flex items-start gap-8" },
                    React.createElement('div', { className: "flex gap-4" },
                      Object.entries(result.scores).map(([key, value]) =>
                          React.createElement('div', { key: key, className: "text-center" },
                              React.createElement('p', { className: "text-3xl font-bold text-primary-600" }, value),
                              React.createElement('p', { className: "text-sm text-gray-500" }, key)
                          )
                      )
                    ),
                    React.createElement('div', null,
                        React.createElement('h4', { className: "font-semibold mb-1" }, "Стандартная интерпретация:"),
                        React.createElement('ul', { className: "list-disc list-inside space-y-1" },
                            Object.values(result.interpretation).map((inter, index) => React.createElement('li', { key: index }, inter))
                        )
                    )
                )
            ),
            React.createElement(Card, null,
                React.createElement('h3', { className: "text-md font-bold mb-2" }, "AI Интерпретация"),
                result.aiInterpretation ? React.createElement('div', { className: "whitespace-pre-wrap p-2 bg-gray-50 dark:bg-gray-700 rounded" }, result.aiInterpretation)
                    : (
                        React.createElement('div', null,
                            !aiService.isAvailable() && React.createElement('p', { className: "text-yellow-600 dark:text-yellow-400" }, "Сервис AI недоступен. Проверьте ключ API в файле config.js."),
                            aiService.isAvailable() && React.createElement(Button, { onClick: getAIInterpretation, disabled: isLoading }, isLoading ? "Генерация..." : "Получить расширенную интерпретацию")
                        )
                    )
            )
        )
    );
};

const ReportScreen: React.FC<{
  setScreen: (screen: ScreenState) => void;
  clientId: string;
  reportId?: string;
  clients: Client[];
  testResults: TestResult[];
  reports: Report[];
  setReports: (reports: Report[]) => void;
}> = ({ setScreen, clientId, reportId, clients, testResults, reports, setReports }) => {
    const client = clients.find(c => c.id === clientId);
    const clientTestResults = testResults.filter(tr => tr.clientId === clientId);
    const existingReport = reportId ? reports.find(r => r.id === reportId) : null;

    const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set(existingReport?.testResultIds || []));
    const [consolidatedReport, setConsolidatedReport] = useState<string | null>(existingReport?.summary || null);
    const [isLoading, setIsLoading] = useState(false);
    const [localReports, setLocalReports] = useState(reports.filter(r => r.clientId === clientId));


    const handleTestSelect = (testId: string) => {
        const newSelection = new Set(selectedTestIds);
        if (newSelection.has(testId)) {
            newSelection.delete(testId);
        } else {
            newSelection.add(testId);
        }
        setSelectedTestIds(newSelection);
    };
    
    const generateConsolidatedReport = async () => {
        if (!aiService.isAvailable() || selectedTestIds.size === 0) return;
        
        setIsLoading(true);
        try {
            if (!client) throw new Error("Client not found for report generation");
            const resultsToAnalyze = clientTestResults.filter(tr => selectedTestIds.has(tr.id));
            const analysis = await aiService.getConsolidatedInterpretation(client, resultsToAnalyze);
            setConsolidatedReport(analysis);

            const newReport: Report = {
                id: existingReport?.id || Date.now().toString(),
                clientId,
                date: new Date().toISOString(),
                testResultIds: Array.from(selectedTestIds),
                summary: analysis,
            };
            
            const otherReports = reports.filter(r => r.id !== newReport.id);
            const updatedReports = [...otherReports, newReport];
            setReports(updatedReports);
            setLocalReports(updatedReports.filter(r => r.clientId === clientId));


        } catch (error) {
            console.error(error);
            alert("Ошибка при генерации сводного отчета.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const generateTxtReport = () => {
        if (selectedTestIds.size === 0) return;
        const selectedResults = clientTestResults.filter(tr => selectedTestIds.has(tr.id));
        
        let reportText = `СВОДНЫЙ ОТЧЕТ\n=========================\n\n`;
        reportText += `Клиент: ${client?.name || 'N/A'}\n`;
        reportText += `Дата рождения: ${formatDate(client?.birthDate || '')}\n\n`;
        reportText += `ОСНОВАНО НА СЛЕДУЮЩИХ ТЕСТАХ:\n-------------------------\n`;
        selectedResults.forEach(tr => {
            const test = TESTS[tr.testKey as keyof typeof TESTS];
            reportText += `- ${test.name} (от ${formatDate(tr.date)})\n`;
            reportText += `  Баллы: ${JSON.stringify(tr.scores)}\n`;
            reportText += `  Интерпретация: ${Object.values(tr.interpretation).join(' ')}\n`;
        });
        
        if(consolidatedReport) {
            reportText += `\n\nСВОДНЫЙ АНАЛИЗ (AI)\n=========================\n`;
            reportText += consolidatedReport;
        }

        downloadAsTxt(`Сводный_отчет_${client?.name}_${formatDate(new Date().toISOString())}.txt`, reportText);
    };
    
     const loadReport = (report: Report) => {
        setSelectedTestIds(new Set(report.testResultIds));
        setConsolidatedReport(report.summary);
    };

    if (!client) return React.createElement('div', null, 'Клиент не найден.');

    const selectedResults = clientTestResults.filter(tr => selectedTestIds.has(tr.id));

    return React.createElement('div', null,
        React.createElement(AppHeader, { title: "Сводный отчет", onBack: () => setScreen({ name: 'clientDetail', clientId }) }),
        React.createElement('main', { className: "p-4 grid grid-cols-1 lg:grid-cols-3 gap-6" },
            React.createElement('div', { className: "lg:col-span-1 space-y-4" },
                React.createElement(Card, null,
                   React.createElement('h3', { className: "font-bold mb-2" }, "1. Выберите тесты"),
                   React.createElement('div', { className: "space-y-2 max-h-60 overflow-y-auto" },
                        clientTestResults.map(tr =>
                            React.createElement('div', {
                                key: tr.id,
                                onClick: () => handleTestSelect(tr.id),
                                className: `p-2 rounded cursor-pointer border ${selectedTestIds.has(tr.id) ? 'bg-primary-100 dark:bg-primary-900 border-primary-500' : 'bg-gray-50 dark:bg-gray-700'}`
                            },
                                React.createElement('p', {className: "font-semibold"}, TESTS[tr.testKey as keyof typeof TESTS].name),
                                React.createElement('p', {className: "text-sm"}, formatDate(tr.date))
                           )
                        )
                   )
                ),
                 React.createElement(Card, null,
                   React.createElement('h3', { className: "font-bold mb-2" }, "2. Сгенерируйте анализ (AI)"),
                    React.createElement(Button, { onClick: generateConsolidatedReport, disabled: isLoading || selectedTestIds.size === 0 || !aiService.isAvailable() }, isLoading ? "Генерация..." : "Создать/обновить сводный анализ"),
                     !aiService.isAvailable() && React.createElement('p', { className: "text-xs text-yellow-600 mt-2" }, "Сервис AI недоступен. Проверьте ключ API в файле config.js.")
                ),
                React.createElement(Card, null,
                   React.createElement('h3', { className: "font-bold mb-2" }, "Сохраненные сводные отчеты"),
                   React.createElement('div', { className: "space-y-2 max-h-60 overflow-y-auto" },
                        localReports.length > 0 ? localReports.map(report =>
                           React.createElement('div', {
                               key: report.id,
                               onClick: () => loadReport(report),
                               className: "p-2 rounded cursor-pointer bg-gray-50 dark:bg-gray-700"
                           },
                               `Отчет от ${formatDate(report.date)}`
                           )
                        ) : React.createElement('p', {className: "text-sm"}, "Нет отчетов.")
                   )
                )
            ),
             React.createElement('div', { className: "lg:col-span-2 space-y-4" },
                React.createElement('div', {className: "flex justify-end"},
                    React.createElement(Button, { onClick: generateTxtReport, disabled: selectedTestIds.size === 0 }, React.createElement(SaveIcon), "Сохранить отчет (.txt)")
                ),
                React.createElement(Card, null,
                   React.createElement('h3', { className: "font-bold mb-2" }, "Краткая сводка по выбранным тестам"),
                   selectedResults.length > 0 ? React.createElement('ul', { className: "space-y-2" },
                       selectedResults.map(tr =>
                           React.createElement('li', { key: tr.id },
                               React.createElement('strong', null, TESTS[tr.testKey as keyof typeof TESTS].name),
                               React.createElement('span', { className: "text-sm text-gray-500" }, ` (${formatDate(tr.date)})`),
                               React.createElement('p', { className: "text-sm pl-2" }, `Баллы: ${JSON.stringify(tr.scores)}`),
                               React.createElement('p', { className: "text-sm pl-2" }, `Интерпретация: ${Object.values(tr.interpretation).join(' ')}`)
                           )
                       )
                   ) : React.createElement('p', null, "Выберите тесты для отображения сводки.")
                ),
                 React.createElement(Card, null,
                   React.createElement('h3', { className: "font-bold mb-2" }, "Сводный анализ (AI)"),
                    consolidatedReport ? React.createElement('div', { className: "whitespace-pre-wrap p-2 bg-gray-50 dark:bg-gray-700 rounded" }, consolidatedReport) : React.createElement('p', null, "Сгенерируйте анализ для просмотра.")
                )
             )
        )
    );
};

const SettingsScreen: React.FC<{
  setScreen: (screen: ScreenState) => void;
  setData: (data: any) => void;
}> = ({ setScreen, setData }) => {

    const handleExport = () => {
        const data = {
            clients: JSON.parse(localStorage.getItem('clients') || '[]'),
            testResults: JSON.parse(localStorage.getItem('testResults') || '[]'),
            reports: JSON.parse(localStorage.getItem('reports') || '[]'),
        };
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `psychosuite_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text === 'string') {
                        const importedData = JSON.parse(text);
                        if (importedData.clients && importedData.testResults && importedData.reports) {
                            setData(importedData);
                            alert('Данные успешно импортированы!');
                            setScreen({ name: 'home' });
                        } else {
                            throw new Error('Invalid file structure');
                        }
                    }
                } catch (err) {
                    alert('Ошибка при импорте файла. Убедитесь, что файл имеет правильный формат.');
                }
            };
            reader.readAsText(file);
        }
    };
    
    const importRef = useRef<HTMLInputElement>(null);

    return React.createElement('div', null,
        React.createElement(AppHeader, { title: "Настройки", onBack: () => setScreen({ name: 'home' }) }),
        React.createElement('main', { className: "p-4 space-y-4" },
            React.createElement(Card, null,
                React.createElement('h2', { className: "text-lg font-bold mb-2" }, "Экспорт данных"),
                React.createElement('p', { className: "text-gray-600 dark:text-gray-400 mb-4" }, "Сохранить всю базу клиентов и результатов в один JSON-файл."),
                React.createElement(Button, { onClick: handleExport }, "Экспортировать")
            ),
            React.createElement(Card, null,
                React.createElement('h2', { className: "text-lg font-bold mb-2" }, "Импорт данных"),
                React.createElement('p', { className: "text-gray-600 dark:text-gray-400 mb-4" }, "Загрузить данные из ранее экспортированного JSON-файла. Внимание: это перезапишет все текущие данные!"),
                React.createElement('input', { type: 'file', accept: '.json', onChange: handleImport, className: "hidden", ref: importRef }),
                React.createElement(Button, { onClick: () => importRef.current?.click() }, "Импортировать")
            )
        )
    );
};


// --- MAIN APP COMPONENT ---
const App = () => {
  // Fix: Add explicit type for the screen state to allow for properties beyond 'name'.
  const [screen, setScreen] = useStickyState<ScreenState>({ name: 'home' }, 'screen');
  const [clients, setClients] = useStickyState<Client[]>([], 'clients');
  const [testResults, setTestResults] = useStickyState<TestResult[]>([], 'testResults');
  const [reports, setReports] = useStickyState<Report[]>([], 'reports');

  const setData = (data: { clients: Client[], testResults: TestResult[], reports: Report[] }) => {
      setClients(data.clients);
      setTestResults(data.testResults);
      setReports(data.reports);
  };

  const renderScreen = () => {
    switch (screen.name) {
      case 'home':
        return React.createElement(HomeScreen, { setScreen });
      case 'clientList':
        return React.createElement(ClientListScreen, { clients, setScreen });
      case 'clientForm':
        return React.createElement(ClientForm, { clients, setClients, setScreen, clientId: screen.clientId });
      case 'clientDetail':
        return React.createElement(ClientDetailScreen, { setScreen, clientId: screen.clientId!, clients, testResults, reports });
      case 'test':
        return React.createElement(TestScreen, { setScreen, clientId: screen.clientId!, testKey: screen.testKey!, testResults, setTestResults });
      case 'testResult':
        return React.createElement(TestResultScreen, { setScreen, resultId: screen.resultId!, clients, testResults, setTestResults });
      case 'report':
        return React.createElement(ReportScreen, { setScreen, clientId: screen.clientId!, reportId: screen.reportId, clients, testResults, reports, setReports });
      case 'settings':
        return React.createElement(SettingsScreen, { setScreen, setData });
      default:
        return React.createElement(HomeScreen, { setScreen });
    }
  };

  return React.createElement('div', { className: "min-h-screen bg-gray-100 dark:bg-gray-900" }, renderScreen());
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
// Note: The React application is now handled in index.js for compatibility with the service worker and offline functionality.
// The index.tsx file is preserved for reference and development purposes, but not actively used in the production build.