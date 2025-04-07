import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	DynamoDBDocumentClient,
	GetCommand,
	UpdateCommand,
	DeleteCommand,
	GetCommandInput,
	UpdateCommandInput,
	DeleteCommandInput
} from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';

const client = new DynamoDBClient({
	region: process.env.AWS_REGION
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE;

export async function GET(request: NextRequest, { params }) {
	try {
		const { id } = params;

		const getParams: GetCommandInput = {
			TableName: TABLE_NAME,
			Key: { id }
		};

		const command = new GetCommand(getParams);
		const response = await docClient.send(command);

		if (!response.Item) {
			return NextResponse.json(
				{
					success: false,
					error: 'Todo not found'
				},
				{ status: 404 }
			);
		}

		return NextResponse.json(
			{
				success: true,
				todo: response.Item
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error fetching todo:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Failed to fetch todo'
			},
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest, { params }) {
	try {
		const { id } = params;
		const body = await request.json();

		const getParams: GetCommandInput = {
			TableName: TABLE_NAME,
			Key: { id }
		};

		const getCommand = new GetCommand(getParams);
		const existingTodo = await docClient.send(getCommand);

		if (!existingTodo.Item) {
			return NextResponse.json(
				{
					success: false,
					error: 'Todo not found'
				},
				{ status: 404 }
			);
		}

		const updateParams: UpdateCommandInput = {
			TableName: TABLE_NAME,
			Key: { id },
			UpdateExpression:
				'set title = :title, completed = :completed, updatedAt = :updatedAt',
			ExpressionAttributeValues: {
				':title': body.title || existingTodo.Item.title,
				':completed':
					body.completed !== undefined
						? body.completed
						: existingTodo.Item.completed,
				':updatedAt': new Date().toISOString()
			},
			ReturnValues: 'ALL_NEW'
		};

		const updateCommand = new UpdateCommand(updateParams);
		const updatedTodo = await docClient.send(updateCommand);

		return NextResponse.json(
			{
				success: true,
				todo: updatedTodo.Attributes
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error updating todo:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Failed to update todo'
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest, { params }) {
	try {
		const { id } = params;

		const getParams: GetCommandInput = {
			TableName: TABLE_NAME,
			Key: { id }
		};

		const getCommand = new GetCommand(getParams);
		const existingTodo = await docClient.send(getCommand);

		if (!existingTodo.Item) {
			return NextResponse.json(
				{
					success: false,
					error: 'Todo not found'
				},
				{ status: 404 }
			);
		}

		const deleteParams: DeleteCommandInput = {
			TableName: TABLE_NAME,
			Key: { id }
		};

		const deleteCommand = new DeleteCommand(deleteParams);
		await docClient.send(deleteCommand);

		return NextResponse.json(
			{
				success: true,
				message: 'Todo deleted successfully'
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error deleting todo:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Failed to delete todo'
			},
			{ status: 500 }
		);
	}
}
