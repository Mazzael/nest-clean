import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { FetchQuestionAnswersUseCase } from '@/domain/forum/application/use-cases/fetch-question-answers'
import { AnswerPresenter } from '../presenters/answer-presenter'
import {
  ApiOperation,
  ApiParam,
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

class QuestionAnswersResponse {
  @ApiProperty({ description: 'The ID of the answer', example: '1' })
  id!: string

  @ApiProperty({
    description: 'The content of the answer',
    example: 'Question answer',
  })
  content!: string

  @ApiProperty({
    description: 'The creation timestamp of the answer',
    example: new Date(),
  })
  createdAt!: Date

  @ApiProperty({
    description: 'The last update timestamp of the answer',
    example: new Date(),
  })
  updatedAt!: Date
}

@ApiTags('Questions')
@Controller('/questions/:questionId/answers')
export class FetchQuestionAnswersController {
  constructor(private fetchQuestionAnswers: FetchQuestionAnswersUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Fetch answers on a question' })
  @ApiParam({
    name: 'questionId',
    description: 'The ID of the question to fetch answers for',
    example: '1',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: 'Page number (default: 1)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Answers fetched successfully',
    type: QuestionAnswersResponse,
    isArray: true,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async handle(
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
    @Param('questionId') questionId: string,
  ) {
    const result = await this.fetchQuestionAnswers.execute({
      page,
      questionId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const answers = result.value.answers

    return { answers: answers.map(AnswerPresenter.toHTTP) }
  }
}
