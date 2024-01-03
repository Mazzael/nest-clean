import { InMemoryAnswersRepository } from 'test/repositories/in-memory-answers-repository'
import { makeAnswer } from 'test/factories/make-answer'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { EditAnswerUseCase } from './edit-answer'
import { NotAllowedError } from './errors/not-allowed-error'
import { InMemoryAnswerAttachmentsRepository } from 'test/repositories/in-memory-answer-attachments-repository'
import { makeAnswerAttachment } from 'test/factories/make-answer-attachment'

let inMemoryAnswersRepository: InMemoryAnswersRepository
let inMemoryAnswerAttachmentsRepository: InMemoryAnswerAttachmentsRepository
let sut: EditAnswerUseCase

describe('Edit Answer', () => {
  beforeEach(() => {
    inMemoryAnswerAttachmentsRepository =
      new InMemoryAnswerAttachmentsRepository()
    inMemoryAnswersRepository = new InMemoryAnswersRepository(
      inMemoryAnswerAttachmentsRepository,
    )
    sut = new EditAnswerUseCase(
      inMemoryAnswersRepository,
      inMemoryAnswerAttachmentsRepository,
    )
  })

  it('should be able to edit a answer', async () => {
    const answerOne = makeAnswer()
    await inMemoryAnswersRepository.create(answerOne)

    const answerToBeEdited = makeAnswer(
      {
        authorId: new UniqueEntityID('author-2'),
        content: 'Testing Edit Use Case',
      },
      new UniqueEntityID('answer-2'),
    )
    await inMemoryAnswersRepository.create(answerToBeEdited)

    inMemoryAnswerAttachmentsRepository.items.push(
      makeAnswerAttachment({
        answerId: answerToBeEdited.id,
        attachmentId: new UniqueEntityID('1'),
      }),
      makeAnswerAttachment({
        answerId: answerToBeEdited.id,
        attachmentId: new UniqueEntityID('2'),
      }),
    )

    const answerThree = makeAnswer()
    inMemoryAnswersRepository.create(answerThree)

    await sut.execute({
      answerId: 'answer-2',
      authorId: 'author-2',
      content: 'New answer content',
      attachmentsIds: ['1', '3'],
    })

    expect(answerToBeEdited.content).toEqual('New answer content')
    expect(inMemoryAnswersRepository.items[1]).toMatchObject({
      content: 'New answer content',
    })
    expect(
      inMemoryAnswersRepository.items[1].attachments.currentItems,
    ).toHaveLength(2)
    expect(inMemoryAnswersRepository.items[1].attachments.currentItems).toEqual(
      [
        expect.objectContaining({ attachmentId: new UniqueEntityID('1') }),
        expect.objectContaining({ attachmentId: new UniqueEntityID('3') }),
      ],
    )
  })

  it('should not be able to edit a answer from another user', async () => {
    const answer = makeAnswer(
      {
        authorId: new UniqueEntityID('author-2'),
        content: 'Testing Edit Use Case',
      },
      new UniqueEntityID('answer-1'),
    )
    inMemoryAnswersRepository.create(answer)

    const result = await sut.execute({
      answerId: 'answer-1',
      authorId: 'another-author',
      content: 'New answer content',
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should sync new and removed attachments when editing an answer', async () => {
    const answerOne = makeAnswer()
    await inMemoryAnswersRepository.create(answerOne)

    const answerToBeEdited = makeAnswer(
      {
        authorId: new UniqueEntityID('author-2'),
        content: 'Testing Edit Use Case',
      },
      new UniqueEntityID('answer-2'),
    )
    await inMemoryAnswersRepository.create(answerToBeEdited)

    inMemoryAnswerAttachmentsRepository.items.push(
      makeAnswerAttachment({
        answerId: answerToBeEdited.id,
        attachmentId: new UniqueEntityID('1'),
      }),
      makeAnswerAttachment({
        answerId: answerToBeEdited.id,
        attachmentId: new UniqueEntityID('2'),
      }),
    )

    const answerThree = makeAnswer()
    inMemoryAnswersRepository.create(answerThree)

    const result = await sut.execute({
      answerId: answerToBeEdited.id.toString(),
      authorId: 'author-2',
      content: 'New answer content',
      attachmentsIds: ['1', '3'],
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryAnswerAttachmentsRepository.items).toHaveLength(2)
    expect(inMemoryAnswerAttachmentsRepository.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attachmentId: new UniqueEntityID('1'),
        }),
        expect.objectContaining({
          attachmentId: new UniqueEntityID('3'),
        }),
      ]),
    )
  })
})
