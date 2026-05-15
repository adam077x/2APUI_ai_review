import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './quiz.entity';
import { GenerateQuizDto, GenerateQuizFromRepoDto } from './dto/create-quiz.dto';
import OpenAI from 'openai';

@Injectable()
export class QuizService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateQuiz(dto: GenerateQuizDto): Promise<Quiz> {
    const enhancedPrompt = `
Jsi expert na code review a učitel programování. Tvým úkolem je ověřit, zda programátor opravdu rozumí kódu, který právě napsal.
Vygeneruj 2 až 4 otázky s výběrem odpovědí (4 možnosti), kde právě jedna odpověď je správná.
Otázky by se měly týkat konkrétních změn v diffu.

Vrať POUZE validní JSON objekt s klíčem "questions", který bude obsahovat pole vygenerovaných otázek. Struktura:
{
  "questions": [
    {
      "question": "Znění otázky",
      "options": ["Možnost 1", "Možnost 2", "Možnost 3", "Možnost 4"],
      "correctAnswerIndex": 0,
      "explanation": "Vysvětlení proč je to správně."
    }
  ]
}

Zde je Git Diff:
${dto.diff}
`;

    const response = await this.openai.chat.completions.create({
      messages: [{ role: 'user', content: enhancedPrompt }],
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
    });

    const resultText = response.choices[0].message.content || '{"questions": []}';
    const parsedData = JSON.parse(resultText);

    const quiz = this.quizRepository.create({
      commitHash: dto.commitHash,
      repositoryName: dto.repositoryName,
      questions: parsedData.questions,
    });

    return this.quizRepository.save(quiz);
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    return this.quizRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getQuizById(id: string): Promise<Quiz | null> {
    return this.quizRepository.findOne({ where: { id } });
  }

  async generateQuizFromRepo(dto: GenerateQuizFromRepoDto): Promise<Quiz> {
    const repoString = dto.repositoryUrl.replace('https://github.com/', '').replace(/\/$/, '');
    const parts = repoString.split('/');

    if (parts.length < 2) {
      throw new BadRequestException('Neplatná URL repozitáře. Zadejte formát ve tvaru "vlastnik/repozitar" nebo URL na GitHub.');
    }

    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1].replace('.git', '');

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new InternalServerErrorException('GITHUB_TOKEN není nastaven v prostředí.');
    }

    const headers = {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Quiz-Generator-App',
    };

    let targetCommitHash = dto.commitSha;

    if (!targetCommitHash) {
      const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers });
      if (!commitsResponse.ok) {
        throw new BadRequestException(`Chyba při načítání commitů: ${commitsResponse.statusText}`);
      }
      const commits = await commitsResponse.json();
      if (!Array.isArray(commits) || commits.length === 0) {
        throw new BadRequestException('Nebyly nalezeny žádné commity.');
      }
      targetCommitHash = commits[0].sha;
    }

    const diffResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${targetCommitHash}`, {
      headers: { ...headers, Accept: 'application/vnd.github.v3.diff' }
    });

    if (!diffResponse.ok) {
      throw new BadRequestException(`Chyba při načítání diffu: ${diffResponse.statusText}`);
    }

    const diff = await diffResponse.text();

    if (!diff) {
      throw new BadRequestException('Diff pro tento commit je prázdný.');
    }

    return this.generateQuiz({
      diff,
      commitHash: targetCommitHash,
      repositoryName: `${owner}/${repo}`,
    });
  }

  async getCommitsFromRepo(url: string): Promise<any[]> {
    const repoString = url.replace('https://github.com/', '').replace(/\/$/, '');
    const parts = repoString.split('/');

    if (parts.length < 2) {
      throw new BadRequestException('Neplatná URL repozitáře.');
    }

    const owner = parts[parts.length - 2];
    const repo = parts[parts.length - 1].replace('.git', '');

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new InternalServerErrorException('GITHUB_TOKEN není nastaven v prostředí.');
    }

    const headers = {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Quiz-Generator-App',
    };

    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, { headers });
    if (!commitsResponse.ok) {
      throw new BadRequestException(`Chyba při načítání commitů: ${commitsResponse.statusText}`);
    }
    const commits = await commitsResponse.json();
    if (!Array.isArray(commits) || commits.length === 0) {
      return [];
    }

    return commits.map((c: any) => ({
      sha: c.sha,
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
    }));
  }
}
