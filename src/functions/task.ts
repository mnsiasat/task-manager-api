import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as uuid from 'uuid'
import validateDTO from '../utils/validate'
import { CreateTaskDto, UpdateTaskDto } from '../interfaces/task'
import dynamoDb from '../dynamo'
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb'

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
export const createHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing payload',
        }),
      }
    }
    const data = await validateDTO(CreateTaskDto, JSON.parse(event.body))
    if (Array.isArray(data)) {
      return {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 400,
        body: JSON.stringify({
          message: `Validation Error: ${data}`,
        }),
      }
    }

    const timestamp = new Date().getTime()
    const id = uuid.v1()
    const result = await dynamoDb.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          ...data,
          id,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      }),
    )

    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully saved new task: ${id}`,
      }),
    }
  } catch (err) {
    console.error(err)
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 500,
      body: JSON.stringify({
        message: `Error encountered creating new task: ${event.body}`,
      }),
    }
  }
}

export const updateHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing payload',
        }),
      }
    }
    const id = event.pathParameters?.id
    if (!id) {
      return {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing id from path parameter',
        }),
      }
    }

    if (event.body.length < 1) {
      return {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid payload for update task.',
        }),
      }
    }

    const existing = await dynamoDb.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          id,
        },
      }),
    )
    if (!existing || !existing.Item) {
      return {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 400,
        body: JSON.stringify({
          message: `No record matched for invalid ID: ${id}`,
        }),
      }
    }

    const data = JSON.parse(event.body)
    await dynamoDb.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          ...data,
          updatedAt: new Date().getTime(),
        },
      }),
    )

    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully updated task: ${data.id}`,
      }),
    }
  } catch (err) {
    console.error(err)
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 500,
      body: JSON.stringify({
        message: `Error encountered updating task: ${event.body}`,
      }),
    }
  }
}

export const getAllHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const response = await dynamoDb.send(
      new ScanCommand({ TableName: process.env.TABLE_NAME }),
    )
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
      body: JSON.stringify(response.Items),
    }
  } catch (err) {
    console.error(err)
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error encountered retrieving all tasks',
      }),
    }
  }
}

export const getByIdHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing id from path parameter',
        }),
      }
    }
    const response = await dynamoDb.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id },
      }),
    )
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
      body: JSON.stringify(response),
    }
  } catch (err) {
    console.error(err)
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 500,
      body: JSON.stringify({
        message: `Error encountered retrieving task by id: ${event.pathParameters?.id}`,
      }),
    }
  }
}

export const deleteHandler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id
    if (!id) {
      return {
        headers: { 'Content-Type': 'application/json' },
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing id from path parameter',
        }),
      }
    }
    await dynamoDb.send(
      new DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          id,
        },
      }),
    )
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully deleted task: ${event.pathParameters?.id}`,
      }),
    }
  } catch (err) {
    console.error(err)
    return {
      headers: { 'Content-Type': 'application/json' },
      statusCode: 500,
      body: JSON.stringify({
        message: `Error encountered deleting task by id: ${event.pathParameters?.id}`,
      }),
    }
  }
}
