import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator'
import { Transform } from 'class-transformer'

enum Status {
  PENDING,
  APPROVED,
  REJECTED,
}

export interface Task {
  id: number
  title: string
  status: Status
  description: string
}

export class CreateTaskDto implements Partial<Task> {
  @IsNotEmpty()
  @IsString()
  title!: string

  @IsNotEmpty()
  @Transform(({ value }) => ('' + value).toUpperCase())
  @IsEnum(Status)
  status!: Status

  @IsNotEmpty()
  @IsString()
  description!: string
}

export class UpdateTaskDto implements Partial<Task> {
  @IsNotEmpty()
  @IsString()
  title?: string

  @IsNotEmpty()
  @Transform(({ value }) => ('' + value).toUpperCase())
  @IsEnum(Status)
  status?: Status

  @IsNotEmpty()
  @IsString()
  description?: string
}
