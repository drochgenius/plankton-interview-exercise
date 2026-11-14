import type { Choice, Question, Quiz } from 'shared-types';

/** Builds a question whose choices are a, b, c, d in the order given. */
function question(
  id: string,
  text: string,
  choices: [string, string, string, string],
  correct: 'a' | 'b' | 'c' | 'd',
): Question {
  const ids = ['a', 'b', 'c', 'd'];
  return {
    id,
    text,
    choices: choices.map((choiceText, index): Choice => ({ id: ids[index]!, text: choiceText })),
    correctChoiceId: correct,
  };
}

export const quizzes: Quiz[] = [
  {
    id: 'math-practice',
    title: 'Math Practice',
    description: 'Add, subtract, multiply and compare fractions.',
    questions: [
      question('q1', 'What is $34 + 27$?', ['51', '61', '71', '59'], 'b'),
      question('q2', 'What is $83 - 46$?', ['27', '39', '37', '47'], 'c'),
      question('q3', 'What is $7 \\times 8$?', ['54', '56', '63', '49'], 'b'),
      question('q4', 'What is half of $18$?', ['6', '8', '9', '36'], 'c'),
      question(
        'q5',
        'Which is larger, $\\frac{1}{2}$ or $\\frac{1}{4}$?',
        ['$\\frac{1}{4}$', '$\\frac{1}{8}$', 'They are the same size', '$\\frac{1}{2}$'],
        'd',
      ),
    ],
  },
  {
    id: 'english-practice',
    title: 'English Practice',
    description: 'Spelling, plurals, opposites and sentences.',
    questions: [
      question(
        'q1',
        'Which word is spelled correctly?',
        ['freind', 'frend', 'friend', 'frind'],
        'c',
      ),
      question(
        'q2',
        'What is the plural of "child"?',
        ['childs', 'children', 'childen', 'childrens'],
        'b',
      ),
      question('q3', 'What is the opposite of "hot"?', ['cold', 'soft', 'big', 'dry'], 'a'),
      question(
        'q4',
        'Which word is a verb in this sentence: "The dog runs fast."?',
        ['dog', 'The', 'runs', 'fast'],
        'c',
      ),
      question(
        'q5',
        'Which mark goes at the end of this sentence: "How old are you"?',
        ['.', ',', '!', '?'],
        'd',
      ),
    ],
  },
];
