import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Put,
} from '@nestjs/common'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { EditQuestionUseCase } from '@/domain/forum/application/use-cases/edit-question'
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

const editQuestionBodySchema = z.object({
  title: z.string(),
  content: z.string(),
  attachments: z.array(z.string().uuid()),
})

class EditQuestionBodySchema {
  @ApiProperty({ description: 'The new title of the question' })
  title!: string

  @ApiProperty({ description: 'The new content of the question' })
  content!: string

  @ApiProperty({
    type: [String],
    description: 'An array of attachment IDs (UUIDs)',
    format: 'uuid',
    isArray: true,
  })
  attachments!: string[]
}

const bodyValidationPipe = new ZodValidationPipe(editQuestionBodySchema)

@ApiTags('Questions')
@Controller('/questions/:id')
export class EditQuestionController {
  constructor(private editQuestion: EditQuestionUseCase) {}

  @Put()
  @HttpCode(204)
  @ApiOperation({ summary: 'Edit a question' })
  @ApiParam({ name: 'id', description: 'The ID of the question to edit' })
  @ApiBody({ type: EditQuestionBodySchema })
  @ApiResponse({ status: 204, description: 'Question edited successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async handle(
    @Body(bodyValidationPipe) body: EditQuestionBodySchema,
    @CurrentUser() user: UserPayload,
    @Param('id') questionId: string,
  ) {
    const { title, content, attachments } = body
    const userId = user.sub

    const result = await this.editQuestion.execute({
      authorId: userId,
      title,
      content,
      attachmentsIds: attachments,
      questionId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
