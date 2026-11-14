import type { Answer, Submission } from 'shared-types';

export class SubmissionModel implements Submission {
  id: string;
  quizId: string;
  participantName: string;
  answers: Answer[];
  score: number;
  total: number;
  submittedAt: string;

  constructor(data: Submission) {
    this.id = data.id;
    this.quizId = data.quizId;
    this.participantName = data.participantName;
    this.answers = data.answers;
    this.score = data.score;
    this.total = data.total;
    this.submittedAt = data.submittedAt;
  }
}
