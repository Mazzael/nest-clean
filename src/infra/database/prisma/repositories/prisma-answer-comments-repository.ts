import { PaginationParams } from '@/core/repositories/pagination-params'
import { AnswerCommentsRepository } from '@/domain/forum/application/repositories/answer-comments-repository'
import { AnswerComment } from '@/domain/forum/enterprise/entities/answer-comment'
import { Injectable } from '@nestjs/common'
import { PrismaAnswerCommentMapper } from '../mappers/prisma-answer-comment-mapaper'
import { PrismaService } from '../prisma.service'

@Injectable()
export class PrismaAnswerCommentsRepository
  implements AnswerCommentsRepository
{
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const answerComment = await this.prisma.comment.findUnique({
      where: {
        id,
      },
    })

    if (!answerComment) {
      return null
    }

    return PrismaAnswerCommentMapper.toDomain(answerComment)
  }

  async findManyByAnswerId(answerId: string, { page }: PaginationParams) {
    const answerComments = await this.prisma.comment.findMany({
      where: {
        answerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 1,
    })

    return answerComments.map((answerComments) => {
      return PrismaAnswerCommentMapper.toDomain(answerComments)
    })
  }

  async create(answerComment: AnswerComment) {
    const data = PrismaAnswerCommentMapper.toPrisma(answerComment)

    await this.prisma.comment.create({
      data,
    })
  }

  async delete(answerComment: AnswerComment) {
    const data = PrismaAnswerCommentMapper.toPrisma(answerComment)

    await this.prisma.comment.delete({
      where: {
        id: data.id,
      },
    })
  }
}
