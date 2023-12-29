import { InMemoryQuestionsRepository } from 'test/repositories/in-memory-questions-repository'
import { makeQuestion } from 'test/factories/make-question'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { EditQuestionUseCase } from './edit-question'
import { NotAllowedError } from './errors/not-allowed-error'
import { InMemoryQuestionAttachmentsRepository } from 'test/repositories/in-memory-question-attachments-repository'
import { makeQuestionAttachment } from 'test/factories/make-question-attachment'

let inMemoryQuestionsRepository: InMemoryQuestionsRepository
let inMemoryQuestionAttachmentsRepository: InMemoryQuestionAttachmentsRepository
let sut: EditQuestionUseCase

describe('Edit Question', () => {
  beforeEach(() => {
    inMemoryQuestionAttachmentsRepository =
      new InMemoryQuestionAttachmentsRepository()
    inMemoryQuestionsRepository = new InMemoryQuestionsRepository(
      inMemoryQuestionAttachmentsRepository,
    )
    sut = new EditQuestionUseCase(
      inMemoryQuestionsRepository,
      inMemoryQuestionAttachmentsRepository,
    )
  })

  it('should be able to edit a question', async () => {
    const questionOne = makeQuestion()
    await inMemoryQuestionsRepository.create(questionOne)

    const questionToBeEdited = makeQuestion(
      {
        authorId: new UniqueEntityID('author-2'),
        title: 'Test Question',
        content: 'Testing Edit Use Case',
      },
      new UniqueEntityID('question-2'),
    )
    await inMemoryQuestionsRepository.create(questionToBeEdited)

    inMemoryQuestionAttachmentsRepository.items.push(
      makeQuestionAttachment({
        questionId: questionToBeEdited.id,
        attachmentId: new UniqueEntityID('1'),
      }),
      makeQuestionAttachment({
        questionId: questionToBeEdited.id,
        attachmentId: new UniqueEntityID('2'),
      }),
    )

    const questionThree = makeQuestion()
    inMemoryQuestionsRepository.create(questionThree)

    await sut.execute({
      questionId: 'question-2',
      authorId: 'author-2',
      content: 'New question content',
      title: 'New question title',
      attachmentsIds: ['1', '3'],
    })

    expect(questionToBeEdited.content).toEqual('New question content')
    expect(inMemoryQuestionsRepository.items[1]).toMatchObject({
      content: 'New question content',
      title: 'New question title',
    })
    expect(
      inMemoryQuestionsRepository.items[1].attachments.currentItems,
    ).toHaveLength(2)
    expect(
      inMemoryQuestionsRepository.items[1].attachments.currentItems,
    ).toEqual([
      expect.objectContaining({ attachmentId: new UniqueEntityID('1') }),
      expect.objectContaining({ attachmentId: new UniqueEntityID('3') }),
    ])
  })

  it('should not be able to edit a question from another user', async () => {
    const questionToBeDeleted = makeQuestion(
      {
        authorId: new UniqueEntityID('author-2'),
        title: 'Test Question',
        content: 'Testing Edit Use Case',
      },
      new UniqueEntityID('question-1'),
    )
    inMemoryQuestionsRepository.create(questionToBeDeleted)

    const result = await sut.execute({
      questionId: 'question-1',
      authorId: 'another-author',
      content: 'New question content',
      title: 'New question title',
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})