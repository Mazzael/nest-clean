import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryAnswerCommentsRepository } from 'test/repositories/in-memory-answer-comments-repository'
import { DeleteAnswerCommentUseCase } from './delete-answer-comment'
import { makeAnswerComment } from 'test/factories/make-answer-comment'
import { NotAllowedError } from './errors/not-allowed-error'

let inMemoryAnswerCommentsRepository: InMemoryAnswerCommentsRepository
let sut: DeleteAnswerCommentUseCase

describe('Delete Answer Comment', () => {
  beforeEach(() => {
    inMemoryAnswerCommentsRepository = new InMemoryAnswerCommentsRepository()
    sut = new DeleteAnswerCommentUseCase(inMemoryAnswerCommentsRepository)
  })

  it('should be able to delete a answer comment', async () => {
    const answerCommentOne = makeAnswerComment()
    await inMemoryAnswerCommentsRepository.create(answerCommentOne)

    const answerCommentToBeDeleted = makeAnswerComment(
      {
        authorId: new UniqueEntityID('author-2'),
      },
      new UniqueEntityID('answer-comment-2'),
    )
    inMemoryAnswerCommentsRepository.create(answerCommentToBeDeleted)

    const answerCommentThree = makeAnswerComment()
    inMemoryAnswerCommentsRepository.create(answerCommentThree)

    await sut.execute({
      answerCommentId: 'answer-comment-2',
      authorId: 'author-2',
    })

    expect(inMemoryAnswerCommentsRepository.items).toHaveLength(2)
  })

  it('should not be able to delete another user answer comment', async () => {
    const answerComment = makeAnswerComment(
      {
        authorId: new UniqueEntityID('author-1'),
      },
      new UniqueEntityID('answer-1'),
    )
    inMemoryAnswerCommentsRepository.create(answerComment)

    const result = await sut.execute({
      answerCommentId: 'answer-1',
      authorId: 'another-author',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
