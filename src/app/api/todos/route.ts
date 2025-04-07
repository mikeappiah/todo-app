import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	DynamoDBDocumentClient,
	ScanCommand,
	PutCommand,
	ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import { NextRequest, NextResponse } from 'next/server';

const client = new DynamoDBClient({
	region: process.env.AWS_REGION
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE;

export async function GET() {
	try {
		const params: ScanCommandInput = {
			TableName: TABLE_NAME
		};

		const command = new ScanCommand(params);

		const response = await docClient.send(command);

		return NextResponse.json(
			{
				success: true,
				todos: response.Items
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error fetching todos:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Failed to fetch todos'
			},
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		if (!body.title) {
			return NextResponse.json(
				{
					success: false,
					error: 'Title is required'
				},
				{ status: 400 }
			);
		}

		const todoItem = {
			id: Date.now().toString(),
			title: body.title,
			completed: body.completed || false,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const command = new PutCommand({
			TableName: TABLE_NAME,
			Item: todoItem
		});

		await docClient.send(command);

		return NextResponse.json(
			{
				success: true,
				todo: todoItem
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating todo:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Failed to create todo'
			},
			{ status: 500 }
		);
	}
}
