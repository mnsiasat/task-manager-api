import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'

export default async function validateDTO<T extends object>(
  dtoClass: new () => T,
  plainObject: object,
): Promise<T | string[]> {
  const dtoObj = plainToInstance(dtoClass, plainObject)
  const errors = await validate(dtoObj)

  if (errors.length > 0) {
    return errors.flatMap((error) => Object.values(error.constraints || {}))
  }

  return dtoObj
}
