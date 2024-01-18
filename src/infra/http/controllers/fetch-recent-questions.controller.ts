import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { FetchRecentQuestionsUseCase } from '@/domain/forum/application/use-cases/fetch-recent-questions'
import { QuestionPresenter } from '../presenters/question-presenter'
import {
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

class QuestionsResponse {
  @ApiProperty({ description: 'The ID of the question', example: '1' })
  id!: string

  @ApiProperty({
    description: 'The title of the question',
    example: 'Question Title',
  })
  title!: string

  @ApiProperty({
    description: 'The slug of the question',
    example: 'question-title',
  })
  slug!: string

  @ApiProperty({ description: 'The best answer of the question', example: '1' })
  bestAnswerId!: string

  @ApiProperty({
    description: 'The creation timestamp of the question',
    example: new Date(),
  })
  createdAt!: Date

  @ApiProperty({
    description: 'The last update timestamp of the question',
    example: new Date(),
  })
  updatedAt!: Date
}

@ApiTags('Questions')
@Controller('/questions')
export class FetchRecentQuestionsController {
  constructor(private fetchRecentQuestions: FetchRecentQuestionsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Fetch recent questions' })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: 'Page number (default: 1)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent questions fetched successfully',
    type: QuestionsResponse,
    isArray: true,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async handle(@Query('page', queryValidationPipe) page: PageQueryParamSchema) {
    const result = await this.fetchRecentQuestions.execute({
      page,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const questions = result.value.questions

    return { questions: questions.map(QuestionPresenter.toHTTP) }
  }
}
