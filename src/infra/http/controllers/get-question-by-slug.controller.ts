import { BadRequestException, Controller, Get, Param } from '@nestjs/common'
import { GetQuestionBySlugUseCase } from '@/domain/forum/application/use-cases/get-question-by-slug'
import { QuestionDetailsPresenter } from '../presenters/question-details-presenter'
import {
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

class AttachmentsResponse {
  @ApiProperty({ description: 'The ID of the attachment', example: '1' })
  id!: string

  @ApiProperty({
    description: 'The title of the attachment',
    example: 'Attachment Title',
  })
  title!: string

  @ApiProperty({
    description: 'The url of the attachment',
    example: 'attachmentURL',
  })
  url!: string
}
class QuestionBySlugResponse {
  @ApiProperty({ description: 'The ID of the question', example: '1' })
  questionId!: string

  @ApiProperty({
    description: 'The ID of the author of the question',
    example: '1',
  })
  authorId!: string

  @ApiProperty({ description: 'The author name', example: 'John Doe' })
  author!: string

  @ApiProperty({
    description: 'The title of the question',
    example: 'Question Title',
  })
  title!: string

  @ApiProperty({
    description: 'The content of the question',
    example: 'Question content',
  })
  content!: string

  @ApiProperty({
    description: 'The slug of the question',
    example: 'question-title',
  })
  slug!: string

  @ApiProperty({
    description: 'The best answer ID of the question',
    example: '1',
  })
  bestAnswerId!: string

  @ApiProperty({
    description: 'The attachments of the question',
    type: AttachmentsResponse,
    isArray: true,
  })
  attachments!: object[]

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
@Controller('/questions/:slug')
export class GetQuestionBySlugController {
  constructor(private getQuestionBySlug: GetQuestionBySlugUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Get question by slug' })
  @ApiParam({
    name: 'slug',
    description: 'The slug of the question to retrieve',
    example: 'question-title',
  })
  @ApiResponse({
    status: 200,
    description: 'Question retrieved successfully',
    type: QuestionBySlugResponse,
    isArray: true,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async handle(@Param('slug') slug: string) {
    const result = await this.getQuestionBySlug.execute({
      slug,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return { question: QuestionDetailsPresenter.toHTTP(result.value.question) }
  }
}
