import { Controller, Post, Body, Get, Param, NotFoundException, Query, BadRequestException } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { GenerateQuizDto, GenerateQuizFromRepoDto } from './dto/create-quiz.dto';

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('generate')
  async generate(@Body() body: GenerateQuizDto) {
    return this.quizService.generateQuiz(body);
  }

  @Post('generate-from-repo')
  async generateFromRepo(@Body() body: GenerateQuizFromRepoDto) {
    return this.quizService.generateQuizFromRepo(body);
  }

  @Get()
  async getAll() {
    return this.quizService.getAllQuizzes();
  }

  @Get('repo-commits')
  async getRepoCommits(@Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('Chybí parametr url');
    }
    return this.quizService.getCommitsFromRepo(url);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const quiz = await this.quizService.getQuizById(id);
    if (!quiz) {
      throw new NotFoundException('Kvíz nebyl nalezen');
    }
    return quiz;
  }
}
