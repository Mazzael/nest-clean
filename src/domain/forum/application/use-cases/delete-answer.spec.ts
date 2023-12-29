import { InMemoryAnswersRepository } from 'test/repositories/in-memory-answers-repository'
import { DeleteAnswerUseCase } from './delete-answer'
import { makeAnswer } from 'test/factories/make-answer'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from './errors/not-allowed-error'
import { InMemoryAnswerAttachmentsRepository } from 'test/repositories/in-memory-answer-attachments-repository'
import { makeAnswerAttachment } from 'test/factories/make-answer-attachment'

let inMemoryAnswersRepository: InMemoryAnswersRepository
let inMemoryAnswerAttachmentsRepository: InMemoryAnswerAttachmentsRepository
let sut: DeleteAnswerUseCase

describe('Delete Answer', () => {
  beforeEach(() => {
    inMemoryAnswerAttachmentsRepository =
      new InMemoryAnswerAttachmentsRepository()
    inMemoryAnswersRepository = new InMemoryAnswersRepository(
      inMemoryAnswerAttachmentsRepository,
    )
    sut = new DeleteAnswerUseCase(inMemoryAnswersRepository)
  })

  it('should be able to delete a answer', async () => {
    const answerOne = makeAnswer()
    await inMemoryAnswersRepository.create(answerOne)

    const answerToBeDeleted = makeAnswer(
      {
        authorId: new UniqueEntityID('author-2'),
      },
      new UniqueEntityID('answer-2'),
    )
    await inMemoryAnswersRepository.create(answerToBeDeleted)

    inMemoryAnswerAttachmentsRepository.items.push(
      makeAnswerAttachment({
        answerId: answerToBeDeleted.id,
        attachmentId: new UniqueEntityID('1'),
      }),
      makeAnswerAttachment({
        answerId: answerToBeDeleted.id,
        attachmentId: new UniqueEntityID('2'),
      }),
    )

    const answerThree = makeAnswer()
    inMemoryAnswersRepository.create(answerThree)

    await sut.execute({
      answerId: 'answer-2',
      authorId: 'author-2',
    })

    expect(inMemoryAnswersRepository.items).toHaveLength(2)
    expect(inMemoryAnswerAttachmentsRepository.items).toHaveLength(0)
  })

  it('should not be able to delete a answer from another user', async () => {
    const answer = makeAnswer(
      {
        authorId: new UniqueEntityID('author-1'),
      },
      new UniqueEntityID('answer-1'),
    )
    inMemoryAnswersRepository.create(answer)

    const result = await sut.execute({
      answerId: 'answer-1',
      authorId: 'another-author',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
