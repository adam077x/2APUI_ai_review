import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class GenerateQuizDto {
  @IsNotEmpty()
  @IsString()
  diff: string;

  @IsOptional()
  @IsString()
  commitHash?: string;

  @IsOptional()
  @IsString()
  repositoryName?: string;
}

export class GenerateQuizFromRepoDto {
  @IsNotEmpty()
  @IsString()
  repositoryUrl: string;

  @IsOptional()
  @IsString()
  commitSha?: string;
}
