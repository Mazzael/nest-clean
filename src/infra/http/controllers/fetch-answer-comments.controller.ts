import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { FetchAnswerCommentsUseCase } from '@/domain/forum/application/use-cases/fetch-answer-comments'
import { CommentWithAuthorPresenter } from '../presenters/comment-with-author-presenter'
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger'

const pageQueryParamSchema = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .pipe(z.number().min(1))

const queryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

export class CommentsResponse {
  @ApiProperty({ description: 'The ID of the comment', example: '1' })
  commentId!: string

  @ApiProperty({ description: 'The ID of the comment author', example: '1' })
  authorId!: string

  @ApiProperty({
    description: 'The content of the comment',
    example: 'Some comment',
  })
  content!: string

  @ApiProperty({
    description: 'The name of the comment author',
    example: 'John Doe',
  })
  authorName!: string

  @ApiProperty({
    description: 'The creation timestamp of the comment',
    example: new Date(),
  })
  createdAt!: Date

  @ApiProperty({
    description: 'The last update timestamp of the comment',
    example: new Date(),
  })
  updatedAt!: Date
}

@ApiTags('Answers')
@Controller('/answers/:answerId/comments')
export class FetchAnswerCommentsController {
  constructor(private fetchAnswerComments: FetchAnswerCommentsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Fetch comments on an answer' })
  @ApiParam({
    name: 'answerId',
    description: 'The ID of the answer to fetch comments for',
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
    description: 'Comments fetched successfully',
    type: CommentsResponse,
    isArray: true,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async handle(
    @Query('page', queryValidationPipe) page: PageQueryParamSchema,
    @Param('answerId') answerId: string,
  ) {
    const result = await this.fetchAnswerComments.execute({
      page,
      answerId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const comments = result.value.comments

    return { comments: comments.map(CommentWithAuthorPresenter.toHTTP) }
  }
}
