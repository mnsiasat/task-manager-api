import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator'
import { Transform } from 'class-transformer'
import _ from 'lodash'

export enum Status {
  TO_DO = 'To Do',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

export interface Task {
  id: number
  title: string
  status: Status
  description?: string
}

export class CreateTaskDto implements Partial<Task> {
  @IsNotEmpty()
  @IsString()
  title!: string

  @IsString()
  description?: string
}

export class UpdateTaskDto implements Partial<Task> {
  @IsNotEmpty()
  @IsString()
  title?: string

  @IsNotEmpty()
  @Transform(({ value }) => _.snakeCase(value).toUpperCase())
  @IsEnum(Status)
  status?: Status

  @IsString()
  description?: string
}
