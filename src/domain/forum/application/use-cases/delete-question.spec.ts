import { InMemoryQuestionsRepository } from 'test/repositories/in-memory-questions-repository'
import { DeleteQuestionUseCase } from './delete-question'
import { makeQuestion } from 'test/factories/make-question'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from './errors/not-allowed-error'
import { InMemoryQuestionAttachmentsRepository } from 'test/repositories/in-memory-question-attachments-repository'
import { makeQuestionAttachment } from 'test/factories/make-question-attachment'

let inMemoryQuestionsRepository: InMemoryQuestionsRepository
let inMemoryQuestionAttachmentsRepository: InMemoryQuestionAttachmentsRepository
let sut: DeleteQuestionUseCase

describe('Delete Question', () => {
  beforeEach(() => {
    inMemoryQuestionAttachmentsRepository =
      new InMemoryQuestionAttachmentsRepository()
    inMemoryQuestionsRepository = new InMemoryQuestionsRepository(
      inMemoryQuestionAttachmentsRepository,
    )
    sut = new DeleteQuestionUseCase(inMemoryQuestionsRepository)
  })

  it('should be able to delete a question', async () => {
    const questionOne = makeQuestion()
    await inMemoryQuestionsRepository.create(questionOne)

    const questionToBeDeleted = makeQuestion(
      {
        authorId: new UniqueEntityID('author-2'),
      },
      new UniqueEntityID('question-2'),
    )
    inMemoryQuestionsRepository.create(questionToBeDeleted)

    inMemoryQuestionAttachmentsRepository.items.push(
      makeQuestionAttachment({
        questionId: questionToBeDeleted.id,
        attachmentId: new UniqueEntityID('1'),
      }),
      makeQuestionAttachment({
        questionId: questionToBeDeleted.id,
        attachmentId: new UniqueEntityID('2'),
      }),
    )

    const questionThree = makeQuestion()
    inMemoryQuestionsRepository.create(questionThree)

    await sut.execute({
      questionId: 'question-2',
      authorId: 'author-2',
    })

    expect(inMemoryQuestionsRepository.items).toHaveLength(2)
    expect(inMemoryQuestionAttachmentsRepository.items).toHaveLength(0)
  })

  it('should not be able to delete a question from another user', async () => {
    const question = makeQuestion(
      {
        authorId: new UniqueEntityID('author-1'),
      },
      new UniqueEntityID('question-1'),
    )
    inMemoryQuestionsRepository.create(question)

    const result = await sut.execute({
      questionId: 'question-1',
      authorId: 'another-author',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
