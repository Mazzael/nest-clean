import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryQuestionCommentsRepository } from 'test/repositories/in-memory-question-comments-repository'
import { DeleteQuestionCommentUseCase } from './delete-question-comment'
import { makeQuestionComment } from 'test/factories/make-question-comment'
import { NotAllowedError } from './errors/not-allowed-error'

let inMemoryQuestionCommentsRepository: InMemoryQuestionCommentsRepository
let sut: DeleteQuestionCommentUseCase

describe('Delete Question Comment', () => {
  beforeEach(() => {
    inMemoryQuestionCommentsRepository =
      new InMemoryQuestionCommentsRepository()
    sut = new DeleteQuestionCommentUseCase(inMemoryQuestionCommentsRepository)
  })

  it('should be able to delete a question comment', async () => {
    const questionCommentOne = makeQuestionComment()
    await inMemoryQuestionCommentsRepository.create(questionCommentOne)

    const questionCommentToBeDeleted = makeQuestionComment(
      {
        authorId: new UniqueEntityID('author-2'),
      },
      new UniqueEntityID('question-comment-2'),
    )
    inMemoryQuestionCommentsRepository.create(questionCommentToBeDeleted)

    const questionCommentThree = makeQuestionComment()
    inMemoryQuestionCommentsRepository.create(questionCommentThree)

    await sut.execute({
      questionCommentId: 'question-comment-2',
      authorId: 'author-2',
    })

    expect(inMemoryQuestionCommentsRepository.items).toHaveLength(2)
  })

  it('should not be able to delete another user question comment', async () => {
    const questionComment = makeQuestionComment(
      {
        authorId: new UniqueEntityID('author-1'),
      },
      new UniqueEntityID('question-1'),
    )
    inMemoryQuestionCommentsRepository.create(questionComment)

    const result = await sut.execute({
      questionCommentId: 'question-1',
      authorId: 'another-author',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
